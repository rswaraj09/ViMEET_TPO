"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Reveal, SectionHeading } from "./landing-ui";
import { PROCESS } from "./landing-data";

export function Process() {
  const trackRef = useRef<HTMLDivElement>(null);
  const inView = useInView(trackRef, { once: true, margin: "-120px" });
  const reduced = useReducedMotion();

  return (
    <section
      id="process"
      className="scroll-mt-24 border-b border-line bg-surface py-24 md:py-32 lg:py-40"
    >
      <div className="editorial-shell">
        <SectionHeading
          index="05"
          eyebrow="Placement Process"
          title="Five steps, start to offer"
          body="A published, predictable sequence. Recruiters know what to expect from the first mail; students know exactly where they stand at every stage."
        />

        <div ref={trackRef} className="relative mt-20 md:mt-24">
          {/* The rule the timeline hangs from — draws in on entry */}
          <div
            className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-line-strong lg:left-0 lg:top-[7px] lg:h-px lg:w-full"
            aria-hidden
          >
            <motion.div
              initial={reduced ? { scaleY: 1, scaleX: 1 } : { scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : undefined}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full origin-top bg-pine lg:hidden"
            />
            <motion.div
              initial={reduced ? { scaleX: 1 } : { scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : undefined}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              className="hidden h-full w-full origin-left bg-pine lg:block"
            />
          </div>

          <ol className="grid gap-y-12 lg:grid-cols-5 lg:gap-x-8">
            {PROCESS.map((item, i) => (
              <Reveal
                as="li"
                key={item.step}
                delay={0.1 + i * 0.09}
                className="relative pl-10 lg:pl-0 lg:pr-6"
              >
                {/* Node */}
                <span
                  className="absolute left-0 top-0.5 flex size-[15px] items-center justify-center rounded-full border-2 border-pine bg-surface lg:top-0"
                  aria-hidden
                >
                  <span className="size-[5px] rounded-full bg-pine" />
                </span>

                <div className="lg:pt-9">
                  <p className="numerals text-[11px] font-bold tracking-[0.2em] text-pine">
                    {item.step}
                  </p>
                  <h3 className="mt-3 text-[19px] font-bold leading-tight tracking-[-0.03em] text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-[38ch] text-[14.5px] leading-[1.7] text-ash">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
