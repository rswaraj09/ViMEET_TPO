"use client";

import { CountUp, Reveal, SectionHeading } from "./landing-ui";
import { STATS } from "./landing-data";

export function Highlights() {
  return (
    <section
      id="placements"
      className="scroll-mt-24 border-b border-line bg-paper py-24 md:py-32 lg:py-40"
    >
      <div className="editorial-shell">
        <SectionHeading
          index="01"
          eyebrow="Placement Highlights"
          title={
            <>
              The numbers behind the{" "}
              <span className="font-editorial text-[1.05em] font-normal italic">
                class of 2025
              </span>
            </>
          }
          body="Figures are compiled by the Training & Placement Cell at the close of each recruitment cycle and cover every registered, eligible student across all engineering branches."
        />

        {/* One bordered lattice rather than four floating cards */}
        <Reveal delay={0.1} className="mt-16 md:mt-20">
          <div className="hairline-grid rounded-2xl md:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="group bg-paper p-8 transition-colors duration-300 hover:bg-surface lg:p-9"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ash">
                  {stat.label}
                </p>

                <p className="mt-8 text-[clamp(2.6rem,4vw,3.5rem)] font-extrabold leading-none tracking-[-0.045em] text-ink">
                  <CountUp
                    value={stat.value}
                    decimals={stat.decimals}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </p>

                <div
                  className="mt-8 h-px w-10 bg-line-strong transition-[width,background-color] duration-500 ease-out group-hover:w-20 group-hover:bg-pine"
                  aria-hidden
                />
                <p className="mt-4 text-[13px] leading-relaxed text-ash-light">
                  {stat.note}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-8 text-[13px] leading-relaxed text-ash-light">
            Package figures are stated as annual cost to company. Verified
            branch-wise reports are available on request from the placement
            office.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
