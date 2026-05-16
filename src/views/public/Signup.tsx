"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { SignupForm } from "@/components/signup-form";
import { AuthNavbar } from "@/components/shared/AuthNavbar";

const PERKS = [
  "Single login across all campus placement activity",
  "Curated, department-matched job recommendations",
  "Resume, marks & achievements stored centrally",
  "Real-time application status with email alerts",
];

export function Signup() {
  return (
    <div className="min-h-svh bg-neutral-50 flex">
      {/* Branding panel */}
      <aside className="hidden lg:flex lg:w-1/2 bg-neutral-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-300 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="mt-16">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Vishwaniketan"
                className="h-12 w-12 rounded-md bg-white p-1"
              />
              <div>
                <p className="font-semibold">Vishwaniketan</p>
                <p className="text-xs text-neutral-400">TPO Portal</p>
              </div>
            </div>
            <h2 className="mt-12 text-4xl font-semibold leading-tight tracking-tight">
              Start your placement
              <br />
              journey here.
            </h2>
            <p className="mt-4 text-neutral-400 text-sm max-w-md leading-relaxed">
              Create your student profile once. Apply to verified roles, track
              everything in one dashboard.
            </p>
          </div>
        </div>

        <ul className="relative z-10 space-y-3">
          {PERKS.map((p) => (
            <li key={p} className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-white/80 mt-0.5 flex-shrink-0" />
              <span className="text-neutral-300">{p}</span>
            </li>
          ))}
        </ul>

        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full border border-white/5" />
        <div className="absolute -bottom-16 -left-16 h-60 w-60 rounded-full border border-white/5" />
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex flex-col">
        <AuthNavbar rightLabel="Sign in" rightTo="/login" hideOnDesktop />

        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-lg py-8">
            <SignupForm />
          </div>
        </div>

        <footer className="px-6 py-4 text-center text-xs text-neutral-400 border-t border-neutral-100">
          © {new Date().getFullYear()} Vishwaniketan iMEET · TPO Portal
        </footer>
      </main>
    </div>
  );
}
