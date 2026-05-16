"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Loader2,
  BadgeCheck,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { getFacultyDetail, type FacultyListItem } from "@/lib/api/admin";
import { departmentLabel } from "@/lib/api/student";
import { extractErrorMessage } from "@/lib/api/base";

export function FacultyDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [faculty, setFaculty] = useState<FacultyListItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const n = Number(id);
    if (Number.isNaN(n)) {
      toast.error("Invalid faculty id");
      router.push("/admin");
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await getFacultyDetail(n);
        setFaculty(res.faculty);
      } catch (error) {
        toast.error(extractErrorMessage(error));
        router.push("/admin");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!faculty) return null;

  const initials = faculty.fullName?.slice(0, 2).toUpperCase() || "FA";
  const joined = new Date(faculty.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="h-4 w-px bg-neutral-200" />
          <h1 className="text-sm font-semibold text-neutral-900">
            Faculty details
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 text-lg font-bold text-white">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
                  {faculty.fullName}
                </h2>
                {faculty.isHOD ? (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    <ShieldCheck className="h-3 w-3" />
                    HOD
                  </span>
                ) : (
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                    Faculty
                  </span>
                )}
                {faculty.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    <BadgeCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
                {!faculty.isActive && (
                  <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700">
                    Inactive
                  </span>
                )}
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow icon={Mail} label="Email" value={faculty.emailId} />
                <InfoRow
                  icon={Phone}
                  label="Contact"
                  value={faculty.contactNo ?? "—"}
                />
                <InfoRow
                  icon={Building2}
                  label="Department"
                  value={departmentLabel(faculty.department) || "—"}
                />
                <InfoRow icon={CalendarDays} label="Joined" value={joined} />
              </dl>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          {label}
        </p>
        <p className="truncate text-sm text-neutral-900">{value}</p>
      </div>
    </div>
  );
}
