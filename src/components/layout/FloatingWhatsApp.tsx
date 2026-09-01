"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/data/site";

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with a planner on WhatsApp"
      className="fixed bottom-24 right-4 z-[96] flex h-13 w-13 items-center justify-center rounded-full bg-[#25d366] p-3.5 text-white shadow-xl transition-transform hover:scale-105 sm:bottom-6"
    >
      <MessageCircle size={22} aria-hidden />
    </a>
  );
}
