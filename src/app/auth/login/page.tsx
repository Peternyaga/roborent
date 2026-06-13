import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0E1A] px-6 py-10 text-[#F0F4FF]">
      <div className="w-full max-w-md">
        <LoginForm />
        <p className="mt-5 text-center text-sm text-[#8A9BC4]">
          New to RoboRent?{" "}
          <Link className="font-semibold text-[#00CFFF]" href="/auth/register">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
