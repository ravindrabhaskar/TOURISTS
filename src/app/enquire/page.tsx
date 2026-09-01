import type { Metadata } from "next";
import { Suspense } from "react";
import EnquireWizard from "@/components/enquire/EnquireWizard";

export const metadata: Metadata = {
  title: "Plan a trip",
  description:
    "Send a ninety-second enquiry. A planner replies within one working day with availability and a free seat hold — nothing payable until you confirm.",
};

export default function EnquirePage() {
  return (
    <div className="container-x">
      <Suspense fallback={<div className="skeleton mt-16 h-96 max-w-3xl" />}>
        <EnquireWizard />
      </Suspense>
    </div>
  );
}
