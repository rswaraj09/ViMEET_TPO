"use client";

import { useRouter } from "next/navigation";
import { NAV_LINKS, PLACEMENT_OFFICER } from "./landing-data";

const PORTAL_LINKS = [
  { label: "Student Login", href: "/login" },
  { label: "Register", href: "/signup" },
  { label: "Alumni Network", href: "/alumni" },
];

export function SiteFooter({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <footer className="border-t border-line bg-paper">
      <div className="editorial-shell">
        <div className="grid grid-cols-12 gap-y-12 py-16 lg:gap-x-8 lg:py-20">
          {/* Identity */}
          <div className="col-span-12 lg:col-span-5">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="h-9 w-auto" aria-hidden />
              <span className="flex flex-col leading-none">
                <span className="text-[15px] font-extrabold tracking-[-0.02em] text-ink">
                  Vishwaniketan iMEET
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ash">
                  Training &amp; Placement Cell
                </span>
              </span>
            </div>

            <p className="mt-7 max-w-[42ch] text-[14.5px] leading-[1.75] text-ash">
              Preparing engineering graduates for the roles industry is actually
              hiring for — through year-round training, verified profiles and a
              transparent placement process.
            </p>
          </div>

          {/* Sections */}
          <nav
            aria-label="Sections"
            className="col-span-6 sm:col-span-4 lg:col-span-2 lg:col-start-7"
          >
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ash-light">
              Sections
            </h2>
            <ul className="mt-6 space-y-3.5">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(link.id)}
                    className="rule-in pb-0.5 text-[14.5px] font-medium text-ink"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Portal */}
          <nav
            aria-label="Portal"
            className="col-span-6 sm:col-span-4 lg:col-span-2"
          >
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ash-light">
              Portal
            </h2>
            <ul className="mt-6 space-y-3.5">
              {PORTAL_LINKS.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => router.push(link.href)}
                    className="rule-in pb-0.5 text-[14.5px] font-medium text-ink"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Reach */}
          <div className="col-span-12 sm:col-span-4 lg:col-span-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ash-light">
              Reach Us
            </h2>
            <ul className="mt-6 space-y-3.5 text-[14.5px] font-medium">
              <li>
                <a
                  href={`mailto:${PLACEMENT_OFFICER.email}`}
                  className="rule-in break-all pb-0.5 text-ink"
                >
                  {PLACEMENT_OFFICER.email}
                </a>
              </li>
              <li>
                <a
                  href={PLACEMENT_OFFICER.phoneHref}
                  className="rule-in numerals pb-0.5 text-ink"
                >
                  {PLACEMENT_OFFICER.phone}
                </a>
              </li>
              <li className="pt-1 text-[13.5px] font-normal leading-relaxed text-ash">
                Khalapur, Raigad
                <br />
                Maharashtra 410202
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-line py-8 text-[12.5px] text-ash-light sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Vishwaniketan iMEET Training &amp;
            Placement Cell. All rights reserved.
          </p>
          <div className="flex gap-7">
            <a href="#" className="rule-in pb-0.5 hover:text-ink">
              Privacy Policy
            </a>
            <a href="#" className="rule-in pb-0.5 hover:text-ink">
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
