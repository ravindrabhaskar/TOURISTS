import { STEPS } from "@/lib/data/site";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";

export default function HowItWorks() {
  return (
    <section id="how" className="bg-surface2 py-16 sm:py-20">
      <div className="container-x scroll-mt-24">
        <Reveal>
          <SectionHead
            eyebrow="How it works"
            title="Enquiry to boarding pass, minus the friction"
            align="center"
          />
        </Reveal>

        <ol className="mx-auto mt-12 grid max-w-5xl gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <Reveal index={i}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine font-mono text-sm font-bold text-white dark:text-[#0d1512]">
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="hidden h-px flex-1 border-t-2 border-dashed border-line lg:block"
                    />
                  )}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
