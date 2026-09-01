import { CalendarDays, Compass, Users, Wallet, type LucideIcon } from "lucide-react";
import { VALUES } from "@/lib/data/site";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";

const ICONS: Record<string, LucideIcon> = {
  calendar: CalendarDays,
  users: Users,
  wallet: Wallet,
  compass: Compass,
};

export default function WhyUs() {
  return (
    <section id="why" className="container-x scroll-mt-24 py-16 sm:py-20">
      <Reveal>
        <SectionHead
          eyebrow="Why Trade Winds"
          title="Four promises we can actually keep"
          sub="No loyalty programs, no mystery pricing, no 'terms apply' asterisks."
        />
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {VALUES.map((v, i) => {
          const Icon = ICONS[v.icon] ?? Compass;
          return (
            <Reveal key={v.title} index={i}>
              <div className="card h-full p-6 transition-shadow hover:shadow-lg">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon size={20} aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{v.body}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
