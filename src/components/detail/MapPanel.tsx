"use client";

import dynamic from "next/dynamic";

const TripMapInner = dynamic(() => import("@/components/detail/TripMapInner"), {
  ssr: false,
  loading: () => <div className="skeleton h-72 w-full" aria-hidden />,
});

export default function MapPanel({ slug, name }: { slug: string; name: string }) {
  return <TripMapInner slug={slug} name={name} />;
}
