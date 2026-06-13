import argparse
import json
import math
import wave
from pathlib import Path

import numpy as np


def read_wav(path):
    with wave.open(str(path), "rb") as wf:
        channels = wf.getnchannels()
        sample_rate = wf.getframerate()
        sample_width = wf.getsampwidth()
        frames = wf.readframes(wf.getnframes())

    if sample_width != 2:
        raise ValueError(f"Expected 16-bit PCM WAV, got {sample_width * 8}-bit: {path}")

    audio = np.frombuffer(frames, dtype="<i2").astype(np.float32) / 32768.0
    if channels > 1:
        audio = audio.reshape(-1, channels).mean(axis=1)
    return sample_rate, audio


def write_wav(path, sample_rate, audio):
    path.parent.mkdir(parents=True, exist_ok=True)
    audio = np.asarray(audio, dtype=np.float32)
    audio = audio / max(1.0, float(np.max(np.abs(audio))) / 0.98)
    pcm = np.clip(audio * 32767.0, -32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm.tobytes())


def frame_signal(audio, frame_size, hop):
    if len(audio) < frame_size:
        padded = np.zeros(frame_size, dtype=np.float32)
        padded[: len(audio)] = audio
        return padded[None, :]
    count = 1 + (len(audio) - frame_size) // hop
    shape = (count, frame_size)
    strides = (audio.strides[0] * hop, audio.strides[0])
    return np.lib.stride_tricks.as_strided(audio, shape=shape, strides=strides)


def active_frames(audio, frame_size=2048, hop=512):
    frames = frame_signal(audio, frame_size, hop).copy()
    rms = np.sqrt(np.mean(frames * frames, axis=1) + 1e-12)
    cutoff = max(np.percentile(rms, 68) * 0.45, np.max(rms) * 0.035)
    return frames[rms >= cutoff]


def spectral_profile(audio, n_fft=4096, hop=1024):
    frames = active_frames(audio, n_fft, hop)
    window = np.hanning(n_fft).astype(np.float32)
    mag = np.abs(np.fft.rfft(frames * window, axis=1)) + 1e-7
    profile = np.median(mag, axis=0)
    profile /= np.exp(np.mean(np.log(profile + 1e-7)))
    return profile


def smooth_profile(values, width=45):
    width = max(3, int(width) | 1)
    kernel = np.hanning(width)
    kernel /= kernel.sum()
    padded = np.pad(values, (width // 2, width // 2), mode="edge")
    return np.convolve(padded, kernel, mode="valid")


def estimate_f0(audio, sample_rate):
    frames = active_frames(audio, int(0.05 * sample_rate), int(0.015 * sample_rate))
    if len(frames) == 0:
        return None
    min_lag = int(sample_rate / 320.0)
    max_lag = int(sample_rate / 80.0)
    picks = []
    for frame in frames[: min(len(frames), 1200)]:
        frame = frame - np.mean(frame)
        energy = float(np.dot(frame, frame))
        if energy < 1e-5:
            continue
        corr = np.correlate(frame, frame, mode="full")[len(frame) - 1 :]
        corr[:min_lag] = 0
        segment = corr[min_lag:max_lag]
        if len(segment) == 0:
            continue
        lag = int(np.argmax(segment) + min_lag)
        confidence = corr[lag] / (energy + 1e-9)
        if confidence > 0.28:
            picks.append(sample_rate / lag)
    if not picks:
        return None
    return float(np.median(picks))


def apply_profile(source, source_profile, target_profile, n_fft=4096, hop=1024, strength=0.72):
    ratio = target_profile / np.maximum(source_profile, 1e-7)
    ratio = smooth_profile(ratio, width=61)
    ratio = np.clip(ratio, 0.42, 2.35)
    ratio = np.power(ratio, strength)

    window = np.hanning(n_fft).astype(np.float32)
    out = np.zeros(len(source) + n_fft, dtype=np.float32)
    norm = np.zeros(len(source) + n_fft, dtype=np.float32)

    for start in range(0, max(1, len(source) - n_fft), hop):
        frame = source[start : start + n_fft]
        if len(frame) < n_fft:
            frame = np.pad(frame, (0, n_fft - len(frame)))
        spec = np.fft.rfft(frame * window)
        processed = np.fft.irfft(spec * ratio, n=n_fft).astype(np.float32)
        out[start : start + n_fft] += processed * window
        norm[start : start + n_fft] += window * window

    valid = norm > 1e-6
    out[valid] /= norm[valid]
    return out[: len(source)]


def stft(audio, n_fft=2048, hop=512):
    window = np.hanning(n_fft).astype(np.float32)
    frames = []
    for start in range(0, max(1, len(audio) - n_fft), hop):
        frame = audio[start : start + n_fft]
        if len(frame) < n_fft:
            frame = np.pad(frame, (0, n_fft - len(frame)))
        frames.append(np.fft.rfft(frame * window))
    return np.asarray(frames).T


def istft(spec, length, n_fft=2048, hop=512):
    window = np.hanning(n_fft).astype(np.float32)
    out = np.zeros(length + n_fft, dtype=np.float32)
    norm = np.zeros(length + n_fft, dtype=np.float32)
    for idx in range(spec.shape[1]):
        frame = np.fft.irfft(spec[:, idx], n=n_fft).astype(np.float32)
        start = idx * hop
        out[start : start + n_fft] += frame * window
        norm[start : start + n_fft] += window * window
    valid = norm > 1e-6
    out[valid] /= norm[valid]
    return out[:length]


def time_stretch_phase_vocoder(audio, rate, n_fft=2048, hop=512):
    if abs(rate - 1.0) < 0.015:
        return audio.copy()
    spec = stft(audio, n_fft, hop)
    bins, frame_count = spec.shape
    time_steps = np.arange(0, max(1, frame_count - 1), rate, dtype=np.float32)
    phase_acc = np.angle(spec[:, 0])
    omega = 2.0 * np.pi * hop * np.arange(bins) / float(n_fft)
    out = np.zeros((bins, len(time_steps)), dtype=np.complex64)

    for out_idx, step in enumerate(time_steps):
        base = int(np.floor(step))
        frac = float(step - base)
        left = spec[:, base]
        right = spec[:, min(base + 1, frame_count - 1)]
        mag = (1.0 - frac) * np.abs(left) + frac * np.abs(right)
        phase_delta = np.angle(right) - np.angle(left) - omega
        phase_delta -= 2.0 * np.pi * np.round(phase_delta / (2.0 * np.pi))
        phase_acc += omega + phase_delta
        out[:, out_idx] = mag * np.exp(1j * phase_acc)

    stretched_len = max(1, int(round(len(audio) / rate)))
    return istft(out, stretched_len, n_fft, hop)


def resample_to_length(audio, length):
    if len(audio) == length:
        return audio.copy()
    src_x = np.linspace(0.0, 1.0, num=len(audio), endpoint=True)
    dst_x = np.linspace(0.0, 1.0, num=length, endpoint=True)
    return np.interp(dst_x, src_x, audio).astype(np.float32)


def pitch_shift_preserve_duration(audio, factor):
    factor = float(np.clip(factor, 0.86, 1.16))
    if abs(factor - 1.0) < 0.02:
        return audio
    stretched = time_stretch_phase_vocoder(audio, 1.0 / factor)
    return resample_to_length(stretched, len(audio))


def tilt_and_presence(audio, sample_rate, target_brightness, source_brightness):
    fft_size = 8192
    freqs = np.fft.rfftfreq(fft_size, 1.0 / sample_rate)
    delta = float(np.clip(target_brightness - source_brightness, -0.35, 0.35))
    tilt = np.power(np.maximum(freqs, 80.0) / 1000.0, delta)
    presence = 1.0 + 0.08 * np.exp(-0.5 * ((freqs - 2800.0) / 900.0) ** 2)
    air = 1.0 + 0.04 * np.exp(-0.5 * ((freqs - 6500.0) / 1800.0) ** 2)
    curve = np.clip(tilt * presence * air, 0.55, 1.75)

    hop = fft_size // 4
    window = np.hanning(fft_size).astype(np.float32)
    out = np.zeros(len(audio) + fft_size, dtype=np.float32)
    norm = np.zeros(len(audio) + fft_size, dtype=np.float32)
    for start in range(0, max(1, len(audio) - fft_size), hop):
        frame = audio[start : start + fft_size]
        if len(frame) < fft_size:
            frame = np.pad(frame, (0, fft_size - len(frame)))
        spec = np.fft.rfft(frame * window)
        processed = np.fft.irfft(spec * curve, n=fft_size).astype(np.float32)
        out[start : start + fft_size] += processed * window
        norm[start : start + fft_size] += window * window
    valid = norm > 1e-6
    out[valid] /= norm[valid]
    return out[: len(audio)]


def spectral_brightness(audio, sample_rate):
    frames = active_frames(audio, 4096, 1024)
    if len(frames) == 0:
        return 0.0
    freqs = np.fft.rfftfreq(4096, 1.0 / sample_rate)
    mag = np.abs(np.fft.rfft(frames * np.hanning(4096), axis=1)) + 1e-8
    low = mag[:, (freqs >= 120) & (freqs < 1100)].mean()
    high = mag[:, (freqs >= 1800) & (freqs < 7200)].mean()
    return float(math.log((high + 1e-8) / (low + 1e-8)))


def rms_active(audio):
    frames = active_frames(audio, 2048, 512)
    return float(np.sqrt(np.mean(frames * frames) + 1e-12))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--target", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()

    src_sr, source = read_wav(args.source)
    tgt_sr, target = read_wav(args.target)
    if src_sr != tgt_sr:
        raise ValueError(f"Sample rates differ: source {src_sr}, target {tgt_sr}")

    source_profile = spectral_profile(source)
    target_profile = spectral_profile(target)
    source_f0 = estimate_f0(source, src_sr)
    target_f0 = estimate_f0(target, tgt_sr)
    source_brightness = spectral_brightness(source, src_sr)
    target_brightness = spectral_brightness(target, tgt_sr)

    processed = apply_profile(source, source_profile, target_profile)
    pitch_factor = None
    if source_f0 and target_f0:
        pitch_factor = float(np.clip(target_f0 / source_f0, 0.9, 1.1))
        processed = pitch_shift_preserve_duration(processed, pitch_factor)
    processed = tilt_and_presence(processed, src_sr, target_brightness, source_brightness)

    target_rms = rms_active(target)
    processed_rms = rms_active(processed)
    if processed_rms > 1e-7:
        processed *= min(2.5, target_rms / processed_rms)

    # Gentle speech mastering: control peaks while leaving the voice natural.
    processed = np.tanh(processed * 1.12) / np.tanh(1.12)
    peak = float(np.max(np.abs(processed)) + 1e-9)
    processed *= 0.96 / peak

    write_wav(args.out, src_sr, processed)
    report = {
        "source_sample_rate": src_sr,
        "source_duration_seconds": round(len(source) / src_sr, 3),
        "target_duration_seconds": round(len(target) / tgt_sr, 3),
        "source_estimated_f0_hz": None if source_f0 is None else round(source_f0, 1),
        "target_estimated_f0_hz": None if target_f0 is None else round(target_f0, 1),
        "applied_pitch_factor": None if pitch_factor is None else round(pitch_factor, 4),
        "source_brightness_log_ratio": round(source_brightness, 4),
        "target_brightness_log_ratio": round(target_brightness, 4),
        "note": "This matches timbre/EQ and level locally. Accent cannot be changed by filtering alone.",
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
