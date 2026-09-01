"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/data/site";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";

export default function Testimonials() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setI((v) => (v + 1) % TESTIMONIALS.length), 7000);
    return () => clearInterval(id);
  }, [paused]);

  const t = TESTIMONIALS[i % TESTIMONIALS.length];
  if (!t) return null;

  return (
    <section className="container-x py-16 sm:py-20">
      <Reveal>
        <SectionHead
          eyebrow="Travellers"
          title="2,300 groups and counting"
          align="center"
        />
      </Reveal>

      <Reveal index={1}>
        <div
          className="relative mx-auto mt-10 max-w-3xl rounded-3xl border border-line bg-surface p-8 shadow-sm sm:p-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          aria-live="polite"
        >
          <Quote size={36} className="absolute -top-5 left-8 fill-accent-soft text-accent" aria-hidden />
          <blockquote key={i} className="fade-up">
            <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
              {Array.from({ length: t.rating }).map((_, s) => (
                <Star key={s} size={16} className="fill-gold text-gold" aria-hidden />
              ))}
            </div>
            <p className="mt-4 font-display text-xl italic leading-relaxed sm:text-2xl">
              “{t.quote}”
            </p>
            <footer className="mt-6">
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-muted">{t.trip}</p>
            </footer>
          </blockquote>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-1.5" role="tablist" aria-label="Choose testimonial">
              {TESTIMONIALS.map((_, n) => (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={n === i}
                  aria-label={`Testimonial ${n + 1}`}
                  onClick={() => setI(n)}
                  className={`h-2 rounded-full transition-all ${
                    n === i ? "w-6 bg-accent" : "w-2 bg-line hover:bg-muted"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setI((v) => (v - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                aria-label="Previous testimonial"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line transition hover:bg-surface2"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setI((v) => (v + 1) % TESTIMONIALS.length)}
                aria-label="Next testimonial"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line transition hover:bg-surface2"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
