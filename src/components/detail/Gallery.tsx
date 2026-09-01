"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import Frame from "@/components/ui/Frame";
import Modal from "@/components/ui/Modal";

export default function Gallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [lightbox, setLightbox] = useState(-1);

  const step = (d: number) =>
    setLightbox((i) => (i + d + images.length) % images.length);

  return (
    <div>
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <button
          type="button"
          onClick={() => setLightbox(0)}
          className="group relative block aspect-[16/10] overflow-hidden rounded-3xl lg:aspect-auto lg:h-full lg:min-h-[26rem]"
          aria-label="Open photo viewer"
        >
          <Frame
            src={images[0]}
            alt={`${name} — main view`}
            fallbackSeed={`gal-${name}-0`}
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
            className="h-full w-full [&>img]:transition-transform [&>img]:duration-700 group-hover:[&>img]:scale-[1.03]"
          />
          <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition group-hover:bg-black/65">
            <Expand size={17} aria-hidden />
          </span>
        </button>

        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
          {images.slice(1, 4).map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setLightbox(i + 1)}
              aria-label={`Open photo ${i + 2} of ${images.length}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-[16/7]"
            >
              <Frame
                src={src}
                alt=""
                fallbackSeed={`gal-${name}-${i + 1}`}
                sizes="(max-width: 1024px) 33vw, 25vw"
                className="h-full w-full [&>img]:transition-transform [&>img]:duration-700 group-hover:[&>img]:scale-[1.05]"
              />
            </button>
          ))}
        </div>
      </div>

      <Modal open={lightbox >= 0} onClose={() => setLightbox(-1)} label="Photo viewer" wide>
        <div className="relative">
          <div className="relative aspect-[16/10] bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[Math.max(lightbox, 0)]}
              alt={`${name} photograph ${lightbox + 1}`}
              className="h-full w-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/75"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/75"
          >
            <ChevronRight size={20} />
          </button>
          <p className="py-3 text-center font-mono text-xs text-white/80">
            {(lightbox < 0 ? 0 : lightbox) + 1} / {images.length}
          </p>
        </div>
      </Modal>
    </div>
  );
}
