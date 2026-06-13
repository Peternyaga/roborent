"use client";

import { type FormEvent, useState } from "react";

type ApiState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const fieldClass =
  "w-full rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-3 text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4] focus:border-[#00CFFF]";

export function RobotListingForm() {
  const [listingState, setListingState] = useState<ApiState>({
    status: "idle",
    message: "",
  });
  const [kycState, setKycState] = useState<ApiState>({
    status: "idle",
    message: "",
  });
  const [createdRobotId, setCreatedRobotId] = useState<string | null>(null);

  async function submitKyc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setKycState({ status: "loading", message: "Submitting KYC..." });
    const response = await fetch("/api/v1/users/me/verify-identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityDocumentUrl: formData.get("identityDocumentUrl"),
      }),
    });
    const result = await readJson(response);

    if (!response.ok) {
      setKycState({ status: "error", message: result.error ?? "KYC failed" });
      return;
    }

    setKycState({ status: "success", message: "KYC submitted" });
  }

  async function createListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setListingState({ status: "loading", message: "Saving robot draft..." });
    const capabilities = String(formData.get("capabilities") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const photos = String(formData.get("photos") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await fetch("/api/v1/robots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        category: formData.get("category"),
        description: formData.get("description"),
        capabilities,
        photos,
        manufacturer: formData.get("manufacturer") || null,
        modelNumber: formData.get("modelNumber") || null,
        pricePerHour: Number(formData.get("pricePerHour")),
        pricePerDay: Number(formData.get("pricePerDay")),
        depositAmount: Number(formData.get("depositAmount")),
        currency: formData.get("currency"),
        minRentalHours: Number(formData.get("minRentalHours")),
        maxRentalHours: Number(formData.get("maxRentalHours")) || null,
        availabilityZone: formData.get("availabilityZone"),
        latitude: Number(formData.get("latitude")),
        longitude: Number(formData.get("longitude")),
        requiresOperator: formData.get("requiresOperator") === "on",
      }),
    });
    const result = await readJson(response);

    if (!response.ok) {
      setListingState({
        status: "error",
        message: result.error ?? "Robot listing failed",
      });
      return;
    }

    setCreatedRobotId(result.robot.id);
    setListingState({
      status: "success",
      message: result.reason ?? "Robot draft saved",
    });
  }

  async function publishListing() {
    if (!createdRobotId) {
      setListingState({ status: "error", message: "Create a draft first" });
      return;
    }

    setListingState({ status: "loading", message: "Checking publish gate..." });
    const response = await fetch(`/api/v1/robots/${createdRobotId}/publish`, {
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

    setListingState({ status: "success", message: "Robot published" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submitKyc} className="h-fit rounded-lg border border-[#1E2A42] bg-[#131929] p-5">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00CFFF]">
          Owner KYC
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Identity check</h2>
        <div className="mt-5 space-y-3">
          <input
            className={fieldClass}
            name="identityDocumentUrl"
            placeholder="Identity document URL"
            required
            type="url"
          />
          <button
            className="w-full rounded-md border border-[#00CFFF]/30 bg-[#00CFFF]/10 px-4 py-3 text-sm font-semibold text-[#00CFFF] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={kycState.status === "loading"}
          >
            Submit KYC
          </button>
        </div>
        {kycState.message ? <StatusMessage state={kycState} /> : null}
      </form>

      <form onSubmit={createListing} className="rounded-lg border border-[#1E2A42] bg-[#131929] p-5">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00CFFF]">
          Robot listing
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Create robot draft</h1>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <input className={fieldClass} name="name" placeholder="Robot name" required />
          <select className={fieldClass} name="category" required>
            {["DOMESTIC", "MEDICAL", "INDUSTRIAL", "COMPANION", "DELIVERY", "SECURITY", "CUSTOM"].map(
              (category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ),
            )}
          </select>
          <input className={fieldClass} name="manufacturer" placeholder="Manufacturer" />
          <input className={fieldClass} name="modelNumber" placeholder="Model number" />
          <textarea
            className={`${fieldClass} min-h-32 md:col-span-2`}
            name="description"
            placeholder="Description"
            required
          />
          <input
            className={fieldClass}
            name="capabilities"
            placeholder="Capabilities, comma separated"
            required
          />
          <input
            className={fieldClass}
            name="photos"
            placeholder="Photo URLs, comma separated"
            required
          />
          <input className={fieldClass} name="pricePerHour" placeholder="Price per hour" required type="number" />
          <input className={fieldClass} name="pricePerDay" placeholder="Price per day" required type="number" />
          <input className={fieldClass} name="depositAmount" placeholder="Deposit" required type="number" />
          <input className={fieldClass} defaultValue="USD" name="currency" placeholder="Currency" required />
          <input className={fieldClass} defaultValue="1" name="minRentalHours" placeholder="Minimum hours" required type="number" />
          <input className={fieldClass} name="maxRentalHours" placeholder="Maximum hours" type="number" />
          <input className={fieldClass} name="availabilityZone" placeholder="City / region" required />
          <input className={fieldClass} name="latitude" placeholder="Latitude" required step="any" type="number" />
          <input className={fieldClass} name="longitude" placeholder="Longitude" required step="any" type="number" />
          <label className="flex items-center justify-between rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-3 text-sm text-[#B8C4E8]">
            <span>Requires operator</span>
            <input className="h-4 w-4 accent-[#00CFFF]" name="requiresOperator" type="checkbox" />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-md bg-[#00CFFF] px-5 py-3 text-sm font-semibold text-[#0A0E1A] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={listingState.status === "loading"}
          >
            Save draft
          </button>
          <button
            className="rounded-md border border-[#1E2A42] px-5 py-3 text-sm font-semibold text-[#B8C4E8] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!createdRobotId || listingState.status === "loading"}
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
          ? "border-[#FF4757]/30 bg-[#FF4757]/10 text-[#FFB8C0]"
          : "border-[#00D68F]/30 bg-[#00D68F]/10 text-[#9CF4D4]"
      }`}
    >
      {state.message}
    </p>
  );
}
