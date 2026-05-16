"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle, Save } from "lucide-react";
import { StudentLayout } from "@/components/shared/StudentLayout";
import { extractErrorMessage } from "@/lib/api/base";
import {
  getMarks,
  updateMarks,
  uploadMarksheet,
  validateFileSize,
  type Marks,
  type PendingVerification,
  type UpdateMarksPayload,
} from "@/lib/api/student";
import { ExternalLink, FileText, Upload } from "lucide-react";

type ScoreKey =
  | "sscPercentage"
  | "hscPercentage"
  | "diplomaPercentage"
  | "sem1"
  | "sem2"
  | "sem3"
  | "sem4"
  | "sem5"
  | "sem6"
  | "sem7"
  | "sem8";

interface Row {
  label: string;
  scoreKey: ScoreKey;
  urlKey: string;
  unit: string;
  max: number;
}

const ROWS: Row[] = [
  { label: "SSC", scoreKey: "sscPercentage", urlKey: "sscMarksheetUrl", unit: "%", max: 100 },
  { label: "HSC", scoreKey: "hscPercentage", urlKey: "hscMarksheetUrl", unit: "%", max: 100 },
  { label: "Diploma", scoreKey: "diplomaPercentage", urlKey: "diplomaMarksheetUrl", unit: "%", max: 100 },
  { label: "Semester 1", scoreKey: "sem1", urlKey: "sem1MarksheetUrl", unit: "CGPA", max: 10 },
  { label: "Semester 2", scoreKey: "sem2", urlKey: "sem2MarksheetUrl", unit: "CGPA", max: 10 },
  { label: "Semester 3", scoreKey: "sem3", urlKey: "sem3MarksheetUrl", unit: "CGPA", max: 10 },
  { label: "Semester 4", scoreKey: "sem4", urlKey: "sem4MarksheetUrl", unit: "CGPA", max: 10 },
  { label: "Semester 5", scoreKey: "sem5", urlKey: "sem5MarksheetUrl", unit: "CGPA", max: 10 },
  { label: "Semester 6", scoreKey: "sem6", urlKey: "sem6MarksheetUrl", unit: "CGPA", max: 10 },
  { label: "Semester 7", scoreKey: "sem7", urlKey: "sem7MarksheetUrl", unit: "CGPA", max: 10 },
  { label: "Semester 8", scoreKey: "sem8", urlKey: "sem8MarksheetUrl", unit: "CGPA", max: 10 },
];

export function Marks() {
  const [marks, setMarks] = useState<Marks | null>(null);
  const [pending, setPending] = useState<PendingVerification | null>(null);
  const [scores, setScores] = useState<Record<ScoreKey, string>>(
    {} as Record<ScoreKey, string>
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMarks();
      setMarks(data.marks);
      setPending(data.pendingVerification);
      const next: Record<string, string> = {};
      for (const r of ROWS) {
        const v = data.marks[r.scoreKey];
        next[r.scoreKey] = v === null || v === undefined ? "" : String(v);
      }
      setScores(next as Record<ScoreKey, string>);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setScore = (key: ScoreKey, value: string) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marks) return;
    setSaving(true);

    const payload: UpdateMarksPayload = {};
    for (const r of ROWS) {
      const raw = scores[r.scoreKey]?.trim();
      if (raw === "" || raw === undefined) {
        if (marks[r.scoreKey] !== null) {
          payload[r.scoreKey] = null;
        }
        continue;
      }
      const num = Number(raw);
      if (Number.isNaN(num)) {
        toast.error(`${r.label}: must be a number`);
        setSaving(false);
        return;
      }
      if (num < 0 || num > r.max) {
        toast.error(`${r.label}: must be between 0 and ${r.max}`);
        setSaving(false);
        return;
      }
      payload[r.scoreKey] = num;
    }

    try {
      const res = await updateMarks(payload);
      setMarks(res.marks);
      setPending(res.pendingVerification);
      if (res.pendingFieldCount > 0) {
        toast.success(
          `${res.pendingFieldCount} score(s) submitted for faculty approval.`
        );
      } else {
        toast.success("No score changes detected.");
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const filledCount = ROWS.filter(
    (r) => scores[r.scoreKey] && scores[r.scoreKey].trim() !== ""
  ).length;

  const handleUpload = async (row: Row, file: File) => {
    if (!validateFileSize(file)) return;
    const toastId = toast.loading(`Uploading ${row.label} marksheet...`);
    try {
      const { url } = await uploadMarksheet(file, row.urlKey);
      setMarks((prev) => (prev ? { ...prev, [row.urlKey]: url, isVerified: false } : null));
      toast.success(`${row.label} marksheet uploaded.`, { id: toastId });
    } catch (e) {
      toast.error(extractErrorMessage(e), { id: toastId });
    }
  };

  return (
    <StudentLayout
      title="Academic marks"
      subtitle="Enter your SSC, HSC and semester-wise scores. Changes require faculty approval."
    >
      {loading || !marks ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Stats strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Entries" value={`${filledCount}/${ROWS.length}`} />
            <StatCard
              label="SSC %"
              value={
                marks.sscPercentage !== null ? `${marks.sscPercentage}` : "—"
              }
            />
            <StatCard
              label="HSC %"
              value={
                marks.hscPercentage !== null ? `${marks.hscPercentage}` : "—"
              }
            />
            <StatCard
              label="Status"
              value={marks.isVerified ? "Verified" : "Pending"}
              valueClass={
                marks.isVerified ? "text-green-700" : "text-yellow-700"
              }
            />
          </div>

          {/* Pending */}
          {pending && Object.keys(pending.changes).length > 0 && (
            <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-700" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-yellow-900">
                    Pending faculty approval
                  </h3>
                  <p className="mt-0.5 text-xs text-yellow-800">
                    {Object.keys(pending.changes).length} score change(s)
                    awaiting review.
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-yellow-900">
                    {Object.entries(pending.changes).map(([field, diff]) => (
                      <li key={field}>
                        <span className="font-semibold">{field}:</span>{" "}
                        <span className="line-through opacity-60">
                          {String(diff.oldValue ?? "—")}
                        </span>{" "}
                        → <span>{String(diff.newValue ?? "—")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          <form onSubmit={handleSubmit}>
            <section className="rounded-2xl border border-neutral-200 bg-white p-6">
              <header className="mb-5">
                <h3 className="text-base font-semibold text-neutral-900">
                  Your scores
                </h3>
                <p className="mt-0.5 text-sm text-neutral-500">
                  Percentages for SSC &amp; HSC, CGPA on a 10-point scale for
                  semesters.
                </p>
              </header>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ROWS.map((r) => (
                  <ScoreField
                    key={r.scoreKey}
                    row={r}
                    value={scores[r.scoreKey] ?? ""}
                    currentUrl={(marks as any)[r.urlKey]}
                    onChange={(v) => setScore(r.scoreKey, v)}
                    onUpload={(file) => handleUpload(r, file)}
                  />
                ))}
              </div>
            </section>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving…" : "Save scores"}
              </button>
            </div>
          </form>
        </div>
      )}
    </StudentLayout>
  );
}

function StatCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-semibold text-neutral-900 ${
          valueClass ?? ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ScoreField({
  row,
  value,
  currentUrl,
  onChange,
  onUpload,
}: {
  row: Row;
  value: string;
  currentUrl?: string | null;
  onChange: (v: string) => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center justify-between">
        <label
          htmlFor={row.scoreKey}
          className="text-xs font-semibold uppercase tracking-wider text-neutral-500"
        >
          {row.label}
        </label>
        <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-neutral-400">
          {row.unit}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <input
          id={row.scoreKey}
          type="number"
          step="0.01"
          min={0}
          max={row.max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={row.unit === "%" ? "0.00" : "0.00"}
          className="h-10 w-24 rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
        />

        <div className="flex flex-1 items-center gap-2">
          {currentUrl ? (
            <div className="flex h-10 flex-1 items-center justify-between rounded-md border border-neutral-200 bg-white px-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-neutral-400" />
                <span className="truncate text-xs text-neutral-600">
                  Marksheet uploaded
                </span>
              </div>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-2 shrink-0 text-neutral-400 hover:text-neutral-900"
                title="View marksheet"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            <div className="flex h-10 flex-1 items-center justify-center rounded-md border border-dashed border-neutral-300 bg-white px-3 text-neutral-400">
              <span className="text-[10px] font-medium italic">
                No marksheet
              </span>
            </div>
          )}

          <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-neutral-200 bg-white transition hover:border-neutral-900 hover:bg-neutral-50">
            <Upload className="h-4 w-4 text-neutral-600" />
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
