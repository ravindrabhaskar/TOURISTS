import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Sanchari — Andhra Pradesh Intelligent Tourism",
    template: "%s · Sanchari",
  },
  description:
    "Plan, book and explore Andhra Pradesh — AI-crafted itineraries, verified stays, festivals, live weather awareness and safety information in one place.",
  openGraph: {
    type: "website",
    siteName: "Sanchari",
    title: "Sanchari — Andhra Pradesh Intelligent Tourism",
    description: "AI-crafted itineraries, verified stays and festival discovery across Andhra Pradesh.",
  },
};

export const viewport: Viewport = {
  themeColor: "#177C64",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="min-h-[70vh]">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
