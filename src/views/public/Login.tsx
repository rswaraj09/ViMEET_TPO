"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, GraduationCap, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { AuthNavbar } from "@/components/shared/AuthNavbar";

export function Login() {
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
              One portal.
              <br />
              Every opportunity.
            </h2>
            <p className="mt-4 text-neutral-400 text-sm max-w-md leading-relaxed">
              Track your profile, apply to verified jobs, and stay in sync with
              your placement team — all in one place.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <Feature
            icon={<Briefcase className="h-4 w-4" />}
            title="Verified opportunities"
            desc="Only eligible, department-filtered listings."
          />
          <Feature
            icon={<GraduationCap className="h-4 w-4" />}
            title="Profile-driven matching"
            desc="Marks, resume, and achievements in one place."
          />
          <Feature
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Faculty-verified"
            desc="Every application is reviewed before recruiters see it."
          />
        </div>

        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full border border-white/5" />
        <div className="absolute -bottom-16 -left-16 h-60 w-60 rounded-full border border-white/5" />
      </aside>

      {/* Form panel */}
      <main className="flex-1 flex flex-col">
        <AuthNavbar rightLabel="Sign up" rightTo="/signup" hideOnDesktop />

        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <Suspense><LoginForm /></Suspense>
          </div>
        </div>

        <footer className="px-6 py-4 text-center text-xs text-neutral-400 border-t border-neutral-100">
          © {new Date().getFullYear()} Vishwaniketan iMEET · TPO Portal
        </footer>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-neutral-200">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-neutral-400">{desc}</p>
      </div>
    </div>
  );
}
