import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import FloatingWhatsApp from "@/components/layout/FloatingWhatsApp";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import CompareBar from "@/components/trips/CompareBar";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", style: ["normal", "italic"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Sanchari Travel — Curated journeys from Hyderabad", template: "%s · Sanchari Travel" },
  description: "Plan and book thoughtful small-group journeys with honest season guidance, live departures, and local travel expertise.",
};

export const viewport: Viewport = { themeColor: "#c4562f", width: "device-width", initialScale: 1 };
const themeInit = `(function(){try{var t=localStorage.getItem('tw-theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <Providers>
          <a href="#main" className="skip-link">Skip to content</a>
          <AnnouncementBar />
          <Header />
          <main id="main" className="min-h-[70vh] flex-1">{children}</main>
          <Footer />
          <CompareBar />
          <FloatingWhatsApp />
        </Providers>
      </body>
    </html>
  );
}
