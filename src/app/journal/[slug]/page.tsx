import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { JOURNAL } from "@/lib/data/journal";
import { TRIPS } from "@/lib/data/trips";
import Frame from "@/components/ui/Frame";

export const dynamicParams = false;

export function generateStaticParams() {
  return JOURNAL.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = JOURNAL.find((p) => p.slug === slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: [{ url: post.cover }] },
  };
}

export default async function JournalPostPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = JOURNAL.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = post.relatedTrips
    .map((s) => TRIPS.find((t) => t.slug === s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <article className="container-x max-w-3xl py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <Link href="/journal" className="inline-flex items-center gap-1.5 text-muted hover:text-accent">
          <ArrowLeft size={14} aria-hidden /> Journal
        </Link>
      </nav>

      <header>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          {post.tag} · <time dateTime={post.date}>{post.date}</time>
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 flex items-center gap-1.5 text-sm text-muted">
          <Clock size={13} aria-hidden /> {post.readMins} min read
        </p>
      </header>

      <div className="mt-8 overflow-hidden rounded-3xl border border-line">
        <Frame src={post.cover} alt="" fallbackSeed={post.slug} sizes="(max-width: 768px) 100vw, 48rem" className="aspect-[2/1]" priority />
      </div>

      <div className="prose-tw mt-10 space-y-6">
        {post.body.map((para, i) => (
          <p key={i} className={i === 0 ? "text-lg leading-relaxed first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-semibold first-letter:leading-[0.85] first-letter:text-accent" : "leading-relaxed"}>
            {para}
          </p>
        ))}
      </div>

      {related.length > 0 && (
        <section className="mt-14 border-t border-line pt-8">
          <h2 className="font-display text-2xl font-semibold">Trips this note is about</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={`/trips/${t.slug}`}
                className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Frame
                  src={t.cover}
                  alt=""
                  fallbackSeed={`jr-${t.slug}`}
                  sizes="96px"
                  className="aspect-square w-20 shrink-0 rounded-xl"
                />
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold">{t.name}</p>
                  <p className="text-xs text-muted">
                    {t.days} days · best in{" "}
                    <span className="font-mono">{t.season.map((s, i) => (s === 2 ? i : -1)).filter((i) => i >= 0).map((i) => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i]).join(" ")}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
