"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { extractErrorMessage, api } from "@/lib/api/base";
import { departmentLabel } from "@/lib/api/student";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Download, FileText } from "lucide-react";

const DEPT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

interface StatisticsData {
  placement: {
    totalStudents: number;
    placedCount: number;
    byDepartment: { department: string; total: number; placed: number }[];
    topCompanies: { company: string; count: number }[];
  };
  academics: {
    semesterAverages: { sem: string; avg: number }[];
    cgpaByDepartment: { department: string; avg: number }[];
    preCollegeAvg: { ssc: number | null; hsc: number | null; diploma: number | null };
  };
  aptitude: {
    tests: {
      id: string;
      title: string;
      category: string;
      submitted: number;
      passed: number;
      failed: number;
      disqualified: number;
      avgScore: number | null;
    }[];
  };
}

async function exportSectionPng(el: HTMLElement, filename: string) {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(el, { scale: 2, useCORS: true });
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-neutral-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}

function SectionHeader({
  title,
  onExport,
  exporting,
}: {
  title: string;
  onExport: () => void;
  exporting: boolean;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      <Button size="sm" variant="outline" onClick={onExport} disabled={exporting}>
        <Download className="mr-1.5 h-3.5 w-3.5" />
        {exporting ? "Exporting…" : "Export PNG"}
      </Button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-neutral-200" />
            <div className="h-8 w-28 rounded bg-neutral-200" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[0, 1, 2].map((j) => (
              <div key={j} className="h-20 rounded-lg bg-neutral-100" />
            ))}
          </div>
          <div className="h-64 rounded-lg bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

export function StatisticsTab() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingSection, setExportingSection] = useState<string | null>(null);

  const placementRef = useRef<HTMLDivElement>(null);
  const academicsRef = useRef<HTMLDivElement>(null);
  const aptitudeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await api.get<StatisticsData>("/admin/statistics");
        setData(d);
      } catch (e) {
        toast.error(extractErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const exportSection = async (
    ref: React.RefObject<HTMLDivElement | null>,
    name: string,
    key: string
  ) => {
    if (!ref.current) return;
    setExportingSection(key);
    try {
      await exportSectionPng(ref.current, name);
    } catch {
      toast.error("Export failed");
    } finally {
      setExportingSection(null);
    }
  };

  const exportFullPdf = async () => {
    if (!data) return;
    setExportingPdf(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const refs = [
        { ref: placementRef, label: "Placement Overview" },
        { ref: academicsRef, label: "Academic Performance" },
        { ref: aptitudeRef, label: "Aptitude Tests" },
      ];

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      let first = true;
      for (const { ref, label } of refs) {
        if (!ref.current) continue;
        const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const ratio = canvas.width / canvas.height;
        const imgW = pageW - 20;
        const imgH = imgW / ratio;

        if (!first) pdf.addPage();
        first = false;

        pdf.setFontSize(12);
        pdf.setTextColor(40, 40, 40);
        pdf.text(label, 10, 12);
        pdf.addImage(imgData, "PNG", 10, 18, imgW, Math.min(imgH, pageH - 28));
      }

      pdf.save("statistics-report.pdf");
    } catch {
      toast.error("PDF export failed");
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!data) return (
    <div className="flex h-64 items-center justify-center text-neutral-400 text-sm">
      Failed to load statistics.
    </div>
  );

  const { placement, academics, aptitude } = data;
  const placementRate = placement.totalStudents > 0
    ? ((placement.placedCount / placement.totalStudents) * 100).toFixed(1)
    : "0";

  const deptPlacementData = placement.byDepartment.map((d) => ({
    department: departmentLabel(d.department) || d.department,
    rate: d.total > 0 ? Math.round((d.placed / d.total) * 100) : 0,
    placed: d.placed,
    total: d.total,
  }));

  const pieData = [
    { name: "Placed", value: placement.placedCount, color: "#10b981" },
    { name: "Unplaced", value: placement.totalStudents - placement.placedCount, color: "#e5e7eb" },
  ];

  const cgpaData = academics.cgpaByDepartment.map((d) => ({
    department: departmentLabel(d.department) || d.department,
    avg: d.avg,
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={exportFullPdf} disabled={exportingPdf}>
          <FileText className="mr-1.5 h-4 w-4" />
          {exportingPdf ? "Generating PDF…" : "Export PDF"}
        </Button>
      </div>

      {/* ── Placement Overview ─────────────────────────────────────────── */}
      <div ref={placementRef} className="rounded-xl border border-neutral-200 bg-white p-6">
        <SectionHeader
          title="Placement Overview"
          onExport={() => exportSection(placementRef, "placement-overview", "placement")}
          exporting={exportingSection === "placement"}
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-6">
          <StatCard label="Total Students" value={placement.totalStudents} />
          <StatCard label="Placed" value={placement.placedCount} />
          <StatCard label="Placement Rate" value={`${placementRate}%`} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Donut */}
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">Placed vs Unplaced</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Dept placement rate */}
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">Placement Rate by Department (%)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptPlacementData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={(v) => [`${v}%`, "Rate"]} />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                  {deptPlacementData.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top companies */}
        {placement.topCompanies.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-neutral-700">Top Hiring Companies</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={placement.topCompanies}
                layout="vertical"
                margin={{ left: 10, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="company" tick={{ fontSize: 11 }} width={130} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Academic Performance ───────────────────────────────────────── */}
      <div ref={academicsRef} className="rounded-xl border border-neutral-200 bg-white p-6">
        <SectionHeader
          title="Academic Performance"
          onExport={() => exportSection(academicsRef, "academic-performance", "academics")}
          exporting={exportingSection === "academics"}
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-6">
          {academics.preCollegeAvg.ssc != null && (
            <StatCard label="Avg SSC %" value={`${academics.preCollegeAvg.ssc}%`} />
          )}
          {academics.preCollegeAvg.hsc != null && (
            <StatCard label="Avg HSC %" value={`${academics.preCollegeAvg.hsc}%`} />
          )}
          {academics.preCollegeAvg.diploma != null && (
            <StatCard label="Avg Diploma %" value={`${academics.preCollegeAvg.diploma}%`} />
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* CGPA by dept */}
          {cgpaData.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">Avg CGPA by Department</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={cgpaData} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [Number(v).toFixed(2), "Avg CGPA"]} />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {cgpaData.map((_, i) => (
                      <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Semester trend */}
          {academics.semesterAverages.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">Semester-wise Score Trend</p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={academics.semesterAverages} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="sem" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [Number(v).toFixed(2), "Avg Score"]} />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#3b82f6" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {cgpaData.length === 0 && academics.semesterAverages.length === 0 && (
          <p className="text-center text-sm text-neutral-400 py-10">No academic data available yet.</p>
        )}
      </div>

      {/* ── Aptitude Tests ─────────────────────────────────────────────── */}
      <div ref={aptitudeRef} className="rounded-xl border border-neutral-200 bg-white p-6">
        <SectionHeader
          title="Aptitude Tests"
          onExport={() => exportSection(aptitudeRef, "aptitude-tests", "aptitude")}
          exporting={exportingSection === "aptitude"}
        />

        {aptitude.tests.length === 0 ? (
          <p className="text-center text-sm text-neutral-400 py-10">No published tests found.</p>
        ) : (
          <div className="space-y-8">
            {aptitude.tests.map((test) => {
              const total = test.submitted;
              const chartData = [
                { label: "Passed", value: test.passed, fill: "#10b981" },
                { label: "Failed", value: test.failed, fill: "#ef4444" },
                { label: "Disqualified", value: test.disqualified, fill: "#f59e0b" },
              ];
              return (
                <div key={test.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-neutral-900 text-sm">{test.title}</p>
                      <span className="inline-block mt-1 rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600">
                        {test.category}
                      </span>
                    </div>
                    <div className="flex gap-4 text-right text-xs text-neutral-500">
                      <div>
                        <p className="text-lg font-bold text-neutral-900">{total}</p>
                        <p>Submitted</p>
                      </div>
                      {test.avgScore != null && (
                        <div>
                          <p className="text-lg font-bold text-neutral-900">{test.avgScore}</p>
                          <p>Avg Score</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {total > 0 && (
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={chartData} margin={{ left: 0, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
