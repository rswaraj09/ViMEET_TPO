"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/api/base";
import {
  listAmbassadors,
  createAmbassadorAssignment,
  deleteAmbassadorAssignment,
  listStudents,
  AMBASSADOR_ROLE_OPTIONS,
  type AmbassadorAssignment,
  type AmbassadorRole,
  type StudentListItem,
} from "@/lib/api/admin";
import {
  ShieldCheck,
  Plus,
  Search,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { departmentLabel } from "@/lib/api/student";
import { YEAR_LABELS } from "./shared";

function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md";
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${dim} flex-shrink-0 rounded-full object-cover ring-1 ring-neutral-200`}
      />
    );
  }
  return (
    <div
      className={`${dim} flex flex-shrink-0 items-center justify-center rounded-full bg-neutral-800 font-semibold text-white`}
    >
      {initials}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-bold text-neutral-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

export function AmbassadorsTab() {
  const [assignments, setAssignments] = useState<AmbassadorAssignment[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [roleName, setRoleName] = useState<AmbassadorRole>("TPO Head");
  const [servedAcademicYear, setServedAcademicYear] = useState<string>(() => {
    const y = new Date().getFullYear();
    return `${y}-${String(y + 1).slice(-2)}`;
  });
  const [yearFilter, setYearFilter] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [assignmentData, studentData, alumniData] = await Promise.all([
        listAmbassadors(),
        listStudents({ page: 1, limit: 100, role: "STUDENT" }),
        listStudents({ page: 1, limit: 100, role: "ALUMNI" }),
      ]);
      setAssignments(assignmentData);
      setStudents([...studentData.items, ...alumniData.items]);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const servedYearOptions = (() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => {
      const start = currentYear - 3 + i;
      return `${start}-${String(start + 1).slice(-2)}`;
    });
  })();

  const filteredAssignments = yearFilter
    ? assignments.filter((a) => a.servedAcademicYear === yearFilter)
    : assignments;

  const grouped = filteredAssignments.reduce<Record<string, AmbassadorAssignment[]>>(
    (acc, item) => {
      const key = item.roleName;
      acc[key] = acc[key] ? [...acc[key], item] : [item];
      return acc;
    },
    {}
  );

  const filledRoles = AMBASSADOR_ROLE_OPTIONS.filter((r) => (grouped[r] ?? []).length > 0).length;
  const emptyRoleCount = AMBASSADOR_ROLE_OPTIONS.length - filledRoles;

  const visibleRoles = showEmpty
    ? AMBASSADOR_ROLE_OPTIONS
    : AMBASSADOR_ROLE_OPTIONS.filter((r) => (grouped[r] ?? []).length > 0);

  const filteredStudents = students.filter((s) => {
    const hay = `${s.fullName} ${s.emailId} ${s.studentId ?? ""}`.toLowerCase();
    return hay.includes(studentSearch.toLowerCase());
  });

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this assignment?")) return;
    try {
      await deleteAmbassadorAssignment(id);
      toast.success("Assignment removed");
      load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  const handleAdd = async () => {
    if (!selectedStudentId) {
      toast.error("Select a student first");
      return;
    }
    setSaving(true);
    try {
      await createAmbassadorAssignment({ studentId: selectedStudentId, roleName, servedAcademicYear });
      toast.success("Assignment added");
      setShowAdd(false);
      setSelectedStudentId(null);
      setStudentSearch("");
      await load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-500">
              <ShieldCheck className="h-3 w-3" />
              Student Ambassador Program
            </div>
            <h2 className="mt-3 text-xl font-semibold text-neutral-900">TPO Volunteer Roster</h2>
            <p className="mt-1 text-sm text-neutral-500 max-w-lg">
              Assign students to TPO teams, track the academic year they served, and manage the full volunteer roster from here.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Year
              </label>
              <select
                className="h-9 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">All years</option>
                {servedYearOptions.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
            <Button
              className="mt-5 sm:mt-0 self-end"
              onClick={() => {
                setShowAdd((v) => !v);
                if (showAdd) { setSelectedStudentId(null); setStudentSearch(""); }
              }}
            >
              {showAdd ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {showAdd ? "Cancel" : "Add Ambassador"}
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Assignments"
            value={filteredAssignments.length}
            sub={yearFilter ? `of ${assignments.length} total` : undefined}
          />
          <StatCard
            label="Roles Filled"
            value={`${filledRoles} / ${AMBASSADOR_ROLE_OPTIONS.length}`}
          />
          <StatCard
            label="Student Pool"
            value={students.length}
          />
          <StatCard
            label="Open Roles"
            value={emptyRoleCount}
            sub={emptyRoleCount === 0 ? "All teams staffed" : "Need volunteers"}
          />
        </div>
      </div>

      {/* ── Add form ── */}
      {showAdd && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="mb-5 text-sm font-semibold text-neutral-900">New Assignment</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600">Role</label>
              <select
                className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value as AmbassadorRole)}
              >
                {AMBASSADOR_ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Served year */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600">Served Academic Year</label>
              <select
                className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                value={servedAcademicYear}
                onChange={(e) => setServedAcademicYear(e.target.value)}
              >
                {servedYearOptions.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600">Search Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Name, email or ID…"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Student picker list */}
          <div className="mt-4 max-h-64 overflow-y-auto rounded-xl border border-neutral-200">
            {filteredStudents.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-neutral-400">
                <Users className="h-4 w-4" />
                No students found
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {filteredStudents.map((s) => {
                  const isSelected = selectedStudentId === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected
                            ? "bg-neutral-900 text-white"
                            : "hover:bg-neutral-50"
                        }`}
                      >
                        <Avatar name={s.fullName} src={s.profilePic} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-medium ${isSelected ? "text-white" : "text-neutral-900"}`}>
                            {s.fullName}
                          </p>
                          <p className={`truncate text-xs ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                            {s.emailId}
                            {s.studentId ? ` · ${s.studentId}` : ""}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 text-xs ${isSelected ? "text-neutral-300" : "text-neutral-400"}`}>
                          {s.academicYear ? YEAR_LABELS[s.academicYear] : "Alumni"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {selectedStudentId && (
            <p className="mt-2 text-xs text-neutral-500">
              Selected: <span className="font-medium text-neutral-800">{students.find((s) => s.id === selectedStudentId)?.fullName}</span>
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2.5 border-t border-neutral-100 pt-5">
            <Button
              variant="outline"
              onClick={() => { setShowAdd(false); setSelectedStudentId(null); setStudentSearch(""); }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving || !selectedStudentId}>
              {saving ? "Adding…" : "Confirm Assignment"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Roster grid ── */}
      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center text-sm text-neutral-400">
          Loading roster…
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <ShieldCheck className="mx-auto h-9 w-9 text-neutral-300" />
          <p className="mt-3 text-sm font-medium text-neutral-700">No assignments yet</p>
          <p className="mt-1 text-xs text-neutral-400">Add students to TPO teams using the button above.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleRoles.map((role) => {
              const roleItems = grouped[role] ?? [];
              const isCovered = roleItems.length > 0;
              return (
                <div
                  key={role}
                  className="rounded-2xl border border-neutral-200 bg-white overflow-hidden"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">{role}</p>
                      <p className="text-xs text-neutral-400">
                        {roleItems.length} volunteer{roleItems.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isCovered
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                      }`}
                    >
                      {isCovered ? "Covered" : "Open"}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    {roleItems.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-neutral-200 px-4 py-5 text-center text-xs text-neutral-400">
                        No one assigned yet
                      </div>
                    ) : (
                      <ul className="space-y-2.5">
                        {roleItems.map((a) => (
                          <li
                            key={a.id}
                            className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5"
                          >
                            <Avatar name={a.student.fullName} src={a.student.profilePic} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-neutral-900">
                                {a.student.fullName}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-400">
                                <span>{departmentLabel(a.student.department) || "—"}</span>
                                <span className="text-neutral-200">·</span>
                                <span>{a.servedAcademicYear}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemove(a.id)}
                              className="flex-shrink-0 rounded-lg p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                              aria-label="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toggle empty roles */}
          {emptyRoleCount > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowEmpty((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-500 shadow-sm transition hover:border-neutral-400 hover:text-neutral-700"
              >
                {showEmpty ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Hide {emptyRoleCount} open role{emptyRoleCount !== 1 ? "s" : ""}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Show {emptyRoleCount} open role{emptyRoleCount !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
