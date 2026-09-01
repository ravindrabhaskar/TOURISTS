import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { JOURNAL } from "@/lib/data/journal";
import Frame from "@/components/ui/Frame";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Journal — field notes & season intel",
  description:
    "Honest writing on when to go where: bloom windows, monsoon truths, safari economics and the routes we refuse to sell.",
};

export default function JournalPage() {
  const [lead, ...rest] = JOURNAL;
  if (!lead) return null;

  return (
    <div className="container-x py-10 sm:py-14">
      <header className="max-w-xl">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent">
          The journal
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
          Field notes & season intel
        </h1>
        <p className="mt-3 leading-relaxed text-muted">
          What our planners write after the trips come home — the months that
          overdeliver, the ones we black out, and the arithmetic nobody else publishes.
        </p>
      </header>

      <Reveal>
        <Link
          href={`/journal/${lead.slug}`}
          className="group mt-10 grid overflow-hidden rounded-3xl border border-line bg-surface lg:grid-cols-2"
        >
          <Frame
            src={lead.cover}
            alt=""
            fallbackSeed={lead.slug}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            className="aspect-[16/9] lg:aspect-auto lg:min-h-[22rem] [&>img]:transition-transform [&>img]:duration-700 group-hover:[&>img]:scale-[1.03]"
          />
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <p className="font-mono text-[11px] uppercase tracking-wide text-accent">
              {lead.tag} · {lead.date}
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-snug sm:text-3xl">
              {lead.title}
            </h2>
            <p className="mt-3 leading-relaxed text-muted">{lead.excerpt}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-pine">
              Read the note
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
          </div>
        </Link>
      </Reveal>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rest.map((post) => (
          <Reveal key={post.slug}>
            <Link
              href={`/journal/${post.slug}`}
              className="card group flex h-full flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <Frame
                src={post.cover}
                alt=""
                fallbackSeed={post.slug}
                sizes="(max-width: 768px) 100vw, 33vw"
                className="aspect-[16/9] [&>img]:transition-transform [&>img]:duration-500 group-hover:[&>img]:scale-105"
              />
              <div className="flex flex-1 flex-col p-5">
                <p className="font-mono text-[11px] uppercase tracking-wide text-accent">
                  {post.tag}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold leading-snug">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                  {post.excerpt}
                </p>
                <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-muted">
                  <Clock size={12} aria-hidden /> {post.readMins} min read · {post.date}
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
