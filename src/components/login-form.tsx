"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  Mail,
  Lock,
  ShieldCheck,
  GraduationCap,
  User,
  Users,
} from "lucide-react";
import { api, extractErrorMessage } from "@/lib/api/base";
import { useAuth, roleLandingPath } from "@/context/AuthContext";

const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    emailId: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || "admin@pillai.edu.in",
    password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || "Admin@12345",
    icon: ShieldCheck,
  },
  {
    role: "Faculty",
    emailId: process.env.NEXT_PUBLIC_DEMO_FACULTY_EMAIL || "faculty@pillai.edu.in",
    password: process.env.NEXT_PUBLIC_DEMO_FACULTY_PASSWORD || "Faculty@12345",
    icon: GraduationCap,
  },
  {
    role: "Student",
    emailId: process.env.NEXT_PUBLIC_DEMO_STUDENT_EMAIL || "student@pillai.edu.in",
    password: process.env.NEXT_PUBLIC_DEMO_STUDENT_PASSWORD || "Student@12345",
    icon: User,
  },
  {
    role: "Alumni",
    emailId: process.env.NEXT_PUBLIC_DEMO_ALUMNI_EMAIL || "alumni@pillai.edu.in",
    password: process.env.NEXT_PUBLIC_DEMO_ALUMNI_PASSWORD || "Alumni@12345",
    icon: Users,
  },
] as const;

// Seeded via `npm run db:seed`. Hide on real production deploys by setting
// NEXT_PUBLIC_SHOW_DEMO_LOGINS=false in the environment.
const SHOW_DEMO_LOGINS = process.env.NEXT_PUBLIC_SHOW_DEMO_LOGINS !== "false";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const from = searchParams.get("from");

  const [formData, setFormData] = useState({ emailId: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signin", formData);
      login(data.user);
      toast.success("Login successful");
      router.replace(from ?? roleLandingPath(data.user.role));
    } catch (error) {
      toast.error(extractErrorMessage(error));
      setFormData((f) => ({ ...f, password: "" }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((f) => ({ ...f, [id]: value }));
  };

  const fillDemoAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setFormData({ emailId: account.emailId, password: account.password });
    toast.success(`Filled ${account.role} test credentials`);
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Sign in to continue to your TPO portal.
        </p>
      </div>

      {SHOW_DEMO_LOGINS && (
        <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Quick demo login — click a role to autofill
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                type="button"
                onClick={() => fillDemoAccount(account)}
                className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-left text-xs transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
              >
                <account.icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-medium">{account.role}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
              placeholder="yourname@gmail.com"
              value={formData.emailId}
              onChange={handleChange}
              required
              suppressHydrationWarning
              className="w-full h-11 pl-10 pr-3 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-medium text-neutral-700 uppercase tracking-wide"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-neutral-500 hover:text-neutral-900 transition"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={handleChange}
              suppressHydrationWarning
              className="w-full h-11 pl-10 pr-10 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          suppressHydrationWarning
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 active:bg-neutral-950 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign in
            </>
          )}
        </button>

        <p className="text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-neutral-900 hover:underline underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
