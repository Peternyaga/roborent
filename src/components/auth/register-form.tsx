"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ApiState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function RegisterForm() {
  const router = useRouter();
  const [apiState, setApiState] = useState<ApiState>({
    status: "idle",
    message: "",
  });
  const [isOwner, setIsOwner] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setApiState({ status: "loading", message: "Creating account..." });
    const roles = isOwner ? ["CLIENT", "OWNER"] : ["CLIENT"];
    const response = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        password: formData.get("password"),
        roles,
      }),
    });
    const result = await readJson(response);

    if (!response.ok) {
      setApiState({ status: "error", message: result.error ?? "Registration failed" });
      return;
    }

    setApiState({ status: "success", message: "Account created" });
    router.push(isOwner ? "/dashboard/owner/robots/new" : "/dashboard/client");
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-[#1E2A42] bg-[#131929] p-6">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00CFFF]">
        Join RoboRent
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Create account</h1>
      <div className="mt-6 space-y-3">
        <input
          className="w-full rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-3 text-sm outline-none focus:border-[#00CFFF]"
          name="fullName"
          placeholder="Full name"
          required
        />
        <input
          className="w-full rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-3 text-sm outline-none focus:border-[#00CFFF]"
          name="email"
          placeholder="Email"
          required
          type="email"
        />
        <input
          className="w-full rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-3 text-sm outline-none focus:border-[#00CFFF]"
          minLength={8}
          name="password"
          placeholder="Password"
          required
          type="password"
        />
        <label className="flex items-center justify-between rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-3 text-sm text-[#B8C4E8]">
          <span>Register as owner</span>
          <input
            checked={isOwner}
            className="h-4 w-4 accent-[#00CFFF]"
            onChange={(event) => setIsOwner(event.target.checked)}
            type="checkbox"
          />
        </label>
        <button
          className="w-full rounded-md bg-[#00CFFF] px-4 py-3 text-sm font-semibold text-[#0A0E1A] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={apiState.status === "loading"}
        >
          Register
        </button>
      </div>
      {apiState.message ? (
        <p
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
            apiState.status === "error"
              ? "border-[#FF4757]/30 bg-[#FF4757]/10 text-[#FFB8C0]"
              : "border-[#00D68F]/30 bg-[#00D68F]/10 text-[#9CF4D4]"
          }`}
        >
          {apiState.message}
        </p>
      ) : null}
    </form>
  );
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return { error: "Service is temporarily unavailable" };
  }
}
