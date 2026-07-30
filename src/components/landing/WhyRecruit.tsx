"use client";

import {
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  Headset,
} from "lucide-react";
import { Reveal, SectionHeading } from "./landing-ui";
import { CAMPUS_IMAGE, REASONS } from "./landing-data";

const ICONS = [BookOpenCheck, ClipboardCheck, Headset, BriefcaseBusiness];

export function WhyRecruit() {
  return (
    <section className="border-b border-line bg-surface py-24 md:py-32 lg:py-40">
      <div className="editorial-shell">
        <SectionHeading
          index="03"
          eyebrow="Why Recruit From Vishwaniketan"
          title="Hiring here is a shorter conversation"
          body="We do the filtering upstream — in the curriculum, in the training calendar, and in how profiles are verified — so your panel spends its time on the candidates worth interviewing."
        />

        <div className="mt-16 grid grid-cols-12 gap-6 md:gap-8 lg:mt-20">
          {/* Feature cards — four across two columns */}
          <div className="col-span-12 grid gap-6 sm:grid-cols-2 lg:col-span-8">
            {REASONS.map((reason, i) => {
              const Icon = ICONS[i];
              return (
                <Reveal key={reason.index} delay={0.06 * i}>
                  <article className="group h-full rounded-2xl border border-line bg-paper p-8 transition-colors duration-300 hover:border-ink-soft">
                    <div className="flex items-center justify-between">
                      <Icon
                        className="size-5 text-pine"
                        strokeWidth={1.6}
                        aria-hidden
                      />
                      <span className="numerals text-[11px] font-semibold tracking-widest text-ash-light">
                        {reason.index}
                      </span>
                    </div>

                    <h3 className="mt-9 text-[22px] font-bold leading-tight tracking-[-0.03em] text-ink">
                      {reason.title}
                    </h3>
                    <p className="mt-4 text-[15px] leading-[1.75] text-ash">
                      {reason.body}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>

          {/* Supporting column: photograph over a quiet fact panel */}
          <Reveal delay={0.2} className="col-span-12 lg:col-span-4">
            <div className="flex h-full flex-col gap-6">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-surface-2 lg:aspect-auto lg:flex-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CAMPUS_IMAGE.src}
                  alt={CAMPUS_IMAGE.alt}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>

              <div className="rounded-2xl border border-line bg-paper p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ash">
                  Branches on offer
                </p>
                <ul className="mt-6 space-y-3.5 text-[15px] font-medium tracking-tight text-ink">
                  {[
                    "Computer Engineering",
                    "Information Technology",
                    "Electronics & Telecommunication",
                    "Mechanical Engineering",
                    "Civil Engineering",
                  ].map((branch) => (
                    <li key={branch} className="flex items-baseline gap-3">
                      <span
                        className="mt-1.5 size-1 shrink-0 rounded-full bg-pine"
                        aria-hidden
                      />
                      {branch}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
