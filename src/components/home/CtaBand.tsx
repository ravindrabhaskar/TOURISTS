import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { SITE } from "@/lib/data/site";
import Reveal from "@/components/ui/Reveal";

export default function CtaBand() {
  return (
    <section className="container-x pb-4 pt-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-pine px-6 py-14 text-center text-white sm:px-12">
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
            viewBox="0 0 400 200"
            preserveAspectRatio="none"
          >
            {[20, 60, 100, 140, 180].map((y) => (
              <path
                key={y}
                d={`M-20 ${y} C 80 ${y - 30}, 160 ${y + 30}, 420 ${y}`}
                fill="none"
                stroke="white"
                strokeWidth="1.5"
              />
            ))}
          </svg>

          <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Tell us the shape of your trip. We&apos;ll do the rest.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/85">
            Ninety seconds, no commitment. A planner replies within one working day
            with availability and a free seat hold.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/enquire"
              className="btn bg-white px-7 py-3 text-base text-[#12332e] hover:bg-white/90"
            >
              Plan my trip <ArrowRight size={17} aria-hidden />
            </Link>
            <a
              href={`tel:${SITE.phone.replace(/\s/g, "")}`}
              className="btn border border-white/40 bg-white/10 px-6 py-3 text-base text-white backdrop-blur hover:bg-white/20"
            >
              <Phone size={16} aria-hidden /> {SITE.phone}
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
