"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Calendar,
  MapPin,
  IndianRupee,
  Search,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { StudentLayout } from "@/components/shared/StudentLayout";
import { extractErrorMessage } from "@/lib/api/base";
import {
  studentListEligibleJobs,
  studentApplyToJob,
  type StudentJob,
  type ApplicationStatus,
} from "@/lib/api/jobs";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  APPLIED: "bg-blue-50 text-blue-700 ring-blue-200",
  SHORTLISTED: "bg-amber-50 text-amber-700 ring-amber-200",
  INTERVIEW: "bg-purple-50 text-purple-700 ring-purple-200",
  SELECTED: "bg-green-50 text-green-700 ring-green-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
};

export function StudentJobs() {
  const [jobs, setJobs] = useState<StudentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<StudentJob | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setJobs(await studentListEligibleJobs());
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApply = async (job: StudentJob) => {
    setApplyingId(job.id);
    try {
      await studentApplyToJob(job.id);
      toast.success("Applied successfully");
      load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setApplyingId(null);
    }
  };

  const term = search.trim().toLowerCase();
  const filtered = term
    ? jobs.filter(
        (j) =>
          j.companyName.toLowerCase().includes(term) ||
          j.jobTitle.toLowerCase().includes(term)
      )
    : jobs;

  const eligibleCount = jobs.filter((j) => j.eligible).length;

  return (
    <StudentLayout
      title="Jobs"
      subtitle={`${eligibleCount} of ${jobs.length} open roles match your profile.`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search company or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Briefcase className="h-5 w-5 text-neutral-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900">
              No jobs right now
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Check back later — new drives appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((j) => (
              <article
                key={j.id}
                className={`rounded-2xl border bg-white p-5 transition ${
                  j.eligible
                    ? "border-neutral-200 hover:border-neutral-300"
                    : "border-neutral-200 opacity-90"
                }`}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <button
                    type="button"
                    onClick={() => setSelected(j)}
                    className="flex min-w-0 flex-1 items-start gap-4 text-left"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-sm font-semibold text-white">
                      {j.companyName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-neutral-900">
                          {j.jobTitle}
                        </h3>
                        <EligibilityBadge
                          eligible={j.eligible}
                          reasons={j.ineligibleReasons}
                        />
                      </div>
                      <p className="truncate text-sm text-neutral-500">
                        {j.companyName}
                      </p>

                      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                          {j.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <IndianRupee className="h-3.5 w-3.5 text-neutral-400" />
                          {j.package}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                          {new Date(j.deadline).toLocaleDateString()}
                        </span>
                        {j.minCgpa != null && (
                          <span>Min CGPA {j.minCgpa}</span>
                        )}
                      </dl>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Chip>{j.jobType.replace("_", " ")}</Chip>
                        <Chip>{j.locationType}</Chip>
                      </div>
                    </div>
                  </button>

                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    {j.myApplication ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${
                          STATUS_STYLES[j.myApplication.status]
                        }`}
                      >
                        {j.myApplication.status}
                      </span>
                    ) : j.eligible ? (
                      <button
                        type="button"
                        disabled={applyingId === j.id}
                        onClick={() => handleApply(j)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {applyingId === j.id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        {applyingId === j.id ? "Applying…" : "Apply"}
                      </button>
                    ) : (
                      <span
                        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-400"
                        title="You don't meet the eligibility criteria"
                      >
                        Not eligible
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {selected && (
          <JobDetailDrawer
            job={selected}
            onClose={() => setSelected(null)}
            onApply={() => {
              handleApply(selected);
              setSelected(null);
            }}
            applying={applyingId === selected.id}
          />
        )}
      </div>
    </StudentLayout>
  );
}

const REASON_LABEL: Record<"department" | "year" | "cgpa", string> = {
  department: "department",
  year: "year",
  cgpa: "CGPA",
};

function EligibilityBadge({
  eligible,
  reasons,
}: {
  eligible: boolean;
  reasons: Array<"department" | "year" | "cgpa">;
}) {
  if (eligible) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700 ring-1 ring-green-200">
        <CheckCircle2 className="h-3 w-3" />
        Eligible
      </span>
    );
  }
  const label = reasons.length
    ? `Not eligible (${reasons.map((r) => REASON_LABEL[r]).join(", ")})`
    : "Not eligible";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
      <AlertCircle className="h-3 w-3" />
      {label}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
      {children}
    </span>
  );
}

function JobDetailDrawer({
  job,
  onClose,
  onApply,
  applying,
}: {
  job: StudentJob;
  onClose: () => void;
  onApply: () => void;
  applying: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-xl flex-col bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-neutral-900">
              {job.jobTitle}
            </h3>
            <p className="truncate text-sm text-neutral-500">
              {job.companyName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <DetailRow label="Package" value={job.package} />
            <DetailRow
              label="Location"
              value={`${job.location} (${job.locationType})`}
            />
            <DetailRow label="Job type" value={job.jobType.replace("_", " ")} />
            <DetailRow
              label="Deadline"
              value={new Date(job.deadline).toLocaleString()}
            />
            {job.minCgpa != null && (
              <DetailRow label="Min CGPA" value={String(job.minCgpa)} />
            )}
            {job.openings != null && (
              <DetailRow label="Openings" value={String(job.openings)} />
            )}
            <DetailRow
              label="Eligible years"
              value={job.eligibleYears
                .map((y) => y.replace("_", " "))
                .join(", ")}
            />
            <DetailRow
              label="Eligible departments"
              value={job.eligibleDepartments.join(", ")}
            />
            {job.rounds.length > 0 && (
              <DetailRow label="Rounds" value={job.rounds.join(" → ")} />
            )}
            {job.bondDetails && (
              <DetailRow label="Bond" value={job.bondDetails} />
            )}
          </dl>

          <div className="mt-6 space-y-4">
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Description
              </h4>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                {job.description}
              </p>
            </section>
            {job.additionalNotes && (
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Additional notes
                </h4>
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                  {job.additionalNotes}
                </p>
              </section>
            )}
          </div>
        </div>

        <div className="border-t border-neutral-200 px-6 py-4">
          {job.myApplication ? (
            <div
              className={`rounded-md px-4 py-2.5 text-center text-sm font-medium ring-1 ${
                STATUS_STYLES[job.myApplication.status]
              }`}
            >
              Your status: {job.myApplication.status}
            </div>
          ) : job.eligible ? (
            <button
              type="button"
              onClick={onApply}
              disabled={applying}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applying && <Loader2 className="h-4 w-4 animate-spin" />}
              {applying ? "Applying…" : "Apply now"}
            </button>
          ) : (
            <div className="rounded-md bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-800 ring-1 ring-amber-200">
              You don't meet the eligibility criteria
              {job.ineligibleReasons.length > 0 &&
                ` (${job.ineligibleReasons
                  .map((r) => REASON_LABEL[r])
                  .join(", ")})`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-neutral-900">{value}</dd>
    </div>
  );
}
