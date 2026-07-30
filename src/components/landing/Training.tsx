"use client";

import { ArrowRight } from "lucide-react";
import { Reveal, SectionHeading } from "./landing-ui";
import { PROGRAMS } from "./landing-data";

export function Training() {
  return (
    <section
      id="training"
      className="scroll-mt-24 border-b border-line bg-paper py-24 md:py-32 lg:py-40"
    >
      <div className="editorial-shell">
        <SectionHeading
          index="06"
          eyebrow="Training Programs"
          title="Preparation that runs all year"
          body="Training is not a pre-drive scramble. It is a standing programme with a calendar, graded checkpoints and published outcomes."
        />

        {/* An index — hairline rows rather than a field of cards */}
        <div className="mt-16 border-t border-line md:mt-20">
          {PROGRAMS.map((program, i) => (
            <Reveal key={program.index} delay={0.05 * i}>
              <article className="group grid grid-cols-12 items-baseline gap-x-6 gap-y-3 border-b border-line py-8 transition-colors duration-300 hover:bg-surface md:py-10">
                <p className="numerals col-span-2 text-[12px] font-bold tracking-[0.18em] text-ash-light transition-colors duration-300 group-hover:text-pine md:col-span-1">
                  {program.index}
                </p>

                <h3 className="col-span-10 text-[clamp(1.35rem,2.6vw,2rem)] font-bold leading-[1.15] tracking-[-0.035em] text-ink md:col-span-4">
                  {program.title}
                </h3>

                <p className="col-span-12 max-w-[52ch] text-[15px] leading-[1.7] text-ash md:col-span-5">
                  {program.body}
                </p>

                <div className="col-span-12 flex items-center justify-between gap-4 md:col-span-2 md:justify-end">
                  <span className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ash transition-colors duration-300 group-hover:border-pine-line group-hover:bg-pine-tint group-hover:text-pine">
                    {program.meta}
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-ash-light transition-all duration-300 group-hover:translate-x-1 group-hover:text-ink"
                    aria-hidden
                  />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
