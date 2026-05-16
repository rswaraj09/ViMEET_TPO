"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/api/base";
import {
  listStudents,
  setUserStatus,
  type StudentListItem,
  type StudentListFilters,
  type StudentListResponse,
} from "@/lib/api/admin";
import {
  exportStudentsToExcel,
  exportStudentsToPdf,
  summarizeFilters,
} from "@/lib/studentsExport";
import { FileSpreadsheet, FileText as FileTextIcon, Columns3 } from "lucide-react";
import {
  DEPARTMENT_LABELS,
  departmentLabel,
  type Department,
} from "@/lib/api/student";
import { DEPARTMENTS, FilterSelect } from "./shared";

// Generate a list of recent graduation years (current year back to 10 years ago)
const currentYear = new Date().getFullYear();
const GRADUATION_YEARS = Array.from({ length: 11 }, (_, i) =>
  String(currentYear - i)
);

type AlumniColKey =
  | "email"
  | "studentId"
  | "department"
  | "graduationYear"
  | "cgpa"
  | "placed"
  | "status";

const ALUMNI_COLS: { key: AlumniColKey; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "studentId", label: "ID" },
  { key: "department", label: "Department" },
  { key: "graduationYear", label: "Batch" },
  { key: "cgpa", label: "CGPA" },
  { key: "placed", label: "Placed" },
  { key: "status", label: "Status" },
];

const DEFAULT_ALUMNI_COLS: Record<AlumniColKey, boolean> = {
  email: true,
  studentId: true,
  department: true,
  graduationYear: true,
  cgpa: true,
  placed: true,
  status: true,
};

const ALUMNI_COLS_STORAGE_KEY = "admin.alumni.visibleCols.v1";

export function AlumniTab() {
  const router = useRouter();
  const [data, setData] = useState<StudentListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<StudentListFilters>({
    page: 1,
    limit: 20,
    role: "ALUMNI",
  });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);

  const [visibleCols, setVisibleCols] = useState<Record<AlumniColKey, boolean>>(
    () => {
      try {
        const raw = localStorage.getItem(ALUMNI_COLS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Record<AlumniColKey, boolean>>;
          return { ...DEFAULT_ALUMNI_COLS, ...parsed };
        }
      } catch {
        /* ignore */
      }
      return DEFAULT_ALUMNI_COLS;
    }
  );
  const [colsOpen, setColsOpen] = useState(false);
  const colsBtnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(ALUMNI_COLS_STORAGE_KEY, JSON.stringify(visibleCols));
    } catch {
      /* ignore */
    }
  }, [visibleCols]);

  useEffect(() => {
    if (!colsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (colsBtnRef.current && !colsBtnRef.current.contains(e.target as Node)) {
        setColsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [colsOpen]);

  const visibleColCount = useMemo(
    () => Object.values(visibleCols).filter(Boolean).length,
    [visibleCols]
  );

  const toggleCol = (key: AlumniColKey) =>
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));
  const showAll = () =>
    setVisibleCols(
      ALUMNI_COLS.reduce(
        (acc, c) => ({ ...acc, [c.key]: true }),
        {} as Record<AlumniColKey, boolean>
      )
    );
  const resetCols = () => setVisibleCols(DEFAULT_ALUMNI_COLS);

  const fetchAllMatching = async (): Promise<StudentListItem[]> => {
    const all: StudentListItem[] = [];
    const pageLimit = 100;
    let page = 1;
    while (true) {
      const res = await listStudents({ ...filters, page, limit: pageLimit });
      all.push(...res.items);
      if (all.length >= res.total || res.items.length === 0) break;
      page += 1;
      if (page > 1000) break;
    }
    return all;
  };

  const handleExport = async (kind: "xlsx" | "pdf") => {
    if (exporting) return;
    setExporting(kind);
    try {
      const rows = await fetchAllMatching();
      if (rows.length === 0) {
        toast.error("No alumni match these filters.");
        return;
      }
      const summary = summarizeFilters(filters as unknown as Record<string, unknown>);
      if (kind === "xlsx") {
        exportStudentsToExcel(rows, summary);
      } else {
        exportStudentsToPdf(rows, summary);
      }
      toast.success(`Exported ${rows.length} alumni to ${kind.toUpperCase()}.`);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setExporting(null);
    }
  };

  const load = useCallback(async (f: StudentListFilters) => {
    setLoading(true);
    try {
      setData(await listStudents(f));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [load, filters]);

  const updateFilter = <K extends keyof StudentListFilters>(
    key: K,
    value: StudentListFilters[K] | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleToggleStatus = async (item: StudentListItem) => {
    const next = !item.isActive;
    if (
      !window.confirm(
        next ? "Activate this account?" : "Deactivate this account? User will lose access."
      )
    ) {
      return;
    }
    setBusyId(item.id);
    try {
      await setUserStatus(item.id, next);
      toast.success(`Account ${next ? "activated" : "deactivated"}`);
      await load(filters);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FilterSelect
              label="Batch (Graduation Year)"
              value={filters.graduationYear ? String(filters.graduationYear) : ""}
              options={GRADUATION_YEARS}
              onChange={(v) =>
                updateFilter("graduationYear", v ? Number(v) : undefined)
              }
            />
            <FilterSelect
              label="Department"
              value={filters.department ?? ""}
              options={DEPARTMENTS}
              getLabel={(o) => DEPARTMENT_LABELS[o as Department] ?? o}
              onChange={(v) =>
                updateFilter(
                  "department",
                  v ? (v as StudentListFilters["department"]) : undefined
                )
              }
            />
            <FilterSelect
              label="Placed"
              value={filters.isPlaced === true ? "true" : filters.isPlaced === false ? "false" : ""}
              options={["true", "false"]}
              getLabel={(o) => (o === "true" ? "Placed" : "Not Placed")}
              onChange={(v) =>
                updateFilter("isPlaced", v === "" ? undefined : v === "true")
              }
            />
            <FilterSelect
              label="Status"
              value={filters.isActive === true ? "true" : filters.isActive === false ? "false" : ""}
              options={["true", "false"]}
              getLabel={(o) => (o === "true" ? "Active" : "Inactive")}
              onChange={(v) =>
                updateFilter("isActive", v === "" ? undefined : v === "true")
              }
            />
            <div>
              <label className="text-xs text-muted-foreground">Min CGPA</label>
              <Input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={filters.minCgpa ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "minCgpa",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">
                Search (name / email / ID)
              </label>
              <Input
                value={filters.search ?? ""}
                onChange={(e) => updateFilter("search", e.target.value || undefined)}
                placeholder="Type to search..."
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ page: 1, limit: 20, role: "ALUMNI" })
                }
                className="w-full"
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
            <p className="text-xs text-muted-foreground">
              {data?.total != null
                ? `${data.total} alumni found.`
                : "Apply filters above to narrow results."}
            </p>
            <div className="flex gap-2">
              <div className="relative" ref={colsBtnRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setColsOpen((v) => !v)}
                  aria-expanded={colsOpen}
                >
                  <Columns3 className="h-4 w-4 mr-1.5" />
                  Columns
                  <span className="ml-1.5 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
                    {visibleColCount}/{ALUMNI_COLS.length}
                  </span>
                </Button>
                {colsOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-neutral-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Columns
                      </p>
                      <div className="flex gap-2 text-[11px]">
                        <button type="button" onClick={showAll} className="text-neutral-600 hover:text-neutral-900 hover:underline">All</button>
                        <span className="text-neutral-300">·</span>
                        <button type="button" onClick={resetCols} className="text-neutral-600 hover:text-neutral-900 hover:underline">Reset</button>
                      </div>
                    </div>
                    <ul className="max-h-72 overflow-y-auto p-1">
                      {ALUMNI_COLS.map((c) => (
                        <li key={c.key}>
                          <label className="flex cursor-pointer items-center gap-2.5 rounded px-2.5 py-2 text-sm hover:bg-neutral-50">
                            <input
                              type="checkbox"
                              checked={visibleCols[c.key]}
                              onChange={() => toggleCol(c.key)}
                              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                            />
                            <span className="text-neutral-800">{c.label}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                    <p className="border-t border-neutral-100 px-3 py-2 text-[11px] text-neutral-500">
                      Name and Actions are always shown.
                    </p>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("xlsx")}
                disabled={!!exporting}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                {exporting === "xlsx" ? "Exporting…" : "Export Excel"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("pdf")}
                disabled={!!exporting}
              >
                <FileTextIcon className="h-4 w-4 mr-1.5" />
                {exporting === "pdf" ? "Exporting…" : "Export PDF"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-2">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading...</p>
          ) : !data || data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No alumni match these filters.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr>
                      <th className="py-2 pr-4">Name</th>
                      {visibleCols.email && <th className="py-2 pr-4">Email</th>}
                      {visibleCols.studentId && <th className="py-2 pr-4">ID</th>}
                      {visibleCols.department && <th className="py-2 pr-4">Dept</th>}
                      {visibleCols.graduationYear && <th className="py-2 pr-4">Batch</th>}
                      {visibleCols.cgpa && <th className="py-2 pr-4">CGPA</th>}
                      {visibleCols.placed && <th className="py-2 pr-4">Placed</th>}
                      {visibleCols.status && <th className="py-2 pr-4">Status</th>}
                      <th className="py-2 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((s) => (
                      <tr key={s.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-4 font-medium">
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/students/${s.id}`)}
                            className="text-left text-neutral-900 hover:text-neutral-600 hover:underline underline-offset-4"
                          >
                            {s.fullName}
                          </button>
                        </td>
                        {visibleCols.email && (
                          <td className="py-3 pr-4">{s.emailId}</td>
                        )}
                        {visibleCols.studentId && (
                          <td className="py-3 pr-4">{s.studentId ?? "—"}</td>
                        )}
                        {visibleCols.department && (
                          <td className="py-3 pr-4">
                            {departmentLabel(s.department) || "—"}
                          </td>
                        )}
                        {visibleCols.graduationYear && (
                          <td className="py-3 pr-4">{s.academicYear ?? "—"}</td>
                        )}
                        {visibleCols.cgpa && (
                          <td className="py-3 pr-4">
                            {s.avgCgpa?.toFixed(2) ?? "—"}
                          </td>
                        )}
                        {visibleCols.placed && (
                          <td className="py-3 pr-4">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                s.isPlaced
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {s.isPlaced ? "Placed" : "Not Placed"}
                            </span>
                          </td>
                        )}
                        {visibleCols.status && (
                          <td className="py-3 pr-4">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                s.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {s.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        )}
                        <td className="py-3 pr-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(s)}
                            disabled={busyId === s.id}
                          >
                            {s.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-xs text-muted-foreground">
                  Page {data.page} of {data.totalPages} · {data.total} total
                </span>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.page <= 1}
                    onClick={() =>
                      setFilters((f) => ({
                        ...f,
                        page: Math.max(1, (f.page ?? 1) - 1),
                      }))
                    }
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.page >= data.totalPages}
                    onClick={() =>
                      setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
