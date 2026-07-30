"use client";

import { Reveal, SectionHeading } from "./landing-ui";
import { STORIES } from "./landing-data";

export function SuccessStories() {
  return (
    <section className="border-b border-line bg-paper py-24 md:py-32 lg:py-40">
      <div className="editorial-shell">
        <SectionHeading
          index="04"
          eyebrow="Success Stories"
          title="Offers, in their own words"
          body="Placed students on what actually moved the needle — the training that mattered, and the moment it paid off."
        />

        <div className="mt-16 grid gap-6 md:mt-20 lg:grid-cols-3">
          {STORIES.map((story, i) => (
            <Reveal key={story.name} delay={0.08 * i}>
              <figure className="group flex h-full flex-col rounded-2xl border border-line bg-paper p-8 transition-colors duration-300 hover:border-ink-soft lg:p-9">
                {/* Company badge */}
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-lg border border-pine-line bg-pine-tint px-3 py-1.5 text-[12px] font-semibold tracking-tight text-pine">
                    {story.company}
                  </span>
                  <span className="numerals text-[13px] font-bold tracking-tight text-ink">
                    {story.package}
                  </span>
                </div>

                <blockquote className="mt-9 flex-1">
                  <p className="font-editorial text-[23px] leading-[1.4] tracking-[-0.015em] text-ink lg:text-[25px]">
                    <span aria-hidden className="text-ash-light">
                      “
                    </span>
                    {story.quote}
                    <span aria-hidden className="text-ash-light">
                      ”
                    </span>
                  </p>
                </blockquote>

                <figcaption className="mt-10 flex items-center gap-4 border-t border-line pt-6">
                  {/* Monogram in place of a stock portrait */}
                  <span
                    aria-hidden
                    className="numerals flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-[13px] font-bold tracking-[0.06em] text-ink transition-colors duration-300 group-hover:border-pine-line group-hover:bg-pine-tint group-hover:text-pine"
                  >
                    {story.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold tracking-[-0.02em] text-ink">
                      {story.name}
                    </p>
                    <p className="mt-1 truncate text-[12.5px] text-ash">
                      {story.branch} · {story.batch}
                    </p>
                  </div>
                </figcaption>

                <p className="mt-4 text-[12.5px] text-ash-light">
                  {story.role}
                </p>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
