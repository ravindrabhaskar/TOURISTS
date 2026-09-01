"use client";

import { useEffect, type ReactNode } from "react";
import {
  CompareProvider,
  SettingsProvider,
  ShortlistProvider,
  ToastProvider,
  useToast,
} from "@/lib/store";
import { COMPARE_CAP } from "@/lib/store";

function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

function CompareCapBridge({ children }: { children: ReactNode }) {
  const { push } = useToast();
  return (
    <CompareProvider
      onCap={() => push(`Compare holds ${COMPARE_CAP} trips — remove one first.`, "warn")}
    >
      {children}
    </CompareProvider>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ToastProvider>
        <ShortlistProvider>
          <CompareCapBridge>
            {children}
            <ServiceWorker />
          </CompareCapBridge>
        </ShortlistProvider>
      </ToastProvider>
    </SettingsProvider>
  );
}
