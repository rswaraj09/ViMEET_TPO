"use client";

import { motion, useReducedMotion } from "motion/react";
import { PrimaryButton, SecondaryButton } from "./landing-ui";
import { HERO_IMAGE } from "./landing-data";

const FIGURES = [
  { value: "1,200+", label: "Students placed" },
  { value: "150+", label: "Recruiting partners" },
  { value: "12", label: "Years of placements" },
];

export function Hero({ onNavigate }: { onNavigate: (id: string) => void }) {
  const reduced = useReducedMotion();

  const rise = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section id="top" className="relative border-b border-line bg-paper">
      <div className="editorial-shell">
        <div className="grid grid-cols-12 items-start gap-y-14 pb-20 pt-16 md:pt-24 lg:gap-x-8 lg:pb-28 lg:pt-28">
          {/* ---------------------------------------------------------- */}
          {/* Copy — seven columns, ranged left                           */}
          {/* ---------------------------------------------------------- */}
          <div className="col-span-12 lg:col-span-7 xl:col-span-6">
            <motion.p
              {...rise(0)}
              className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ash"
            >
              <span className="size-1.5 rounded-full bg-pine" aria-hidden />
              Placement Season 2025–26 · Now Open
            </motion.p>

            <motion.h1
              {...rise(0.08)}
              className="mt-8 text-balance text-[clamp(2.75rem,6.4vw,5.25rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-ink"
            >
              Careers begin where preparation meets{" "}
              <span className="font-editorial text-[1.06em] font-normal italic tracking-[-0.02em] text-pine">
                opportunity
              </span>
              .
            </motion.h1>

            <motion.p
              {...rise(0.16)}
              className="mt-8 max-w-[52ch] text-[17px] leading-[1.75] text-ash md:text-[18px]"
            >
              The Training &amp; Placement Cell at Vishwaniketan iMEET connects
              industry-ready engineering talent with more than 150 recruiting
              partners — through structured year-round training, department-verified
              profiles, and a placement process built on transparency.
            </motion.p>

            <motion.div
              {...rise(0.24)}
              className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <PrimaryButton onClick={() => onNavigate("placements")}>
                Explore Placements
              </PrimaryButton>
              <SecondaryButton onClick={() => onNavigate("recruiters")}>
                Our Recruiters
              </SecondaryButton>
            </motion.div>

            {/* Figure strip, divided by hairlines */}
            <motion.dl
              {...rise(0.32)}
              className="mt-16 grid max-w-lg grid-cols-3 border-t border-line pt-7"
            >
              {FIGURES.map((f, i) => (
                <div
                  key={f.label}
                  className={i > 0 ? "border-l border-line pl-5" : "pr-5"}
                >
                  <dt className="sr-only">{f.label}</dt>
                  <dd className="numerals text-[26px] font-extrabold leading-none text-ink">
                    {f.value}
                  </dd>
                  <p className="mt-2 text-[12px] font-medium leading-snug text-ash-light">
                    {f.label}
                  </p>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* Image — five columns, offset, with a card breaking the edge */}
          {/* ---------------------------------------------------------- */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative col-span-12 lg:col-span-5 lg:col-start-8 xl:col-span-5 xl:col-start-8"
          >
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={HERO_IMAGE.src}
                  alt={HERO_IMAGE.alt}
                  className="size-full object-cover"
                  fetchPriority="high"
                />
              </div>

              {/* Vertical caption along the outer edge */}
              <span
                className="pointer-events-none absolute -left-11 top-8 hidden origin-top-left rotate-90 text-[10px] font-semibold uppercase tracking-[0.3em] text-ash-light xl:block"
                aria-hidden
              >
                Kumbhivali Campus
              </span>

              {/* Offset statistic card — deliberately breaks the grid */}
              <div className="absolute -bottom-8 left-4 right-4 rounded-2xl border border-line bg-paper p-6 sm:left-auto sm:right-6 sm:w-[280px] lg:-left-10 lg:right-auto lg:w-[268px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ash">
                  Class of 2025
                </p>
                <p className="numerals mt-3 text-[52px] font-extrabold leading-none text-ink">
                  92%
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-ash">
                  of eligible registered students received at least one offer.
                </p>
                <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    initial={reduced ? { width: "92%" } : { width: 0 }}
                    animate={{ width: "92%" }}
                    transition={{
                      duration: 1.4,
                      delay: 0.9,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="h-full rounded-full bg-pine"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
