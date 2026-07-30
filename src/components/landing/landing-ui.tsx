"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------- */
/* Reveal — a single, restrained entrance. No parallax, no scale, no blur. */
/* -------------------------------------------------------------------- */

const MOTION_TAGS: Record<string, React.ElementType> = {
  div: motion.div,
  li: motion.li,
  section: motion.section,
  header: motion.header,
};

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "header";
}) {
  const reduced = useReducedMotion();
  const Component = MOTION_TAGS[as];

  return (
    <Component
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </Component>
  );
}

/* -------------------------------------------------------------------- */
/* Section scaffolding                                                    */
/* -------------------------------------------------------------------- */

export function Eyebrow({
  index,
  children,
  tone = "ink",
}: {
  index?: string;
  children: React.ReactNode;
  tone?: "ink" | "paper";
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em]",
        tone === "ink" ? "text-ash" : "text-white/50"
      )}
    >
      {index && (
        <span className={tone === "ink" ? "text-pine" : "text-white/70"}>
          {index}
        </span>
      )}
      <span
        aria-hidden
        className={cn(
          "h-px w-6",
          tone === "ink" ? "bg-line-strong" : "bg-white/25"
        )}
      />
      {children}
    </p>
  );
}

/**
 * Section heading laid out on the 12-column grid: title on the left five
 * columns, optional supporting copy set against the right edge.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  body,
  action,
  tone = "ink",
}: {
  index?: string;
  eyebrow: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  tone?: "ink" | "paper";
}) {
  return (
    <Reveal className="grid grid-cols-12 gap-y-8 md:gap-x-8">
      <div className="col-span-12 lg:col-span-6">
        <Eyebrow index={index} tone={tone}>
          {eyebrow}
        </Eyebrow>
        <h2
          className={cn(
            "mt-6 max-w-[16ch] text-balance text-[clamp(2.1rem,4.4vw,3.4rem)] font-extrabold leading-[1.03] tracking-[-0.035em]",
            tone === "ink" ? "text-ink" : "text-white"
          )}
        >
          {title}
        </h2>
      </div>
      {(body || action) && (
        <div className="col-span-12 flex flex-col justify-end gap-6 lg:col-span-5 lg:col-start-8">
          {body && (
            <p
              className={cn(
                "max-w-[46ch] text-[17px] leading-[1.75]",
                tone === "ink" ? "text-ash" : "text-white/65"
              )}
            >
              {body}
            </p>
          )}
          {action}
        </div>
      )}
    </Reveal>
  );
}

/* -------------------------------------------------------------------- */
/* Links & buttons                                                        */
/* -------------------------------------------------------------------- */

export function ArrowLink({
  children,
  onClick,
  href,
  tone = "ink",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  tone?: "ink" | "paper" | "pine";
  className?: string;
}) {
  const toneClass =
    tone === "paper"
      ? "text-white"
      : tone === "pine"
        ? "text-pine"
        : "text-ink";

  const content = (
    <>
      <span className="rule-in pb-0.5">{children}</span>
      <ArrowUpRight
        className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden
      />
    </>
  );

  const classes = cn(
    "group inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-4",
    toneClass,
    className
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

const BUTTON_BASE =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold tracking-tight transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

export function PrimaryButton({
  children,
  onClick,
  href,
  tone = "pine",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  tone?: "pine" | "paper";
  className?: string;
}) {
  const classes = cn(
    BUTTON_BASE,
    tone === "pine"
      ? "bg-pine text-white hover:bg-pine-deep focus-visible:ring-pine"
      : "bg-white text-ink hover:bg-surface-2 focus-visible:ring-white focus-visible:ring-offset-ink",
    className
  );

  return href ? (
    <a href={href} className={classes}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  href,
  tone = "ink",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  tone?: "ink" | "paper";
  className?: string;
}) {
  const classes = cn(
    BUTTON_BASE,
    "border",
    tone === "ink"
      ? "border-line-strong text-ink hover:border-ink hover:bg-surface focus-visible:ring-ink"
      : "border-white/30 text-white hover:border-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-ink",
    className
  );

  return href ? (
    <a href={href} className={classes}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------- */
/* Count-up — eases to the target once the figure scrolls into view.      */
/* -------------------------------------------------------------------- */

export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1600,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView || reduced) return;

    let frame = 0;
    const start = performance.now();
    // easeOutExpo — fast out of the gate, long settle.
    const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(value * ease(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, value, duration]);

  return (
    <span ref={ref} className="numerals">
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
