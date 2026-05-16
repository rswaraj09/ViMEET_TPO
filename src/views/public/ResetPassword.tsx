"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { api, extractErrorMessage } from "@/lib/api/base";
import { AuthNavbar } from "@/components/shared/AuthNavbar";

export function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password reset. You can now sign in.");
      setTimeout(() => router.push("/login"), 800);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(password);

  return (
    <div className="min-h-svh bg-neutral-50 flex flex-col">
      <Toaster position="top-right" richColors />
      <AuthNavbar rightLabel="Back to login" rightTo="/login" showBackArrow />

      <main className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-neutral-200 p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Set a new password
              </h1>
              <p className="mt-2 text-sm text-neutral-500">
                Choose a strong password you haven&apos;t used before.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-neutral-700 uppercase tracking-wide"
                >
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    id="password"
                    type={show ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-10 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition"
                    tabIndex={-1}
                  >
                    {show ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i < strength.score
                              ? "bg-neutral-900"
                              : "bg-neutral-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-500">
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirm"
                  className="text-xs font-medium text-neutral-700 uppercase tracking-wide"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    id="confirm"
                    type={show ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-3 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
                  />
                </div>
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-600">
                    Passwords don&apos;t match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Reset password
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Remembered it?{" "}
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

function getStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
}
