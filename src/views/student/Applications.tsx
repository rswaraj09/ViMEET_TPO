"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Briefcase, Calendar, MapPin, IndianRupee, Loader2 } from "lucide-react";
import { StudentLayout } from "@/components/shared/StudentLayout";
import { extractErrorMessage } from "@/lib/api/base";
import {
  studentListMyApplications,
  type JobApplication,
  type Job,
  type ApplicationStatus,
} from "@/lib/api/jobs";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  APPLIED: "bg-blue-50 text-blue-700 ring-blue-200",
  SHORTLISTED: "bg-amber-50 text-amber-700 ring-amber-200",
  INTERVIEW: "bg-purple-50 text-purple-700 ring-purple-200",
  SELECTED: "bg-green-50 text-green-700 ring-green-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
};

type AppWithJob = JobApplication & { job: Job };

export function StudentApplications() {
  const [items, setItems] = useState<AppWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setItems(await studentListMyApplications());
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <StudentLayout
      title="My applications"
      subtitle="Track the status of every job you've applied to."
    >
      <div className="mx-auto max-w-5xl">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Briefcase className="h-5 w-5 text-neutral-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900">
              No applications yet
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Head over to Jobs to find opportunities you're eligible for.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((a) => (
              <article
                key={a.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-sm font-semibold text-white">
                    {a.job.companyName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-neutral-900">
                      {a.job.jobTitle}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {a.job.companyName}
                    </p>

                    <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                        {a.job.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5 text-neutral-400" />
                        {a.job.package}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        Applied {new Date(a.appliedAt).toLocaleDateString()}
                      </span>
                    </dl>
                  </div>

                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${
                      STATUS_STYLES[a.status]
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
