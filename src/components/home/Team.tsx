import { TEAM } from "@/lib/data/site";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";

const AVATAR_BG = ["bg-accent", "bg-pine", "bg-gold", "bg-[#7a4a8f]"];

export default function Team() {
  return (
    <section id="team" className="container-x scroll-mt-24 py-16 sm:py-20">
      <Reveal>
        <SectionHead
          eyebrow="Who you're actually booking with"
          title="Four people answer those enquiries"
          sub="No call-centre queue, no ticket numbers. The planners below read every enquiry — usually within the hour."
        />
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM.map((m, i) => (
          <Reveal key={m.name} index={i}>
            <div className="card h-full p-6">
              <span
                aria-hidden
                className={`flex h-14 w-14 items-center justify-center rounded-2xl font-display text-xl font-semibold text-white ${AVATAR_BG[i % AVATAR_BG.length]}`}
              >
                {m.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{m.name}</h3>
              <p className="font-mono text-[11px] uppercase tracking-wide text-accent">
                {m.role}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{m.bio}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
