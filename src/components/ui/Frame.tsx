"use client";

import Image from "next/image";
import { useState } from "react";

interface FrameProps {
  /** Remote image URL; falls back to a seeded placeholder when absent or broken. */
  src?: string;
  alt: string;
  fallbackSeed: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

export default function Frame({
  src,
  alt,
  fallbackSeed,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  className = "",
}: FrameProps) {
  const fallback = `https://picsum.photos/seed/${fallbackSeed}/1200/800`;
  const [current, setCurrent] = useState(src || fallback);
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <div className={`relative overflow-hidden bg-surface2 ${className}`}>
      {!loaded && <div className="absolute inset-0 skeleton" aria-hidden />}
      <Image
        key={key}
        src={current}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (current !== fallback) {
            setCurrent(fallback);
            setLoaded(false);
            setKey((k) => k + 1);
          }
        }}
        className={`object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
