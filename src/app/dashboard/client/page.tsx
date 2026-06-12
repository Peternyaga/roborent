export default function ClientDashboardPage() {
  return (
    <main className="min-h-screen bg-[#0A0E1A] px-6 py-8 text-[#F0F4FF]">
      <div className="mx-auto w-full max-w-7xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00CFFF]">
          Client workspace
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Client dashboard</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ["Active rentals", "2"],
            ["Upcoming approvals", "3"],
            ["Safety waivers", "Current"],
          ].map(([label, value]) => (
            <div className="rounded-lg border border-[#1E2A42] bg-[#131929] p-5" key={label}>
              <p className="text-sm text-[#8A9BC4]">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
