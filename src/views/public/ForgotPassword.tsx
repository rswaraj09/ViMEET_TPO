"use client";

import { useState } from "react";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import { Loader2, Mail, MailCheck, Send } from "lucide-react";
import { api, extractErrorMessage } from "@/lib/api/base";
import { AuthNavbar } from "@/components/shared/AuthNavbar";

export function ForgotPassword() {
  const [emailId, setEmailId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { emailId });
      setSent(true);
      toast.success("If an account exists, a reset link was sent.");
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh bg-neutral-50 flex flex-col">
      <Toaster position="top-right" richColors />
      <AuthNavbar rightLabel="Back to login" rightTo="/login" showBackArrow />

      <main className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-neutral-200 p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
                {sent ? (
                  <MailCheck className="h-5 w-5 text-white" />
                ) : (
                  <Mail className="h-5 w-5 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                {sent ? "Check your inbox" : "Reset your password"}
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                {sent
                  ? "We've sent a reset link if that email is on file."
                  : "Enter your email and we'll send you a link to reset your password."}
              </p>
            </div>

            <div className="mt-8">
              {sent ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                    <p>
                      The link will expire in{" "}
                      <span className="font-medium text-neutral-900">
                        1 hour
                      </span>
                      . Check your spam folder if you don&apos;t see it.
                    </p>
                  </div>
                  <button
                    onClick={() => setSent(false)}
                    className="w-full h-11 inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition"
                  >
                    Try another email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="emailId"
                      className="text-xs font-medium text-neutral-700 uppercase tracking-wide"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <input
                        id="emailId"
                        type="email"
                        placeholder="yourname@vishwaniketan.edu.in"
                        value={emailId}
                        onChange={(e) => setEmailId(e.target.value)}
                        required
                        className="w-full h-11 pl-10 pr-3 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send reset link
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-neutral-900 hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-neutral-400 border-t border-neutral-100">
        © {new Date().getFullYear()} Vishwaniketan iMEET · TPO Portal
      </footer>
    </div>
  );
}
