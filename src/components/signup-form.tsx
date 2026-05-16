"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  Mail,
  Lock,
  User,
  IdCard,
  Phone,
  GraduationCap,
  Building2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, extractErrorMessage } from "@/lib/api/base";
import { DEPARTMENT_LABELS, type Department } from "@/lib/api/student";

const DEPARTMENTS: Department[] = [
  "CSE",
  "COMPUTER",
  "ELECTRICAL",
  "EXTC",
  "MECHANICAL",
  "CIVIL",
];
const ACADEMIC_YEARS: { value: string; label: string }[] = [
  { value: "FIRST_YEAR", label: "First Year" },
  { value: "SECOND_YEAR", label: "Second Year" },
  { value: "THIRD_YEAR", label: "Third Year" },
  { value: "FOURTH_YEAR", label: "Fourth Year" },
];

const inputBase =
  "w-full h-11 pl-10 pr-3 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition";

export function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    emailId: "",
    password: "",
    studentId: "",
    department: "",
    academicYear: "",
    contactNo: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((f) => ({ ...f, [id]: value }));
    if (fieldErrors[id]) setFieldErrors((fe) => ({ ...fe, [id]: [] }));
  };

  const handleSelect = (key: "department" | "academicYear", value: string) => {
    setFormData((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.department || !formData.academicYear) {
      toast.error("Please select department and academic year");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", formData);
      toast.success(data.message || "Account created. Wait for approval.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (error: any) {
      const errs = error?.response?.data?.errors;
      if (errs) setFieldErrors(errs);
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const yearLabel = ACADEMIC_YEARS.find(
    (y) => y.value === formData.academicYear
  )?.label;

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Join the Vishwaniketan TPO portal in a few steps.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldBlock label="Full Name" error={fieldErrors.fullName}>
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              id="fullName"
              type="text"
              placeholder="John Doe"
              required
              value={formData.fullName}
              onChange={handleChange}
              className={inputBase}
            />
          </FieldBlock>

          <FieldBlock label="Student ID" error={fieldErrors.studentId}>
            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              id="studentId"
              type="text"
              required
              onChange={handleChange}
              value={formData.studentId}
              placeholder="e.g. VI2023CSE001"
              className={inputBase}
            />
          </FieldBlock>
        </div>

        <FieldBlock label="Email" error={fieldErrors.emailId}>
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            id="emailId"
            type="email"
            placeholder="yourname@vishwaniketan.edu.in"
            value={formData.emailId}
            onChange={handleChange}
            required
            className={inputBase}
          />
        </FieldBlock>

        <FieldBlock label="Password" error={fieldErrors.password}>
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 8 characters"
            value={formData.password}
            onChange={handleChange}
            required
            className={`${inputBase} pr-10`}
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
        </FieldBlock>

        <FieldBlock label="Contact Number" error={fieldErrors.contactNo}>
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            id="contactNo"
            type="tel"
            onChange={handleChange}
            value={formData.contactNo}
            placeholder="10-digit mobile number"
            className={inputBase}
          />
        </FieldBlock>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 uppercase tracking-wide">
              Department
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full h-11 pl-10 pr-3 relative rounded-lg border border-neutral-200 bg-white text-sm text-left text-neutral-900 hover:border-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition flex items-center justify-between">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <span
                  className={
                    formData.department ? "text-neutral-900" : "text-neutral-400"
                  }
                >
                  {formData.department
                    ? DEPARTMENT_LABELS[formData.department as Department]
                    : "Select department"}
                </span>
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[var(--radix-dropdown-menu-trigger-width)]">
                {DEPARTMENTS.map((dept) => (
                  <DropdownMenuItem
                    key={dept}
                    onClick={() => handleSelect("department", dept)}
                  >
                    {DEPARTMENT_LABELS[dept]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 uppercase tracking-wide">
              Academic Year
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full h-11 pl-10 pr-3 relative rounded-lg border border-neutral-200 bg-white text-sm text-left text-neutral-900 hover:border-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition flex items-center justify-between">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <span
                  className={
                    yearLabel ? "text-neutral-900" : "text-neutral-400"
                  }
                >
                  {yearLabel || "Select year"}
                </span>
                <ChevronDown className="h-4 w-4 text-neutral-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[var(--radix-dropdown-menu-trigger-width)]">
                {ACADEMIC_YEARS.map((y) => (
                  <DropdownMenuItem
                    key={y.value}
                    onClick={() => handleSelect("academicYear", y.value)}
                  >
                    {y.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 active:bg-neutral-950 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Create account
            </>
          )}
        </button>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-900 hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

function FieldBlock({
  label,
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-700 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">{children}</div>
      {error && error.length > 0 && (
        <p className="text-xs text-red-600">{error.join(", ")}</p>
      )}
    </div>
  );
}
