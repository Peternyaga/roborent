import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0E1A] px-6 py-10 text-[#F0F4FF]">
      <div className="w-full max-w-md">
        <RegisterForm />
        <p className="mt-5 text-center text-sm text-[#8A9BC4]">
          Already registered?{" "}
          <Link className="font-semibold text-[#00CFFF]" href="/auth/login">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
