"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthNavbarProps {
  /** Optional right-side action link */
  rightLabel?: string;
  rightTo?: string;
  /** Show "back" arrow instead of plain link */
  showBackArrow?: boolean;
  /** Hide on large screens (useful when a side branding panel is visible) */
  hideOnDesktop?: boolean;
}

export function AuthNavbar({
  rightLabel,
  rightTo,
  showBackArrow = false,
  hideOnDesktop = false,
}: AuthNavbarProps) {
  return (
    <header
      className={`${
        hideOnDesktop ? "lg:hidden" : ""
      } border-b border-neutral-200 bg-white`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Vishwaniketan" className="h-8 w-8" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-neutral-900">
              Vishwaniketan
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
              TPO Portal
            </span>
          </div>
        </Link>

        {rightLabel && rightTo && (
          <Link
            href={rightTo}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition"
          >
            {showBackArrow && <ArrowLeft className="h-4 w-4" />}
            {rightLabel}
          </Link>
        )}
      </div>
    </header>
  );
}
