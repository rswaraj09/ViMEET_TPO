"use client";

import { useState } from "react";
import { ArrowLink, Reveal, SectionHeading } from "./landing-ui";
import { RECRUITERS, type Recruiter } from "./landing-data";

/**
 * A single cell in the logo lattice. Real marks are pulled monochrome and
 * sit at 40% until hovered; anything the CDN can't resolve degrades to a
 * typeset wordmark so the grid never shows a broken image.
 */
function RecruiterCell({ recruiter }: { recruiter: Recruiter }) {
  const [failed, setFailed] = useState(false);
  const showWordmark = !recruiter.slug || failed;

  return (
    <div className="group flex h-24 items-center justify-center bg-paper px-5 transition-colors duration-300 hover:bg-surface md:h-28">
      {showWordmark ? (
        <span className="text-center text-[13px] font-semibold leading-tight tracking-tight text-ash-light transition-colors duration-300 group-hover:text-ink">
          {recruiter.name}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://cdn.simpleicons.org/${recruiter.slug}/111111`}
          alt={recruiter.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-7 max-w-[110px] object-contain opacity-40 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
    </div>
  );
}

export function Recruiters({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  return (
    <section
      id="recruiters"
      className="scroll-mt-24 border-b border-line bg-paper py-24 md:py-32 lg:py-40"
    >
      <div className="editorial-shell">
        <SectionHeading
          index="02"
          eyebrow="Top Recruiters"
          title="Companies that hire from our campus"
          body="From global consultancies to product engineering firms and core manufacturing, our partners return each year because the pipeline holds up."
          action={
            <ArrowLink onClick={() => onNavigate("contact")} tone="pine">
              Become a recruiting partner
            </ArrowLink>
          }
        />

        <Reveal delay={0.1} className="mt-16 md:mt-20">
          <div className="hairline-grid grid-cols-2 rounded-2xl sm:grid-cols-3 lg:grid-cols-6">
            {RECRUITERS.map((r) => (
              <RecruiterCell key={r.name} recruiter={r} />
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-8 text-[13px] text-ash-light">
            A representative selection. Over 150 organisations have recruited at
            Vishwaniketan iMEET since 2019.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
