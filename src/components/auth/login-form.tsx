"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ApiState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type LoginFormProps = {
  redirectTo: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [apiState, setApiState] = useState<ApiState>({
    status: "idle",
    message: "",
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setApiState({ status: "loading", message: "Checking credentials..." });
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    const result = await readJson(response);

    if (!response.ok) {
      setApiState({ status: "error", message: result.error ?? "Login failed" });
      return;
    }

    setApiState({ status: "success", message: "Logged in" });
    const targetPath =
      redirectTo === "/dashboard/client" && result.user.roles.includes("OWNER")
        ? "/dashboard/owner"
        : redirectTo;

    router.push(targetPath);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-stone-300 bg-[#FFFDF8] p-6">
      <p className="font-mono text-xs uppercase text-stone-500">
        Secure access
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Log in</h1>
      <div className="mt-6 space-y-3">
        <input
          className="w-full rounded-md border border-stone-300 bg-[#F7F0E8] px-3 py-3 text-sm outline-none focus:border-stone-900"
          name="email"
          placeholder="Email"
          required
          type="email"
        />
        <input
          className="w-full rounded-md border border-stone-300 bg-[#F7F0E8] px-3 py-3 text-sm outline-none focus:border-stone-900"
          minLength={8}
          name="password"
          placeholder="Password"
          required
          type="password"
        />
        <button
          className="w-full rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-[#F7F0E8] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={apiState.status === "loading"}
        >
          Continue
        </button>
      </div>
      {apiState.message ? (
        <p
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
            apiState.status === "error"
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
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
