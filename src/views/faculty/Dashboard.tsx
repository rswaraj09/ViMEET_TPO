"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  FacultySidebar,
  type FacultyTab,
} from "@/components/shared/FacultySidebar";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/api/base";
import { departmentLabel } from "@/lib/api/student";
import {
  getFacultyStats,
  listPendingVerifications,
  reviewVerificationRequest,
  reviewInternship,
  reviewAchievement,
  reviewCertificate,
  listDeptStudents,
  listDeptAlumni,
  listDeptFaculty,
  updateDeptFaculty,
  setDeptFacultyStatus,
  type FacultyStats,
  type QueueItem,
  type DeptStudentListItem,
  type DeptStudentListResponse,
  type DeptStudentFilters,
  type DeptFacultyItem,
  type AlumniListItem,
} from "@/lib/api/faculty";
import {
  ClipboardCheck,
  Briefcase,
  Award,
  ShieldCheck,
  Inbox,
  Users as UsersIcon,
  Calendar,
  CheckCircle2,
  ArrowRight,
  FileText,
  ExternalLink,
} from "lucide-react";
import { FacultyAptitudeTab } from "@/components/aptitude/FacultyAptitude";
import { ResourcesView } from "@/components/resources/ResourcesView";

const YEARS = [
  "FIRST_YEAR",
  "SECOND_YEAR",
  "THIRD_YEAR",
  "FOURTH_YEAR",
] as const;

const FACULTY_TABS: FacultyTab[] = [
  "overview",
  "queue",
  "students",
  "alumni",
  "faculty",
  "aptitude",
  "resources",
];

const TAB_TITLES: Record<FacultyTab, { title: string; subtitle: string }> = {
  overview: {
    title: "Overview",
    subtitle: "Verification workload and department snapshot.",
  },
  queue: {
    title: "Verification Queue",
    subtitle: "Review profile, internship, and achievement submissions.",
  },
  students: {
    title: "Students",
    subtitle: "Browse and filter students in your department.",
  },
  alumni: {
    title: "Alumni",
    subtitle: "View alumni from your department.",
  },
  faculty: {
    title: "Department Faculty",
    subtitle: "Manage faculty members in your department.",
  },
  aptitude: {
    title: "Aptitude Tests",
    subtitle: "Create, publish, and review tests and homework.",
  },
  resources: {
    title: "Resources",
    subtitle: "Manage question papers, syllabi, and forms for your department.",
  },
};

export function FacultyDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const requested = (FACULTY_TABS as string[]).includes(tabParam ?? "")
    ? (tabParam as FacultyTab)
    : "overview";
  const tab: FacultyTab =
    requested === "faculty" && !user?.isHOD ? "overview" : requested;

  const setTab = (t: FacultyTab) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    if (t === "overview") next.delete("tab");
    else next.set("tab", t);
    router.replace(`?${next.toString()}`);
  };

  const { title, subtitle } = TAB_TITLES[tab];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <FacultySidebar active={tab} onSelect={setTab} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:px-6">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
            <p className="line-clamp-2 text-xs text-neutral-500">
              {subtitle}
              {user?.department && (
                <>
                  {" · "}
                  <span className="font-medium text-neutral-700">
                    {departmentLabel(user.department)}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            {user && <NotificationBell />}
            <div className="hidden items-center gap-2 sm:flex">
              {user?.profilePic ? (
                <img
                  src={user.profilePic}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                  {user?.fullName?.slice(0, 2).toUpperCase() || "FA"}
                </div>
              )}
              <div className="hidden text-right lg:block">
                <p className="text-sm font-medium text-neutral-900">
                  {user?.fullName}
                  {user?.isHOD && (
                    <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800">
                      HOD
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-neutral-500">{user?.emailId}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
          <div className="mx-auto max-w-7xl">
            {tab === "overview" && <OverviewTab onNavigate={setTab} />}
            {tab === "queue" && <QueueTab />}
            {tab === "students" && <StudentsTab />}
            {tab === "alumni" && <AlumniTab />}
            {tab === "faculty" && user?.isHOD && <FacultyTabPanel />}
            {tab === "aptitude" && <FacultyAptitudeTab />}
            {tab === "resources" && (
              <ResourcesView
                canAdd={!!user?.isHOD}
                canDelete={false}
                forceDepartment={(user?.department ?? null) as import("@/lib/api/student").Department | null}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ==================== OVERVIEW ====================

function OverviewTab({
  onNavigate,
}: {
  onNavigate: (tab: FacultyTab) => void;
}) {
  const [stats, setStats] = useState<FacultyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setStats(await getFacultyStats());
      } catch (e) {
        toast.error(extractErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-neutral-200 bg-white"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-lg border border-neutral-200 bg-white" />
      </div>
    );
  }
  if (!stats)
    return <p className="text-sm text-muted-foreground">No stats available.</p>;

  type PendingCard = {
    label: string;
    value: number;
    icon: typeof ClipboardCheck;
  };
  const pendingCards: PendingCard[] = [
    {
      label: "Profile / Marks",
      value: stats.pending.profileAndMarks,
      icon: ClipboardCheck,
    },
    {
      label: "Internships",
      value: stats.pending.internships,
      icon: Briefcase,
    },
    {
      label: "Achievements",
      value: stats.pending.achievements,
      icon: Award,
    },
    {
      label: "Certificates",
      value: stats.pending.certificates,
      icon: ShieldCheck,
    },
  ];

  const totalPending = stats.pending.total;

  type Metric = {
    label: string;
    value: number;
    icon: typeof UsersIcon;
    hint?: string;
  };
  const metrics: Metric[] = [
    {
      label: "Pending review",
      value: totalPending,
      icon: Inbox,
      hint: totalPending === 0 ? "All clear" : "Needs action",
    },
    {
      label: "Dept students",
      value: stats.totalStudents,
      icon: UsersIcon,
      hint: "In your department",
    },
    {
      label: "Upcoming events",
      value: stats.upcomingEvents,
      icon: Calendar,
      hint: "Scheduled",
    },
    {
      label: "Department",
      value: 0,
      icon: FileText,
      hint: departmentLabel(stats.dept) || "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          const isPending = m.label === "Pending review";
          const isDeptCard = m.label === "Department";
          const showDot = isPending && m.value > 0;
          const clickable = isPending && m.value > 0;
          const content = (
            <>
              <div className="flex items-center justify-between text-neutral-600">
                <p className="text-sm font-medium">{m.label}</p>
                <Icon
                  className="h-4 w-4 text-neutral-400"
                  strokeWidth={2}
                />
              </div>
              {isDeptCard ? (
                <p className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">
                  {m.hint}
                </p>
              ) : (
                <>
                  <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-neutral-900">
                    {m.value.toLocaleString()}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500">
                    {showDot && (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                    )}
                    <span>{m.hint}</span>
                  </div>
                </>
              )}
            </>
          );
          return clickable ? (
            <button
              key={m.label}
              type="button"
              onClick={() => onNavigate("queue")}
              className="rounded-lg border border-neutral-200 bg-white p-5 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              {content}
            </button>
          ) : (
            <div
              key={m.label}
              className="rounded-lg border border-neutral-200 bg-white p-5"
            >
              {content}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">
              Pending review
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              {totalPending === 0
                ? "Nothing waiting — you're all caught up."
                : `${totalPending} item${totalPending === 1 ? "" : "s"} need your attention.`}
            </p>
          </div>
          {totalPending > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Needs action
            </span>
          )}
        </div>

        {totalPending === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
            </div>
            <p className="mt-3 text-sm font-medium text-neutral-900">
              All clear
            </p>
            <p className="mt-1 max-w-xs text-sm text-neutral-500">
              No verifications are waiting. New submissions will show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {pendingCards
              .slice()
              .sort((a, b) => b.value - a.value)
              .map((c) => {
                const Icon = c.icon;
                const isUrgent = c.value > 0;
                return (
                  <li key={c.label}>
                    <button
                      type="button"
                      onClick={() => onNavigate("queue")}
                      disabled={!isUrgent}
                      className={`group flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                        isUrgent ? "hover:bg-neutral-50" : "cursor-default"
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                        <Icon className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {c.label}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {isUrgent ? "Waiting for review" : "Up to date"}
                        </p>
                      </div>
                      <span
                        className={`tabular-nums text-sm font-semibold ${
                          isUrgent ? "text-neutral-900" : "text-neutral-400"
                        }`}
                      >
                        {c.value}
                      </span>
                      <ArrowRight
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isUrgent
                            ? "text-neutral-300 group-hover:text-neutral-700"
                            : "text-transparent"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ==================== VERIFICATION QUEUE ====================

const ENTITY_BADGE: Record<string, string> = {
  PROFILE: "bg-blue-50 text-blue-700 ring-blue-200",
  MARKS: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  INTERNSHIP: "bg-purple-50 text-purple-700 ring-purple-200",
  ACHIEVEMENT: "bg-amber-50 text-amber-800 ring-amber-200",
  CERTIFICATE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

function QueueTab() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listPendingVerifications());
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const keyOf = (item: QueueItem) => `${item.kind}:${item.id}`;

  const handleApprove = async (item: QueueItem) => {
    const k = keyOf(item);
    setBusyKey(k);
    try {
      if (item.kind === "VERIFICATION_REQUEST") {
        await reviewVerificationRequest(item.id, { status: "APPROVED" });
      } else if (item.kind === "INTERNSHIP") {
        await reviewInternship(item.id, { isVerified: true });
      } else if (item.kind === "ACHIEVEMENT") {
        await reviewAchievement(item.id, { isVerified: true });
      } else {
        await reviewCertificate(item.id, { isVerified: true });
      }
      toast.success("Approved");
      await refresh();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusyKey(null);
    }
  };

  const handleReject = async (item: QueueItem) => {
    const remarks = window.prompt("Reason for rejection (optional):") ?? undefined;
    const k = keyOf(item);
    setBusyKey(k);
    try {
      if (item.kind === "VERIFICATION_REQUEST") {
        await reviewVerificationRequest(item.id, {
          status: "REJECTED",
          remarks: remarks || undefined,
        });
      } else if (item.kind === "INTERNSHIP") {
        await reviewInternship(item.id, {
          isVerified: false,
          remarks: remarks || undefined,
        });
      } else if (item.kind === "ACHIEVEMENT") {
        await reviewAchievement(item.id, {
          isVerified: false,
          remarks: remarks || undefined,
        });
      } else {
        await reviewCertificate(item.id, {
          isVerified: false,
          remarks: remarks || undefined,
        });
      }
      toast.success("Rejected");
      await refresh();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4">
          <div className="h-5 w-48 animate-pulse rounded bg-neutral-100" />
          <div className="mt-2 h-3 w-80 animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-md bg-neutral-50" />
          ))}
        </div>
      </div>
    );
  }

  const count = items.length;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Verification queue
            </h2>
            {count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {count} pending
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-neutral-500">
            Approve to mark the submission as verified, reject to request
            changes. Students are notified by email.
          </p>
        </div>
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
          </div>
          <p className="mt-3 text-sm font-medium text-neutral-900">
            No pending items
          </p>
          <p className="mt-1 max-w-sm text-sm text-neutral-500">
            New verification submissions from your department will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((item) => {
            const k = keyOf(item);
            const initials =
              item.student.fullName
                ?.split(" ")
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase() || "ST";
            const submitted = new Date(item.createdAt).toLocaleDateString(
              undefined,
              { day: "numeric", month: "short", year: "numeric" }
            );
            const busy = busyKey === k;
            return (
              <li key={k} className="px-5 py-4 transition-colors hover:bg-neutral-50">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {item.student.fullName}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
                          ENTITY_BADGE[item.entityType] ||
                          "bg-neutral-50 text-neutral-700 ring-neutral-200"
                        }`}
                      >
                        {item.entityType}
                      </span>
                    </div>
                    <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500">
                      <MetaCell label="Email" value={item.student.emailId} />
                      <MetaCell
                        label="ID"
                        value={item.student.studentId ?? "—"}
                      />
                      <MetaCell
                        label="Year"
                        value={item.student.academicYear ?? "—"}
                      />
                      <MetaCell label="Submitted" value={submitted} />
                    </dl>

                    <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                      <QueueItemBody item={item} />
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(item)}
                      disabled={busy}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item)}
                      disabled={busy}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </dt>
      <dd className="text-neutral-700">{value}</dd>
    </div>
  );
}

function QueueItemBody({ item }: { item: QueueItem }) {
  if (item.kind === "VERIFICATION_REQUEST") {
    const entries = Object.entries(item.changes);
    return (
      <div className="space-y-1 text-xs">
        {entries.map(([field, diff]) => (
          <div key={field} className="flex flex-wrap items-start gap-2">
            <span className="min-w-32 font-medium text-neutral-700">
              {field}:
            </span>
            <span className="text-red-600 line-through">
              {fmt(diff.oldValue)}
            </span>
            <span className="text-neutral-400">→</span>
            <span className="font-medium text-green-700">
              {fmt(diff.newValue)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (item.kind === "INTERNSHIP") {
    const d = item.data;
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
        <Row label="Company" value={d.companyName} />
        <Row label="Role" value={d.role} />
        <Row label="Duration" value={d.duration ?? "—"} />
        <Row
          label="Period"
          value={`${new Date(d.startDate).toLocaleDateString()} — ${
            d.endDate ? new Date(d.endDate).toLocaleDateString() : "Present"
          }`}
        />
        {d.roleDescription && (
          <div className="sm:col-span-2">
            <Row label="Description" value={d.roleDescription} />
          </div>
        )}
        <Row label="HR Name" value={d.hrName ?? "—"} />
        <Row label="HR Email" value={d.hrEmail ?? "—"} />
        {d.certificateUrl && (
          <div className="sm:col-span-2">
            <a
              href={d.certificateUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-blue-600 underline"
            >
              View certificate
            </a>
          </div>
        )}
      </div>
    );
  }

  if (item.kind === "CERTIFICATE") {
    const d = item.data;
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
        <Row label="Title" value={d.title} />
        <Row label="Issuing Org" value={d.issuingOrg} />
        <Row
          label="Issue Date"
          value={d.issueDate ? new Date(d.issueDate).toLocaleDateString() : "—"}
        />
        <Row
          label="Expiry Date"
          value={d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : "—"}
        />
        <Row label="Credential ID" value={d.credentialId ?? "—"} />
        {d.credentialUrl && (
          <div className="sm:col-span-2">
            <a
              href={d.credentialUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-blue-600 underline"
            >
              Credential Link
            </a>
          </div>
        )}
        {d.certificateUrl && (
          <div className="sm:col-span-2 mt-1">
            <a
              href={d.certificateUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-neutral-800"
            >
              <ExternalLink className="h-3 w-3" />
              View Certificate PDF
            </a>
          </div>
        )}
      </div>
    );
  }

  const d = item.data;
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
      <Row label="Title" value={d.title} />
      <Row label="Category" value={d.category ?? "—"} />
      <Row
        label="Date"
        value={
          d.achievementDate
            ? new Date(d.achievementDate).toLocaleDateString()
            : "—"
        }
      />
      {d.description && (
        <div className="sm:col-span-2">
          <Row label="Description" value={d.description} />
        </div>
      )}
      {d.certificateUrl && (
        <div className="sm:col-span-2">
          <a
            href={d.certificateUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-blue-600 underline"
          >
            View certificate
          </a>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="min-w-24 font-medium text-neutral-700">{label}:</span>
      <span className="text-neutral-600">{value}</span>
    </div>
  );
}

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

// ==================== STUDENTS ====================

function StudentsTab() {
  const [data, setData] = useState<DeptStudentListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<DeptStudentFilters>({
    page: 1,
    limit: 20,
  });

  const load = useCallback(async (f: DeptStudentFilters) => {
    setLoading(true);
    try {
      setData(await listDeptStudents(f));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [load, filters]);

  const updateFilter = <K extends keyof DeptStudentFilters>(
    key: K,
    value: DeptStudentFilters[K] | undefined
  ) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-neutral-200 bg-white px-5 py-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-neutral-700">
              Academic year
            </label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              value={filters.academicYear ?? ""}
              onChange={(e) =>
                updateFilter(
                  "academicYear",
                  (e.target.value as DeptStudentFilters["academicYear"]) ||
                    undefined
                )
              }
            >
              <option value="">All</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-700">
              Min CGPA
            </label>
            <Input
              className="mt-1"
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
            <label className="text-xs font-medium text-neutral-700">
              Search
            </label>
            <Input
              className="mt-1"
              value={filters.search ?? ""}
              onChange={(e) => updateFilter("search", e.target.value || undefined)}
              placeholder="Name, email, or ID…"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        {loading ? (
          <div className="space-y-2 p-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-neutral-50" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
              <UsersIcon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-neutral-900">
              No students found
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Try adjusting your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Year</th>
                    <th className="px-5 py-3">CGPA</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.items.map((s: DeptStudentListItem) => (
                    <tr
                      key={s.id}
                      className="transition-colors hover:bg-neutral-50"
                    >
                      <td className="px-5 py-3 font-medium">
                        <Link
                          href={`/faculty/students/${s.id}`}
                          className="text-neutral-900 hover:text-neutral-600 hover:underline"
                        >
                          {s.fullName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-neutral-600">
                        {s.emailId}
                      </td>
                      <td className="px-5 py-3 text-neutral-600">
                        {s.studentId ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-neutral-600">
                        {s.academicYear ?? "—"}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-neutral-900">
                        {s.avgCgpa?.toFixed(2) ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            s.isActive
                              ? "bg-green-50 text-green-700 ring-green-200"
                              : "bg-neutral-100 text-neutral-600 ring-neutral-200"
                          }`}
                        >
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                        {!s.isVerified && (
                          <span className="ml-1 inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                            Unverified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-3">
              <span className="text-xs text-neutral-500">
                Page {data.page} of {data.totalPages} · {data.total} total
              </span>
              <div className="flex gap-2">
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
      </div>
    </div>
  );
}

// ==================== ALUMNI ====================

function AlumniTab() {
  const [items, setItems] = useState<AlumniListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await listDeptAlumni({ page: p, limit: 20, search: q || undefined });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load alumni");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, query);
  }, [load, page, query]);

  const handleSearch = () => {
    setPage(1);
    setQuery(search);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by name, email or student ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-xs text-sm"
        />
        <Button size="sm" onClick={handleSearch} variant="outline">Search</Button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-neutral-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-neutral-500">No alumni found.</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Current Company</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Grad. Year</th>
                  <th className="px-4 py-3 text-left">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {a.profilePic ? (
                          <img src={a.profilePic} alt="" className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white">
                            {a.fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <Link
                          href={`/alumni/students/${a.id}`}
                          className="font-medium text-neutral-900 hover:text-neutral-600 hover:underline"
                        >
                          {a.fullName}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{a.alumniProfile?.currentOrg ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{a.alumniProfile?.currentRole ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{a.alumniProfile?.package ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-600">{a.alumniProfile?.graduationYear ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-500">{a.emailId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{total} alumni</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <span>Page {page} / {totalPages}</span>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ==================== FACULTY (HOD only) ====================

function FacultyTabPanel() {
  const [items, setItems] = useState<DeptFacultyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listDeptFaculty());
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleToggleHOD = async (f: DeptFacultyItem) => {
    setBusyId(f.id);
    try {
      await updateDeptFaculty(f.id, { isHOD: !f.isHOD });
      toast.success(f.isHOD ? "Removed as HOD" : "Marked as HOD");
      await refresh();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = async (f: DeptFacultyItem) => {
    const next = !f.isActive;
    if (
      !window.confirm(next ? "Activate this faculty?" : "Deactivate this faculty?")
    )
      return;
    setBusyId(f.id);
    try {
      await setDeptFacultyStatus(f.id, next);
      toast.success(`Account ${next ? "activated" : "deactivated"}`);
      await refresh();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-5 py-4">
        <h2 className="text-base font-semibold text-neutral-900">
          Faculty in your department
        </h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          As HOD, you can promote/demote other faculty and toggle their status.
          New accounts are created by admin.
        </p>
      </div>
      {loading ? (
        <div className="space-y-2 p-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-neutral-50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <UsersIcon className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-neutral-900">
            No faculty found
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Ask admin to add faculty for this department.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((f) => (
                <tr
                  key={f.id}
                  className="transition-colors hover:bg-neutral-50"
                >
                  <td className="px-5 py-3 font-medium text-neutral-900">
                    {f.fullName}
                  </td>
                  <td className="px-5 py-3 text-neutral-600">{f.emailId}</td>
                  <td className="px-5 py-3 text-neutral-600">
                    {f.contactNo ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    {f.isHOD ? (
                      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                        HOD
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-500">Faculty</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        f.isActive
                          ? "bg-green-50 text-green-700 ring-green-200"
                          : "bg-neutral-100 text-neutral-600 ring-neutral-200"
                      }`}
                    >
                      {f.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleHOD(f)}
                        disabled={busyId === f.id}
                      >
                        {f.isHOD ? "Unset HOD" : "Set HOD"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(f)}
                        disabled={busyId === f.id}
                      >
                        {f.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
