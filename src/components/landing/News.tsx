"use client";

import { ArrowLink, Reveal, SectionHeading } from "./landing-ui";
import { FALLBACK_NEWS } from "./landing-data";
import type { EventItem, EventType } from "@/lib/api/events";

const TYPE_LABELS: Record<EventType, string> = {
  PLACEMENT_DRIVE: "Placement Drive",
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  MOCK_INTERVIEW: "Mock Interview",
  WEBINAR: "Webinar",
  OTHER: "Announcement",
};

interface NewsCard {
  id: string;
  tag: string;
  date: string;
  title: string;
  body: string;
  location?: string | null;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function toCard(event: EventItem): NewsCard {
  const parsed = new Date(event.eventDate);
  return {
    id: event.id,
    tag: TYPE_LABELS[event.type] ?? "Announcement",
    date: Number.isNaN(parsed.getTime())
      ? event.eventDate
      : DATE_FORMAT.format(parsed),
    title: event.title,
    body: event.description ?? "Details will be published on the TPO portal.",
    location: event.location,
  };
}

export function News({
  events,
  onNavigate,
}: {
  events: EventItem[];
  onNavigate: (id: string) => void;
}) {
  const cards: NewsCard[] = events.length
    ? events.slice(0, 3).map(toCard)
    : FALLBACK_NEWS;

  return (
    <section
      id="news"
      className="scroll-mt-24 border-b border-line bg-surface py-24 md:py-32 lg:py-40"
    >
      <div className="editorial-shell">
        <SectionHeading
          index="07"
          eyebrow="Latest Placement News"
          title="From the placement office"
          body="Drive results, registration windows and new partnerships — published as they happen."
          action={
            <ArrowLink onClick={() => onNavigate("contact")} tone="pine">
              Subscribe to placement updates
            </ArrowLink>
          }
        />

        <div className="mt-16 grid gap-6 md:mt-20 lg:grid-cols-3">
          {cards.map((card, i) => (
            <Reveal key={card.id} delay={0.08 * i}>
              <article className="group flex h-full flex-col rounded-2xl border border-line bg-paper p-8 transition-colors duration-300 hover:border-ink-soft lg:p-9">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ash">
                    {card.tag}
                  </span>
                  <time className="numerals text-[12.5px] font-medium text-ash-light">
                    {card.date}
                  </time>
                </div>

                <h3 className="mt-8 text-balance text-[21px] font-bold leading-[1.25] tracking-[-0.03em] text-ink">
                  {card.title}
                </h3>

                <p className="mt-4 flex-1 text-[15px] leading-[1.7] text-ash">
                  {card.body}
                </p>

                {card.location && (
                  <p className="mt-6 text-[12.5px] text-ash-light">
                    {card.location}
                  </p>
                )}

                <div
                  className="mt-8 h-px w-10 bg-line-strong transition-[width,background-color] duration-500 ease-out group-hover:w-full group-hover:bg-pine"
                  aria-hidden
                />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
