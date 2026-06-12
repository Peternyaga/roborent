export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0E1A] px-6 text-[#F0F4FF]">
      <form className="w-full max-w-md rounded-lg border border-[#1E2A42] bg-[#131929] p-6">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00CFFF]">
          Join RoboRent
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Create account</h1>
        <div className="mt-6 space-y-3">
          <input
            className="w-full rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-3 text-sm outline-none focus:border-[#00CFFF]"
            placeholder="Full name"
          />
          <input
            className="w-full rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-3 text-sm outline-none focus:border-[#00CFFF]"
            placeholder="Email"
            type="email"
          />
          <input
            className="w-full rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-3 text-sm outline-none focus:border-[#00CFFF]"
            placeholder="Password"
            type="password"
          />
          <button className="w-full rounded-md bg-[#00CFFF] px-4 py-3 text-sm font-semibold text-[#0A0E1A]">
            Register
          </button>
        </div>
      </form>
    </main>
  );
}
