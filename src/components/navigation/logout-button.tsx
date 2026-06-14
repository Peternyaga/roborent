"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function onLogout() {
    setIsPending(true);
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700 transition hover:border-stone-600 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isPending}
      onClick={onLogout}
      type="button"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">{isPending ? "Signing out" : "Sign out"}</span>
    </button>
  );
}
