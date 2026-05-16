"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, Users, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/api/base";
import { api } from "@/lib/api/base";
import { departmentLabel } from "@/lib/api/student";
import type { AcademicYear, Department } from "@/lib/api/student";
import type { TestCategory, SubmissionStatus } from "@/lib/api/aptitude";
import { TEST_CATEGORY_LABELS } from "@/lib/api/aptitude";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const YEAR_LABELS: Record<AcademicYear, string> = {
  FIRST_YEAR: "1st Year",
  SECOND_YEAR: "2nd Year",
  THIRD_YEAR: "3rd Year",
  FOURTH_YEAR: "4th Year",
};

interface TestSummary {
  id: number;
  title: string;
  description: string;
  category: TestCategory;
  totalTime: number;
  totalMarks: number;
  minimumMarks: number;
  department: Department | null;
  eligibleYears: AcademicYear[];
  status: string;
  createdAt: string;
  createdBy: { fullName: string; department: Department | null };
  _count: { questions: number; submissions: number };
}

interface StudentInfo {
  id: number;
  fullName: string;
  emailId: string;
  studentId: string | null;
  department: Department | null;
  academicYear: AcademicYear | null;
}

interface Submission {
  id: string;
  studentId: number;
  attemptNumber: number;
  status: SubmissionStatus;
  autoScore: number | null;
  finalScore: number | null;
  tabSwitchCount: number;
  violations: number;
  startedAt: string;
  submittedAt: string | null;
  student: StudentInfo;
}

interface TestDetail {
  id: number;
  title: string;
  totalMarks: number;
  minimumMarks: number;
  department: Department | null;
  eligibleYears: AcademicYear[];
  category: TestCategory;
  createdBy: { fullName: string; department: Department | null };
}

interface DetailData {
  test: TestDetail;
  submissions: Submission[];
  absentStudents: StudentInfo[];
}

export function AdminAptitudeResults() {
  const [tests, setTests] = useState<TestSummary[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailTab, setDetailTab] = useState<"attempted" | "absent">("attempted");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{ tests: TestSummary[] }>("/admin/aptitude/results");
        setTests(res.data.tests);
      } catch (e) {
        toast.error(extractErrorMessage(e));
      }
    })();
  }, []);

  useEffect(() => {
    if (selected === null) { setDetail(null); return; }
    setDetail(null);
    (async () => {
      try {
        const res = await api.get<DetailData>(`/admin/aptitude/results/${selected}`);
        setDetail(res.data);
      } catch (e) {
        toast.error(extractErrorMessage(e));
      }
    })();
  }, [selected]);

  const exportPDF = () => {
    if (!detail) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(detail.test.title, 14, 18);
    doc.setFontSize(9);
    doc.text(
      `Department: ${detail.test.department ? departmentLabel(detail.test.department) : "All"} | Total marks: ${detail.test.totalMarks} | Min: ${detail.test.minimumMarks}`,
      14,
      26
    );

    autoTable(doc, {
      startY: 32,
      head: [["Student", "ID", "Year", "Score", "Status", "Violations", "Submitted"]],
      body: detail.submissions.map((s) => [
        s.student.fullName,
        s.student.studentId ?? "—",
        s.student.academicYear ? YEAR_LABELS[s.student.academicYear] : "—",
        `${s.autoScore ?? s.finalScore ?? "—"} / ${detail.test.totalMarks}`,
        s.status,
        String(s.violations),
        s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "—",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [23, 23, 23] },
    });

    if (detail.absentStudents.length > 0) {
      doc.addPage();
      doc.setFontSize(12);
      doc.text("Absent Students", 14, 18);
      autoTable(doc, {
        startY: 24,
        head: [["Student", "ID", "Email", "Year", "Department"]],
        body: detail.absentStudents.map((s) => [
          s.fullName,
          s.studentId ?? "—",
          s.emailId,
          s.academicYear ? YEAR_LABELS[s.academicYear] : "—",
          s.department ? departmentLabel(s.department) : "—",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [23, 23, 23] },
      });
    }

    doc.save(`${detail.test.title.replace(/\s+/g, "_")}_results.pdf`);
  };

  if (selected !== null) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" /> All tests
          </button>
          {detail && (
            <Button size="sm" onClick={exportPDF}>
              <Download className="h-4 w-4" /> Export PDF
            </Button>
          )}
        </div>

        {!detail ? (
          <div className="h-60 animate-pulse rounded-lg border border-neutral-200 bg-white" />
        ) : (
          <>
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="text-base font-semibold text-neutral-900">{detail.test.title}</h2>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500">
                <span>Dept: {detail.test.department ? departmentLabel(detail.test.department) : "All"}</span>
                <span>
                  Years: {detail.test.eligibleYears.length === 0
                    ? "All"
                    : detail.test.eligibleYears.map((y) => YEAR_LABELS[y]).join(", ")}
                </span>
                <span>Total marks: {detail.test.totalMarks}</span>
                <span>Min marks: {detail.test.minimumMarks}</span>
                <span>Attempted: {detail.submissions.length}</span>
                <span>Absent: {detail.absentStudents.length}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDetailTab("attempted")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  detailTab === "attempted"
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                Attempted ({detail.submissions.length})
              </button>
              <button
                onClick={() => setDetailTab("absent")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  detailTab === "absent"
                    ? "bg-red-600 text-white"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                Absent ({detail.absentStudents.length})
              </button>
            </div>

            {detailTab === "attempted" && (
              <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                {detail.submissions.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-neutral-500">No submissions yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="border-b border-neutral-200 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Year</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Violations</th>
                        <th className="px-4 py-3">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {detail.submissions.map((s) => (
                        <tr key={s.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-neutral-900">{s.student.fullName}</div>
                            <div className="text-[11px] text-neutral-500">
                              {s.student.studentId ?? s.student.emailId}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {s.student.academicYear ? YEAR_LABELS[s.student.academicYear] : "—"}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {s.autoScore ?? s.finalScore ?? "—"} / {detail.test.totalMarks}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={s.status} />
                          </td>
                          <td className="px-4 py-3 tabular-nums text-neutral-600">
                            {s.violations > 0 ? (
                              <span className="font-medium text-red-600">{s.violations}</span>
                            ) : (
                              "0"
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-neutral-500">
                            {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {detailTab === "absent" && (
              <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                {detail.absentStudents.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-neutral-500">
                    All eligible students attempted this test.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="border-b border-neutral-200 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Year</th>
                        <th className="px-4 py-3">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {detail.absentStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 font-medium text-neutral-900">{s.fullName}</td>
                          <td className="px-4 py-3 text-neutral-600">{s.studentId ?? "—"}</td>
                          <td className="px-4 py-3 text-neutral-600">
                            {s.department ? departmentLabel(s.department) : "—"}
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {s.academicYear ? YEAR_LABELS[s.academicYear] : "—"}
                          </td>
                          <td className="px-4 py-3 text-neutral-500">{s.emailId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tests === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-neutral-200 bg-white" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <Brain className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-neutral-900">No published tests</p>
          <p className="mt-1 text-sm text-neutral-500">
            Faculty must publish tests before results appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {tests.map((t) => (
            <li key={t.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900">{t.title}</h3>
                    <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                      {TEST_CATEGORY_LABELS[t.category]}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-neutral-500">
                    <span>By {t.createdBy.fullName}</span>
                    <span>Dept: {t.department ? departmentLabel(t.department) : "All"}</span>
                    <span>
                      Years:{" "}
                      {t.eligibleYears.length === 0
                        ? "All"
                        : t.eligibleYears.map((y) => YEAR_LABELS[y]).join(", ")}
                    </span>
                    <span>{t._count.submissions} submissions</span>
                    <span>{t.totalMarks} marks</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelected(t.id); setDetailTab("attempted"); }}
                >
                  <Users className="h-3.5 w-3.5" /> View results
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const cls =
    status === "SUBMITTED" || status === "REVIEWED"
      ? "bg-green-50 text-green-700 ring-green-200"
      : status === "DISQUALIFIED"
        ? "bg-red-50 text-red-700 ring-red-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${cls}`}>
      {status}
    </span>
  );
}
