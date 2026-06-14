import type { Metadata } from "next";
import { SiteHeader } from "@/components/navigation/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoboRent",
  description: "Hire verified robots for real-world work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#F7F0E8] text-stone-950">
        <SiteHeader />
        <div className="lg:pl-64">{children}</div>
      </body>
    </html>
  );
}
