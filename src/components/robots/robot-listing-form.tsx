"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ApiState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type Robot = {
  id: string;
  name: string;
  category: string;
  description: string;
  capabilities: string[];
  photos: string[];
  manufacturer: string | null;
  modelNumber: string | null;
  pricePerHour: number;
  pricePerDay: number;
  depositAmount: number;
  currency: string;
  minRentalHours: number;
  maxRentalHours: number | null;
  availabilityZone: string;
  latitude: number;
  longitude: number;
  requiresOperator: boolean;
  isAvailable: boolean;
  status: string;
};

const fieldClass =
  "w-full rounded-md border border-stone-300 bg-[#F7F0E8] px-3 py-3 text-sm text-stone-950 outline-none placeholder:text-stone-500 focus:border-stone-900";

const labelClass = "space-y-1 text-sm font-medium text-stone-700";

export function RobotListingForm({ robotId }: { robotId?: string }) {
  const router = useRouter();
  const [listingState, setListingState] = useState<ApiState>({
    status: "idle",
    message: "",
  });
  const [kycState, setKycState] = useState<ApiState>({
    status: "idle",
    message: "",
  });
  const [robot, setRobot] = useState<Robot | null>(null);
  const [activeRobotId, setActiveRobotId] = useState<string | null>(robotId ?? null);

  useEffect(() => {
    if (!robotId) {
      return;
    }

    let canceled = false;

    fetch(`/api/v1/robots/${robotId}`)
      .then(readJson)
      .then((result) => {
        if (canceled) {
          return;
        }

        if (result.robot) {
          setRobot(result.robot);
          setListingState({ status: "idle", message: "" });
        } else {
          setListingState({ status: "error", message: result.error ?? "Robot not found" });
        }
      });

    return () => {
      canceled = true;
    };
  }, [robotId]);

  async function submitKyc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setKycState({ status: "loading", message: "Submitting identity review..." });
    const response = await fetch("/api/v1/users/me/verify-identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityDocumentUrl: formData.get("identityDocumentUrl"),
      }),
    });
    const result = await readJson(response);

    if (!response.ok) {
      setKycState({ status: "error", message: result.error ?? "Identity review failed" });
      return;
    }

    setKycState({ status: "success", message: "Identity review submitted" });
    router.refresh();
  }

  async function saveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const isEdit = Boolean(activeRobotId);
    setListingState({
      status: "loading",
      message: isEdit ? "Updating robot profile..." : "Saving robot draft...",
    });

    const payload = buildRobotPayload(formData);
    const response = await fetch(isEdit ? `/api/v1/robots/${activeRobotId}` : "/api/v1/robots", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await readJson(response);

    if (!response.ok) {
      setListingState({
        status: "error",
        message: result.error ?? "Robot profile could not be saved",
      });
      return;
    }

    setRobot(result.robot);
    setActiveRobotId(result.robot.id);
    setListingState({
      status: "success",
      message: isEdit ? "Robot profile updated" : result.reason ?? "Robot draft saved",
    });
    router.refresh();
  }

  async function publishListing() {
    if (!activeRobotId) {
      setListingState({ status: "error", message: "Create a draft first" });
      return;
    }

    setListingState({ status: "loading", message: "Publishing robot..." });
    const response = await fetch(`/api/v1/robots/${activeRobotId}/publish`, {
      method: "POST",
    });
    const result = await readJson(response);

    if (!response.ok) {
      setListingState({
        status: "error",
        message: result.error ?? "Publish failed",
      });
      return;
    }

    setRobot(result.robot);
    setListingState({ status: "success", message: "Robot published" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <form onSubmit={submitKyc} className="h-fit rounded-lg border border-stone-300 bg-[#FFFDF8] p-5">
          <p className="font-mono text-xs uppercase text-stone-500">Owner trust</p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-950">Identity review</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Keep publishing gated behind owner verification in production. Local review
            remains lightweight so the workflow is testable.
          </p>
          <div className="mt-5 space-y-3">
            <label className={labelClass}>
              <span>Identity document URL</span>
              <input
                className={fieldClass}
                name="identityDocumentUrl"
                placeholder="https://..."
                required
                type="url"
              />
            </label>
            <button
              className="w-full rounded-md border border-stone-900 bg-stone-950 px-4 py-3 text-sm font-semibold text-[#F7F0E8] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={kycState.status === "loading"}
            >
              Submit review
            </button>
          </div>
          {kycState.message ? <StatusMessage state={kycState} /> : null}
        </form>

        {robot ? (
          <div className="rounded-lg border border-stone-300 bg-[#FFFDF8] p-5 text-sm text-stone-700">
            <p className="font-mono text-xs uppercase text-stone-500">Current status</p>
            <p className="mt-2 text-xl font-semibold text-stone-950">{robot.status}</p>
            <p className="mt-2">Profile ID: {robot.id}</p>
            <Link className="mt-4 inline-flex font-semibold text-stone-950 underline" href={`/robots/${robot.id}`}>
              View public profile
            </Link>
          </div>
        ) : null}
      </aside>

      <form onSubmit={saveListing} className="rounded-lg border border-stone-300 bg-[#FFFDF8] p-5">
        <p className="font-mono text-xs uppercase text-stone-500">Robot profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-950">
          {robotId ? "Edit robot" : "Create robot draft"}
        </h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            <span>Robot name</span>
            <input className={fieldClass} defaultValue={robot?.name} name="name" required />
          </label>
          <label className={labelClass}>
            <span>Category</span>
            <select className={fieldClass} defaultValue={robot?.category ?? "COMPANION"} name="category" required>
              {["DOMESTIC", "MEDICAL", "INDUSTRIAL", "COMPANION", "DELIVERY", "SECURITY", "CUSTOM"].map(
                (category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className={labelClass}>
            <span>Manufacturer</span>
            <input className={fieldClass} defaultValue={robot?.manufacturer ?? ""} name="manufacturer" />
          </label>
          <label className={labelClass}>
            <span>Model number</span>
            <input className={fieldClass} defaultValue={robot?.modelNumber ?? ""} name="modelNumber" />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            <span>Description</span>
            <textarea
              className={`${fieldClass} min-h-32`}
              defaultValue={robot?.description}
              name="description"
              required
            />
          </label>
          <label className={labelClass}>
            <span>Capabilities</span>
            <input
              className={fieldClass}
              defaultValue={robot?.capabilities.join(", ")}
              name="capabilities"
              placeholder="elderly-care, delivery, warehouse"
              required
            />
          </label>
          <label className={labelClass}>
            <span>Photo URLs</span>
            <input
              className={fieldClass}
              defaultValue={robot?.photos.join(", ")}
              name="photos"
              placeholder="https://..."
              required
            />
          </label>
          <label className={labelClass}>
            <span>Price per hour</span>
            <input className={fieldClass} defaultValue={robot?.pricePerHour} min="1" name="pricePerHour" required type="number" />
          </label>
          <label className={labelClass}>
            <span>Price per day</span>
            <input className={fieldClass} defaultValue={robot?.pricePerDay} min="1" name="pricePerDay" required type="number" />
          </label>
          <label className={labelClass}>
            <span>Deposit</span>
            <input className={fieldClass} defaultValue={robot?.depositAmount ?? 100} min="0" name="depositAmount" required type="number" />
          </label>
          <label className={labelClass}>
            <span>Currency</span>
            <input className={fieldClass} defaultValue={robot?.currency ?? "USD"} maxLength={3} minLength={3} name="currency" required />
          </label>
          <label className={labelClass}>
            <span>Minimum rental hours</span>
            <input className={fieldClass} defaultValue={robot?.minRentalHours ?? 1} min="1" name="minRentalHours" required type="number" />
          </label>
          <label className={labelClass}>
            <span>Maximum rental hours</span>
            <input className={fieldClass} defaultValue={robot?.maxRentalHours ?? ""} min="1" name="maxRentalHours" type="number" />
          </label>
          <label className={labelClass}>
            <span>Availability zone</span>
            <input className={fieldClass} defaultValue={robot?.availabilityZone} name="availabilityZone" required />
          </label>
          <label className={labelClass}>
            <span>Latitude</span>
            <input className={fieldClass} defaultValue={robot?.latitude ?? -1.286389} name="latitude" required step="any" type="number" />
          </label>
          <label className={labelClass}>
            <span>Longitude</span>
            <input className={fieldClass} defaultValue={robot?.longitude ?? 36.817223} name="longitude" required step="any" type="number" />
          </label>
          <label className="flex items-center justify-between rounded-md border border-stone-300 bg-[#F7F0E8] px-3 py-3 text-sm font-medium text-stone-700">
            <span>Requires operator</span>
            <input
              className="h-4 w-4 accent-stone-950"
              defaultChecked={robot?.requiresOperator}
              name="requiresOperator"
              type="checkbox"
            />
          </label>
          <label className="flex items-center justify-between rounded-md border border-stone-300 bg-[#F7F0E8] px-3 py-3 text-sm font-medium text-stone-700">
            <span>Available for booking</span>
            <input
              className="h-4 w-4 accent-stone-950"
              defaultChecked={robot?.isAvailable ?? true}
              name="isAvailable"
              type="checkbox"
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-md bg-stone-950 px-5 py-3 text-sm font-semibold text-[#F7F0E8] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={listingState.status === "loading"}
          >
            {robotId ? "Update profile" : "Save draft"}
          </button>
          <button
            className="rounded-md border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!activeRobotId || listingState.status === "loading"}
            onClick={publishListing}
            type="button"
          >
            Publish
          </button>
        </div>
        {listingState.message ? <StatusMessage state={listingState} /> : null}
      </form>
    </div>
  );
}

function buildRobotPayload(formData: FormData) {
  return {
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    capabilities: splitList(formData.get("capabilities")),
    photos: splitList(formData.get("photos")),
    manufacturer: formData.get("manufacturer") || null,
    modelNumber: formData.get("modelNumber") || null,
    pricePerHour: Number(formData.get("pricePerHour")),
    pricePerDay: Number(formData.get("pricePerDay")),
    depositAmount: Number(formData.get("depositAmount")),
    currency: String(formData.get("currency") ?? "USD").toUpperCase(),
    minRentalHours: Number(formData.get("minRentalHours")),
    maxRentalHours: Number(formData.get("maxRentalHours")) || null,
    availabilityZone: formData.get("availabilityZone"),
    latitude: Number(formData.get("latitude")),
    longitude: Number(formData.get("longitude")),
    requiresOperator: formData.get("requiresOperator") === "on",
    isAvailable: formData.get("isAvailable") === "on",
  };
}

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return { error: "Service is temporarily unavailable" };
  }
}

function StatusMessage({ state }: { state: ApiState }) {
  return (
    <p
      className={`mt-4 rounded-md border px-3 py-2 text-sm ${
        state.status === "error"
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-emerald-300 bg-emerald-50 text-emerald-800"
      }`}
    >
      {state.message}
    </p>
  );
}
