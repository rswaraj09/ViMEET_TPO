"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./landing-data";

export function SiteHeader({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    onNavigate(id);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-paper transition-[border-color] duration-300",
        scrolled ? "border-b border-line" : "border-b border-transparent"
      )}
    >
      <div className="editorial-shell">
        <div className="flex h-[76px] items-center justify-between gap-8">
          {/* Identity */}
          <button
            type="button"
            onClick={() => go("top")}
            className="flex items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              className="h-9 w-auto"
              aria-hidden="true"
            />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-[15px] font-extrabold tracking-[-0.02em] text-ink">
                Vishwaniketan iMEET
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ash">
                Training &amp; Placement Cell
              </span>
            </span>
          </button>

          {/* Desktop navigation */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-9 lg:flex"
          >
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => go(link.id)}
                className="rule-in pb-1 text-[14px] font-medium tracking-tight text-ash transition-colors duration-200 hover:text-ink"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="hidden h-10 items-center rounded-xl px-4 text-[14px] font-semibold tracking-tight text-ink transition-colors duration-200 hover:bg-surface sm:inline-flex"
            >
              Student Login
            </button>
            <button
              type="button"
              onClick={() => go("contact")}
              className="hidden h-10 items-center rounded-xl bg-ink px-5 text-[14px] font-semibold tracking-tight text-white transition-colors duration-200 hover:bg-pine md:inline-flex"
            >
              Recruit With Us
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-line text-ink transition-colors duration-200 hover:border-ink lg:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 bottom-0 top-[76px] z-40 overflow-y-auto border-t border-line bg-paper lg:hidden"
          >
            <div className="editorial-shell py-10">
              <ul className="border-t border-line">
                {NAV_LINKS.map((link, i) => (
                  <motion.li
                    key={link.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.35 }}
                    className="border-b border-line"
                  >
                    <button
                      type="button"
                      onClick={() => go(link.id)}
                      className="flex w-full items-baseline gap-4 py-5 text-left"
                    >
                      <span className="numerals text-[11px] font-semibold text-pine">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-2xl font-bold tracking-[-0.03em] text-ink">
                        {link.label}
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push("/login");
                  }}
                  className="h-12 rounded-xl border border-line-strong text-[15px] font-semibold text-ink"
                >
                  Student Login
                </button>
                <button
                  type="button"
                  onClick={() => go("contact")}
                  className="h-12 rounded-xl bg-pine text-[15px] font-semibold text-white"
                >
                  Recruit With Us
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
