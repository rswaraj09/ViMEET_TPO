"use client";

import { useRouter } from "next/navigation";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Eyebrow, PrimaryButton, Reveal, SecondaryButton } from "./landing-ui";
import { PLACEMENT_OFFICER } from "./landing-data";

export function ContactCTA() {
  const router = useRouter();

  return (
    <section
      id="contact"
      className="scroll-mt-24 bg-ink py-24 md:py-32 lg:py-40"
    >
      <div className="editorial-shell">
        <div className="grid grid-cols-12 gap-y-16 lg:gap-x-8">
          {/* Closing statement */}
          <Reveal className="col-span-12 lg:col-span-6">
            <Eyebrow index="08" tone="paper">
              Contact
            </Eyebrow>

            <h2 className="mt-7 max-w-[18ch] text-balance text-[clamp(2.3rem,5vw,4rem)] font-extrabold leading-[1.0] tracking-[-0.04em] text-white">
              Let&apos;s plan your next{" "}
              <span className="font-editorial text-[1.06em] font-normal italic text-white/85">
                campus drive
              </span>
              .
            </h2>

            <p className="mt-7 max-w-[46ch] text-[17px] leading-[1.75] text-white/65">
              Share your role requirements and preferred dates, and the cell
              will return a shortlist plan and drive schedule within two working
              days.
            </p>

            <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center">
              <PrimaryButton
                tone="paper"
                href={`mailto:${PLACEMENT_OFFICER.email}?subject=Campus%20Recruitment%20Enquiry`}
              >
                Start a Conversation
              </PrimaryButton>
              <SecondaryButton tone="paper" onClick={() => router.push("/login")}>
                Student Portal
              </SecondaryButton>
            </div>
          </Reveal>

          {/* Placement officer details */}
          <Reveal delay={0.12} className="col-span-12 lg:col-span-5 lg:col-start-8">
            <div className="rounded-2xl border border-white/15 p-8 lg:p-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                Placement Officer
              </p>
              <p className="mt-4 text-[22px] font-bold tracking-[-0.03em] text-white">
                {PLACEMENT_OFFICER.name}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">
                {PLACEMENT_OFFICER.designation}
              </p>

              <dl className="mt-9 space-y-6 border-t border-white/15 pt-8">
                <div className="flex items-start gap-4">
                  <Mail
                    className="mt-1 size-4 shrink-0 text-white/40"
                    strokeWidth={1.7}
                    aria-hidden
                  />
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                      Email
                    </dt>
                    <dd className="mt-1.5">
                      <a
                        href={`mailto:${PLACEMENT_OFFICER.email}`}
                        className="rule-in pb-0.5 text-[15px] font-medium text-white"
                      >
                        {PLACEMENT_OFFICER.email}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone
                    className="mt-1 size-4 shrink-0 text-white/40"
                    strokeWidth={1.7}
                    aria-hidden
                  />
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                      Phone
                    </dt>
                    <dd className="mt-1.5">
                      <a
                        href={PLACEMENT_OFFICER.phoneHref}
                        className="rule-in numerals pb-0.5 text-[15px] font-medium text-white"
                      >
                        {PLACEMENT_OFFICER.phone}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock
                    className="mt-1 size-4 shrink-0 text-white/40"
                    strokeWidth={1.7}
                    aria-hidden
                  />
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                      Office Hours
                    </dt>
                    <dd className="mt-1.5 text-[15px] leading-relaxed text-white/80">
                      {PLACEMENT_OFFICER.hours}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin
                    className="mt-1 size-4 shrink-0 text-white/40"
                    strokeWidth={1.7}
                    aria-hidden
                  />
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                      Address
                    </dt>
                    <dd className="mt-1.5 text-[15px] leading-relaxed text-white/80">
                      {PLACEMENT_OFFICER.address.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
