"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";

type BookingRequestFormProps = {
  robotId: string;
  isAuthenticated: boolean;
};

type ApiState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const fieldClass =
  "w-full rounded-md border border-stone-300 bg-[#F7F0E8] px-3 py-3 text-sm text-stone-950 outline-none placeholder:text-stone-500 focus:border-stone-900";

export function BookingRequestForm({ robotId, isAuthenticated }: BookingRequestFormProps) {
  const [state, setState] = useState<ApiState>({ status: "idle", message: "" });
  const [open, setOpen] = useState(false);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const requestedStart = localDateToIso(formData.get("requestedStart"));
    const requestedEnd = localDateToIso(formData.get("requestedEnd"));

    if (!requestedStart || !requestedEnd) {
      setState({ status: "error", message: "Choose a valid start and end time." });
      return;
    }

    if (new Date(requestedEnd) <= new Date(requestedStart)) {
      setState({ status: "error", message: "End time must be after start time." });
      return;
    }

    if (formData.get("safetyAcknowledged") !== "on") {
      setState({ status: "error", message: "Confirm the safety acknowledgement before sending." });
      return;
    }

    setState({ status: "loading", message: "Sending request to owner..." });
    const response = await fetch("/api/v1/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        robotId,
        requestedStart,
        requestedEnd,
        deliveryAddress: formData.get("deliveryAddress"),
        deliveryLatitude: Number(formData.get("deliveryLatitude")),
        deliveryLongitude: Number(formData.get("deliveryLongitude")),
        taskDescription: formData.get("taskDescription"),
        safetyAcknowledged: formData.get("safetyAcknowledged") === "on",
      }),
    });
    const result = await readJson(response);

    if (!response.ok) {
      setState({
        status: "error",
        message: formatError(result),
      });
      return;
    }

    setState({ status: "success", message: "Request sent. The owner can approve or reject it from their dashboard." });
    event.currentTarget.reset();
    setOpen(false);
  }

  if (!isAuthenticated) {
    return (
      <Link
        className="block w-full rounded-md bg-stone-950 px-4 py-3 text-center text-sm font-semibold text-[#F7F0E8] hover:bg-stone-800"
        href={`/auth/login?next=${encodeURIComponent(`/robots/${robotId}`)}`}
      >
        Log in to request
      </Link>
    );
  }

  return (
    <>
      <button
        className="w-full rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-[#F7F0E8] hover:bg-stone-800"
        onClick={() => setOpen(true)}
        type="button"
      >
        Request to hire
      </button>
      {state.message ? (
        <p
          className={`mt-3 rounded-md border px-3 py-2 text-sm ${
            state.status === "error"
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <Modal
        description="Choose the rental window, delivery point, and task details. The owner will review before confirming."
        onClose={() => setOpen(false)}
        open={open}
        title="Request this robot"
      >
        <form className="space-y-3" onSubmit={submitRequest}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-stone-700">
              <span>Start</span>
              <input className={fieldClass} name="requestedStart" required type="datetime-local" />
            </label>
            <label className="space-y-1 text-sm font-medium text-stone-700">
              <span>End</span>
              <input className={fieldClass} name="requestedEnd" required type="datetime-local" />
            </label>
          </div>
          <label className="space-y-1 text-sm font-medium text-stone-700">
            <span>Delivery address</span>
            <input className={fieldClass} name="deliveryAddress" required />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-stone-700">
              <span>Latitude</span>
              <input className={fieldClass} defaultValue="-1.286389" name="deliveryLatitude" required step="any" type="number" />
            </label>
            <label className="space-y-1 text-sm font-medium text-stone-700">
              <span>Longitude</span>
              <input className={fieldClass} defaultValue="36.817223" name="deliveryLongitude" required step="any" type="number" />
            </label>
          </div>
          <label className="space-y-1 text-sm font-medium text-stone-700">
            <span>Task description</span>
            <textarea className={`${fieldClass} min-h-28`} name="taskDescription" required />
          </label>
          <label className="flex items-center gap-3 rounded-md border border-stone-300 bg-[#F7F0E8] px-3 py-3 text-sm text-stone-700">
            <input className="h-4 w-4 accent-stone-950" name="safetyAcknowledged" required type="checkbox" />
            I understand safety and payment authorization are required before approval.
          </label>
          <button
            className="w-full rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-[#F7F0E8] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={state.status === "loading"}
          >
            Send request
          </button>
        </form>
      </Modal>
    </>
  );
}

function localDateToIso(value: FormDataEntryValue | null) {
  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return { error: "Service is temporarily unavailable" };
  }
}

function formatError(result: { error?: string; fields?: Record<string, string[]> }) {
  const fieldMessages = result.fields
    ? Object.entries(result.fields)
        .filter(([, messages]) => messages.length > 0)
        .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
    : [];

  if (fieldMessages.length) {
    return fieldMessages.join("; ");
  }

  return result.error ?? "Request failed";
}
