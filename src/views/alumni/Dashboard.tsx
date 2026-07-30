"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  AlumniSidebar,
  type AlumniTab,
} from "@/components/shared/AlumniSidebar";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/api/base";
import { departmentLabel } from "@/lib/api/student";
import {
  getMyAlumniProfile,
  updateAlumniProfile,
  addPastOrg,
  deletePastOrg,
  upsertHigherStudies,
  deleteHigherStudies,
  createAlumniPost,
  listMyAlumniPosts,
  deleteMyAlumniPost,
  getAlumniAcademicHistory,
  updateAlumniMarks,
  addAlumniInternship,
  updateAlumniInternship,
  deleteAlumniInternship,
  addAlumniAchievement,
  updateAlumniAchievement,
  deleteAlumniAchievement,
  addAlumniProject,
  updateAlumniProject,
  deleteAlumniProject,
  POST_TYPE_LABELS,
  type AlumniUser,
  type AlumniPost,
  type AlumniPostType,
  type AcademicHistoryResponse,
  type AlumniInternship,
  type AlumniAchievement,
  type AlumniProject,
  type AlumniMarks,
  type InternshipPayload,
  type AchievementPayload,
  type ProjectPayload,
} from "@/lib/api/alumni";
import { resumeViewUrl } from "@/lib/utils";
import {
  AlumniFeedView,
  AlumniDirectoryView,
} from "@/components/alumni/AlumniViews";
import {
  Briefcase,
  GraduationCap,
  MessageSquare,
  Plus,
  Trash2,
  Mail,
  Building2,
  X,
  Award,
  BookOpen,
  Code2,
  FileCheck2,
  Link as LinkIcon,
  Pencil,
} from "lucide-react";

const ALUMNI_TABS: AlumniTab[] = [
  "overview",
  "profile",
  "academic",
  "posts",
  "feed",
  "directory",
];

const TAB_TITLES: Record<AlumniTab, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Your alumni summary." },
  profile: {
    title: "Career Profile",
    subtitle: "Maintain current role, past organisations, and higher studies.",
  },
  academic: {
    title: "Academic History",
    subtitle: "Your marks, internships, achievements, and projects from your student days.",
  },
  posts: {
    title: "My Posts",
    subtitle: "Share mentorship offers, referrals, or general advice.",
  },
  feed: {
    title: "Alumni Feed",
    subtitle: "Everything alumni are sharing across batches.",
  },
  directory: {
    title: "Alumni Directory",
    subtitle: "Discover fellow alumni by department, year, and company.",
  },
};

const POST_TYPES: AlumniPostType[] = [
  "MENTORSHIP",
  "REFERRAL",
  "CAREER_ADVICE",
  "GENERAL",
];

export function AlumniDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const tab: AlumniTab = (ALUMNI_TABS as string[]).includes(tabParam ?? "")
    ? (tabParam as AlumniTab)
    : "overview";

  const setTab = (t: AlumniTab) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    if (t === "overview") next.delete("tab");
    else next.set("tab", t);
    router.replace(`?${next.toString()}`);
  };

  const { title, subtitle } = TAB_TITLES[tab];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AlumniSidebar active={tab} onSelect={setTab} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:px-6">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
            <p className="line-clamp-2 text-xs text-neutral-500">{subtitle}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            {user && <NotificationBell />}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-neutral-900">
                {user?.fullName}
              </p>
              <p className="text-[11px] text-neutral-500">{user?.emailId}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
          <div className="max-w-6xl mx-auto">
            {tab === "overview" && <OverviewTab onNavigate={setTab} />}
            {tab === "profile" && <ProfileTab />}
            {tab === "academic" && <AcademicHistoryTab />}
            {tab === "posts" && <PostsTab />}
            {tab === "feed" && <AlumniFeedView />}
            {tab === "directory" && <AlumniDirectoryView />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ==================== OVERVIEW ====================

function OverviewTab({ onNavigate }: { onNavigate: (t: AlumniTab) => void }) {
  const [me, setMe] = useState<AlumniUser | null>(null);
  const [myPostsCount, setMyPostsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [u, posts] = await Promise.all([
          getMyAlumniProfile(),
          listMyAlumniPosts(),
        ]);
        setMe(u);
        setMyPostsCount(posts.length);
      } catch (e) {
        toast.error(extractErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg border border-neutral-200 bg-white"
          />
        ))}
      </div>
    );
  }

  const profile = me?.alumniProfile;
  const hasProfile = !!(
    profile?.currentOrg ||
    profile?.currentRole ||
    profile?.graduationYear ||
    profile?.higherStudies
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard
          label="Current Role"
          value={profile?.currentRole ?? "Not set"}
          hint={profile?.currentOrg ?? ""}
          icon={Briefcase}
        />
        <StatCard
          label="Graduation Year"
          value={profile?.graduationYear ? String(profile.graduationYear) : "—"}
          hint={me?.department ? departmentLabel(me.department) : ""}
          icon={GraduationCap}
        />
        <StatCard
          label="My Posts"
          value={String(myPostsCount)}
          hint="Shared with the community"
          icon={MessageSquare}
        />
      </div>

      {!hasProfile && (
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Finish setting up your alumni profile
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Add your current role, company, and graduation year so
                  students know where you are.
                </p>
              </div>
              <Button size="sm" onClick={() => onNavigate("profile")}>
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Share something with the community
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Post a referral, mentorship offer, or career insight.
              </p>
            </div>
            <Button size="sm" onClick={() => onNavigate("posts")}>
              New Post
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              {label}
            </p>
            <p className="mt-1 truncate text-xl font-semibold text-neutral-900">
              {value}
            </p>
            {hint && (
              <p className="mt-0.5 truncate text-xs text-neutral-500">{hint}</p>
            )}
          </div>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== PROFILE ====================

function ProfileTab() {
  const [me, setMe] = useState<AlumniUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    currentOrg: "",
    currentRole: "",
    package: "",
    graduationYear: "",
    placedBy: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const u = await getMyAlumniProfile();
      setMe(u);
      const p = u.alumniProfile;
      setForm({
        currentOrg: p?.currentOrg ?? "",
        currentRole: p?.currentRole ?? "",
        package: p?.package ?? "",
        graduationYear: p?.graduationYear ? String(p.graduationYear) : "",
        placedBy: p?.placedBy ?? "",
      });
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAlumniProfile({
        currentOrg: form.currentOrg || undefined,
        currentRole: form.currentRole || undefined,
        package: form.package || undefined,
        graduationYear: form.graduationYear
          ? Number(form.graduationYear)
          : undefined,
        placedBy: form.placedBy || undefined,
      });
      toast.success("Profile updated");
      load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-lg border border-neutral-200 bg-white" />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-neutral-900">
            Current Position
          </h3>
          <FieldGroup className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field>
                <FieldLabel>Current Organisation</FieldLabel>
                <Input
                  value={form.currentOrg}
                  onChange={(e) =>
                    setForm({ ...form, currentOrg: e.target.value })
                  }
                  placeholder="e.g. Google"
                />
              </Field>
              <Field>
                <FieldLabel>Current Role</FieldLabel>
                <Input
                  value={form.currentRole}
                  onChange={(e) =>
                    setForm({ ...form, currentRole: e.target.value })
                  }
                  placeholder="e.g. Software Engineer"
                />
              </Field>
              <Field>
                <FieldLabel>Package (CTC)</FieldLabel>
                <Input
                  value={form.package}
                  onChange={(e) =>
                    setForm({ ...form, package: e.target.value })
                  }
                  placeholder="e.g. 24 LPA"
                />
              </Field>
              <Field>
                <FieldLabel>Graduation Year</FieldLabel>
                <Input
                  type="number"
                  value={form.graduationYear}
                  onChange={(e) =>
                    setForm({ ...form, graduationYear: e.target.value })
                  }
                  placeholder="e.g. 2024"
                />
              </Field>
              <Field>
                <FieldLabel>Placed By (Source)</FieldLabel>
                <Input
                  value={form.placedBy}
                  onChange={(e) =>
                    setForm({ ...form, placedBy: e.target.value })
                  }
                  placeholder="College drive, Referral, Off-campus…"
                />
              </Field>
            </div>
          </FieldGroup>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <PastOrgsSection me={me} onChanged={load} />
      <HigherStudiesSection me={me} onChanged={load} />
    </div>
  );
}

function PastOrgsSection({
  me,
  onChanged,
}: {
  me: AlumniUser | null;
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    role: "",
    joiningDate: "",
    leavingDate: "",
  });
  const [saving, setSaving] = useState(false);

  const pastOrgs = me?.alumniProfile?.pastOrgs ?? [];

  const handleAdd = async () => {
    if (!form.companyName || !form.role || !form.joiningDate) {
      toast.error("Fill all required fields");
      return;
    }
    setSaving(true);
    try {
      await addPastOrg({
        companyName: form.companyName,
        role: form.role,
        joiningDate: form.joiningDate,
        leavingDate: form.leavingDate || undefined,
      });
      toast.success("Past organisation added");
      setForm({ companyName: "", role: "", joiningDate: "", leavingDate: "" });
      setShowForm(false);
      onChanged();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePastOrg(id);
      toast.success("Removed");
      onChanged();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-neutral-900">
            Past Organisations
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm((s) => !s)}
          >
            {showForm ? (
              <X className="mr-1 h-3 w-3" />
            ) : (
              <Plus className="mr-1 h-3 w-3" />
            )}
            {showForm ? "Cancel" : "Add"}
          </Button>
        </div>

        {showForm && (
          <div className="mb-4 rounded-md border border-neutral-200 bg-neutral-50 p-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field>
                <FieldLabel>Company *</FieldLabel>
                <Input
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Role *</FieldLabel>
                <Input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Joining Date *</FieldLabel>
                <Input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) =>
                    setForm({ ...form, joiningDate: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Leaving Date</FieldLabel>
                <Input
                  type="date"
                  value={form.leavingDate}
                  onChange={(e) =>
                    setForm({ ...form, leavingDate: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={handleAdd} disabled={saving}>
                {saving ? "Adding…" : "Add"}
              </Button>
            </div>
          </div>
        )}

        {pastOrgs.length === 0 ? (
          <p className="text-xs text-neutral-500">No past organisations yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {pastOrgs.map((o) => (
              <li
                key={o.id}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-neutral-900">
                    {o.role} · {o.companyName}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {new Date(o.joiningDate).toLocaleDateString()} —{" "}
                    {o.leavingDate
                      ? new Date(o.leavingDate).toLocaleDateString()
                      : "Present"}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(o.id)}
                  className="text-neutral-400 hover:text-red-600"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function HigherStudiesSection({
  me,
  onChanged,
}: {
  me: AlumniUser | null;
  onChanged: () => void;
}) {
  const existing = me?.alumniProfile?.higherStudies ?? null;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    collegeName: "",
    branch: "",
    location: "",
    joiningDate: "",
    leavingDate: "",
  });

  useEffect(() => {
    if (existing) {
      setForm({
        collegeName: existing.collegeName,
        branch: existing.branch,
        location: existing.location,
        joiningDate: existing.joiningDate.slice(0, 10),
        leavingDate: existing.leavingDate
          ? existing.leavingDate.slice(0, 10)
          : "",
      });
    }
  }, [existing]);

  const handleSave = async () => {
    if (
      !form.collegeName ||
      !form.branch ||
      !form.location ||
      !form.joiningDate
    ) {
      toast.error("Fill all required fields");
      return;
    }
    setSaving(true);
    try {
      await upsertHigherStudies({
        collegeName: form.collegeName,
        branch: form.branch,
        location: form.location,
        joiningDate: form.joiningDate,
        leavingDate: form.leavingDate || undefined,
      });
      toast.success("Saved");
      setEditing(false);
      onChanged();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteHigherStudies();
      toast.success("Removed");
      onChanged();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-neutral-900">
            Higher Studies
          </h3>
          {!editing && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              {existing ? "Edit" : "Add"}
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field>
                <FieldLabel>College *</FieldLabel>
                <Input
                  value={form.collegeName}
                  onChange={(e) =>
                    setForm({ ...form, collegeName: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Branch *</FieldLabel>
                <Input
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Location *</FieldLabel>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Joining Date *</FieldLabel>
                <Input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) =>
                    setForm({ ...form, joiningDate: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Leaving Date</FieldLabel>
                <Input
                  type="date"
                  value={form.leavingDate}
                  onChange={(e) =>
                    setForm({ ...form, leavingDate: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              {existing && (
                <Button size="sm" variant="outline" onClick={handleDelete}>
                  Remove
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : existing ? (
          <div className="rounded-md border border-neutral-200 p-3">
            <div className="text-sm font-medium text-neutral-900">
              {existing.branch} · {existing.collegeName}
            </div>
            <div className="text-xs text-neutral-500">
              {existing.location} ·{" "}
              {new Date(existing.joiningDate).toLocaleDateString()} —{" "}
              {existing.leavingDate
                ? new Date(existing.leavingDate).toLocaleDateString()
                : "Present"}
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">
            No higher studies record. Add one if you pursued a masters or PhD.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== POSTS (MY) ====================

function PostsTab() {
  const [posts, setPosts] = useState<AlumniPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPosts(await listMyAlumniPosts());
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMyAlumniPost(id);
      toast.success("Post deleted");
      load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-neutral-900">My Posts</h2>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> New Post
        </Button>
      </div>

      {creating && (
        <PostFormDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}

      {loading ? (
        <div className="text-sm text-neutral-500">Loading…</div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-neutral-500">
            You haven&rsquo;t posted anything yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onDelete={() => handleDelete(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  onDelete,
}: {
  post: AlumniPost;
  onDelete?: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {post.alumni.profilePic ? (
              <Image
                src={post.alumni.profilePic}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700">
                {post.alumni.fullName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-semibold text-neutral-900">
                {post.alumni.fullName}
              </div>
              <div className="text-xs text-neutral-500">
                {post.alumni.alumniProfile?.currentRole ?? ""}
                {post.alumni.alumniProfile?.currentOrg
                  ? ` · ${post.alumni.alumniProfile.currentOrg}`
                  : ""}
                {post.alumni.department
                  ? ` · ${departmentLabel(post.alumni.department)}`
                  : ""}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0 sm:justify-end">
            <span
              className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                post.postType === "REFERRAL"
                  ? "bg-emerald-100 text-emerald-800"
                  : post.postType === "MENTORSHIP"
                    ? "bg-blue-100 text-blue-800"
                    : post.postType === "CAREER_ADVICE"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-neutral-100 text-neutral-700"
              }`}
            >
              {POST_TYPE_LABELS[post.postType]}
            </span>
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-neutral-400 hover:text-red-600"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <h3 className="mt-3 text-base font-semibold text-neutral-900">
          {post.title}
        </h3>
        <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
          {post.body}
        </p>

        {(post.companyName || post.role || post.contactInfo) && (
          <div className="mt-3 flex flex-wrap gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-700">
            {post.companyName && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {post.companyName}
              </span>
            )}
            {post.role && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {post.role}
              </span>
            )}
            {post.contactInfo && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {post.contactInfo}
              </span>
            )}
          </div>
        )}

        <p className="mt-3 text-[11px] text-neutral-400">
          Posted {new Date(post.createdAt).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

function PostFormDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    postType: "GENERAL" as AlumniPostType,
    title: "",
    body: "",
    companyName: "",
    role: "",
    contactInfo: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.body) {
      toast.error("Title and body are required");
      return;
    }
    setSaving(true);
    try {
      await createAlumniPost({
        postType: form.postType,
        title: form.title,
        body: form.body,
        companyName: form.companyName || undefined,
        role: form.role || undefined,
        contactInfo: form.contactInfo || undefined,
      });
      toast.success("Post created");
      onSaved();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">New Post</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <FieldGroup className="space-y-3">
          <Field>
            <FieldLabel>Type</FieldLabel>
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={form.postType}
              onChange={(e) =>
                setForm({ ...form, postType: e.target.value as AlumniPostType })
              }
            >
              {POST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {POST_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field>
            <FieldLabel>Title *</FieldLabel>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel>Body *</FieldLabel>
            <textarea
              className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </Field>
          {(form.postType === "REFERRAL" ||
            form.postType === "MENTORSHIP") && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>Company</FieldLabel>
                <Input
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </Field>
            </div>
          )}
          <Field>
            <FieldLabel>How to reach you</FieldLabel>
            <Input
              value={form.contactInfo}
              onChange={(e) =>
                setForm({ ...form, contactInfo: e.target.value })
              }
              placeholder="Email, LinkedIn, form link…"
            />
          </Field>
        </FieldGroup>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==================== ACADEMIC HISTORY ====================

const MARKS_FIELDS = [
  { key: "sscPercentage", label: "SSC %" },
  { key: "hscPercentage", label: "HSC %" },
  { key: "sem1", label: "Sem 1" },
  { key: "sem2", label: "Sem 2" },
  { key: "sem3", label: "Sem 3" },
  { key: "sem4", label: "Sem 4" },
  { key: "sem5", label: "Sem 5" },
  { key: "sem6", label: "Sem 6" },
  { key: "sem7", label: "Sem 7" },
  { key: "sem8", label: "Sem 8" },
] as const;

type MarksKey = (typeof MARKS_FIELDS)[number]["key"];

function emptyInternshipForm(): InternshipPayload {
  return { companyName: "", role: "", roleDescription: "", duration: "", startDate: "", endDate: "", certificateUrl: "" };
}
function emptyAchievementForm(): AchievementPayload {
  return { title: "", description: "", category: "", certificateUrl: "", achievementDate: "" };
}
function emptyProjectForm(): ProjectPayload {
  return { title: "", description: "", techStack: [], projectUrl: "", repoUrl: "", startDate: "", endDate: "" };
}

function AcademicHistoryTab() {
  const [data, setData] = useState<AcademicHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // marks edit
  const [marksOpen, setMarksOpen] = useState(false);
  const [marksForm, setMarksForm] = useState<Record<MarksKey, string>>({} as Record<MarksKey, string>);
  const [marksSaving, setMarksSaving] = useState(false);

  // internship edit
  const [intModal, setIntModal] = useState<{ open: boolean; editing: AlumniInternship | null }>({ open: false, editing: null });
  const [intForm, setIntForm] = useState<InternshipPayload>(emptyInternshipForm());
  const [intSaving, setIntSaving] = useState(false);

  // achievement edit
  const [achModal, setAchModal] = useState<{ open: boolean; editing: AlumniAchievement | null }>({ open: false, editing: null });
  const [achForm, setAchForm] = useState<AchievementPayload>(emptyAchievementForm());
  const [achSaving, setAchSaving] = useState(false);

  // project edit
  const [projModal, setProjModal] = useState<{ open: boolean; editing: AlumniProject | null }>({ open: false, editing: null });
  const [projForm, setProjForm] = useState<ProjectPayload>(emptyProjectForm());
  const [projSaving, setProjSaving] = useState(false);

  const [techInput, setTechInput] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setData(await getAlumniAcademicHistory());
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
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg border border-neutral-200 bg-white" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { user, marks, internships, achievements, projects } = data;

  function openMarksEdit() {
    const f = {} as Record<MarksKey, string>;
    for (const { key } of MARKS_FIELDS) {
      const val = marks ? (marks[key as keyof AlumniMarks] as number | null) : null;
      f[key] = val != null ? String(val) : "";
    }
    setMarksForm(f);
    setMarksOpen(true);
  }

  async function saveMarks() {
    setMarksSaving(true);
    try {
      const payload: Record<string, number | null> = {};
      for (const { key } of MARKS_FIELDS) {
        const raw = marksForm[key].trim();
        payload[key] = raw === "" ? null : Number(raw);
      }
      const updated = await updateAlumniMarks(payload);
      setData((d) => d ? { ...d, marks: updated } : d);
      setMarksOpen(false);
      toast.success("Marks updated");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setMarksSaving(false);
    }
  }

  function openIntAdd() {
    setIntForm(emptyInternshipForm());
    setIntModal({ open: true, editing: null });
  }
  function openIntEdit(item: AlumniInternship) {
    setIntForm({
      companyName: item.companyName,
      role: item.role,
      roleDescription: item.roleDescription ?? "",
      duration: item.duration ?? "",
      startDate: item.startDate ? item.startDate.slice(0, 10) : "",
      endDate: item.endDate ? item.endDate.slice(0, 10) : "",
      certificateUrl: item.certificateUrl ?? "",
    });
    setIntModal({ open: true, editing: item });
  }
  async function saveInt() {
    setIntSaving(true);
    try {
      const payload = { ...intForm, endDate: intForm.endDate || null };
      if (intModal.editing) {
        const updated = await updateAlumniInternship(intModal.editing.id, payload);
        setData((d) => d ? { ...d, internships: d.internships.map((i) => i.id === updated.id ? updated : i) } : d);
      } else {
        const created = await addAlumniInternship(payload);
        setData((d) => d ? { ...d, internships: [created, ...d.internships] } : d);
      }
      setIntModal({ open: false, editing: null });
      toast.success(intModal.editing ? "Internship updated" : "Internship added");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setIntSaving(false);
    }
  }
  async function deleteInt(id: string) {
    if (!confirm("Delete this internship?")) return;
    try {
      await deleteAlumniInternship(id);
      setData((d) => d ? { ...d, internships: d.internships.filter((i) => i.id !== id) } : d);
      toast.success("Deleted");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  }

  function openAchAdd() {
    setAchForm(emptyAchievementForm());
    setAchModal({ open: true, editing: null });
  }
  function openAchEdit(item: AlumniAchievement) {
    setAchForm({
      title: item.title,
      description: item.description ?? "",
      category: item.category ?? "",
      certificateUrl: item.certificateUrl ?? "",
      achievementDate: item.achievementDate ? item.achievementDate.slice(0, 10) : "",
    });
    setAchModal({ open: true, editing: item });
  }
  async function saveAch() {
    setAchSaving(true);
    try {
      const payload = { ...achForm, achievementDate: achForm.achievementDate || null };
      if (achModal.editing) {
        const updated = await updateAlumniAchievement(achModal.editing.id, payload);
        setData((d) => d ? { ...d, achievements: d.achievements.map((a) => a.id === updated.id ? updated : a) } : d);
      } else {
        const created = await addAlumniAchievement(payload);
        setData((d) => d ? { ...d, achievements: [created, ...d.achievements] } : d);
      }
      setAchModal({ open: false, editing: null });
      toast.success(achModal.editing ? "Achievement updated" : "Achievement added");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setAchSaving(false);
    }
  }
  async function deleteAch(id: string) {
    if (!confirm("Delete this achievement?")) return;
    try {
      await deleteAlumniAchievement(id);
      setData((d) => d ? { ...d, achievements: d.achievements.filter((a) => a.id !== id) } : d);
      toast.success("Deleted");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  }

  function openProjAdd() {
    setProjForm(emptyProjectForm());
    setTechInput("");
    setProjModal({ open: true, editing: null });
  }
  function openProjEdit(item: AlumniProject) {
    setProjForm({
      title: item.title,
      description: item.description ?? "",
      techStack: item.techStack,
      projectUrl: item.projectUrl ?? "",
      repoUrl: item.repoUrl ?? "",
      startDate: item.startDate ? item.startDate.slice(0, 10) : "",
      endDate: item.endDate ? item.endDate.slice(0, 10) : "",
    });
    setTechInput("");
    setProjModal({ open: true, editing: item });
  }
  async function saveProj() {
    setProjSaving(true);
    try {
      const payload = { ...projForm, startDate: projForm.startDate || null, endDate: projForm.endDate || null };
      if (projModal.editing) {
        const updated = await updateAlumniProject(projModal.editing.id, payload);
        setData((d) => d ? { ...d, projects: d.projects.map((p) => p.id === updated.id ? updated : p) } : d);
      } else {
        const created = await addAlumniProject(payload);
        setData((d) => d ? { ...d, projects: [created, ...d.projects] } : d);
      }
      setProjModal({ open: false, editing: null });
      toast.success(projModal.editing ? "Project updated" : "Project added");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setProjSaving(false);
    }
  }
  async function deleteProj(id: string) {
    if (!confirm("Delete this project?")) return;
    try {
      await deleteAlumniProject(id);
      setData((d) => d ? { ...d, projects: d.projects.filter((p) => p.id !== id) } : d);
      toast.success("Deleted");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      {/* Student Profile Summary */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {user.profilePic ? (
              <Image
                src={user.profilePic}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 text-lg font-semibold text-neutral-700">
                {user.fullName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-neutral-900">{user.fullName}</h3>
              {user.legalName && user.legalName !== user.fullName && (
                <p className="text-xs text-neutral-500">Legal name: {user.legalName}</p>
              )}
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-600">
                {user.studentId && <span>ID: <strong>{user.studentId}</strong></span>}
                {user.department && <span>· {departmentLabel(user.department)}</span>}
                {user.avgCgpa != null && user.avgCgpa > 0 && (
                  <span>· CGPA <strong>{user.avgCgpa.toFixed(2)}</strong></span>
                )}
              </div>
              {user.skills && user.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {user.skills.map((s) => (
                    <span key={s} className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-700">{s}</span>
                  ))}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                {user.resumeUrl && (
                  <a href={resumeViewUrl(user.resumeUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                    <FileCheck2 className="h-3 w-3" /> Resume
                  </a>
                )}
                {user.socialProfile && (
                  <a href={user.socialProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                    <LinkIcon className="h-3 w-3" /> Social Profile
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marks */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-neutral-500" />
            <h3 className="text-sm font-semibold text-neutral-900">Academic Marks</h3>
            {marks?.isVerified && (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Verified</span>
            )}
            <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 px-2 text-xs" onClick={openMarksEdit}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          </div>
          {!marks ? (
            <p className="text-sm text-neutral-500">No marks recorded.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {MARKS_FIELDS.map(({ key, label }) => {
                const val = marks[key as keyof AlumniMarks] as number | null;
                return (
                  <div key={key} className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">{label}</p>
                    <p className={`mt-1 text-lg font-semibold ${val == null ? "text-neutral-300" : "text-neutral-900"}`}>
                      {val != null ? val : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Internships */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-4 w-4 text-neutral-500" />
            <h3 className="text-sm font-semibold text-neutral-900">
              Internships <span className="text-neutral-400 font-normal">({internships.length})</span>
            </h3>
            <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 px-2 text-xs" onClick={openIntAdd}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>
          {internships.length === 0 ? (
            <p className="text-sm text-neutral-500">No internships recorded.</p>
          ) : (
            <div className="space-y-3">
              {internships.map((intship) => (
                <div key={intship.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{intship.role}</p>
                      <p className="text-xs text-neutral-600">{intship.companyName}</p>
                      {intship.duration && <p className="text-xs text-neutral-500">{intship.duration}</p>}
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {new Date(intship.startDate).toLocaleDateString()}
                        {intship.endDate ? ` — ${new Date(intship.endDate).toLocaleDateString()}` : " — Present"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:flex-col sm:items-end">
                      {intship.isVerified && (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Verified</span>
                      )}
                      {intship.certificateUrl && (
                        <a href={intship.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline">Certificate</a>
                      )}
                      <button onClick={() => openIntEdit(intship)} className="text-neutral-400 hover:text-neutral-700">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteInt(intship.id)} className="text-neutral-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {intship.roleDescription && <p className="mt-2 text-xs text-neutral-600">{intship.roleDescription}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-4 w-4 text-neutral-500" />
            <h3 className="text-sm font-semibold text-neutral-900">
              Achievements <span className="text-neutral-400 font-normal">({achievements.length})</span>
            </h3>
            <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 px-2 text-xs" onClick={openAchAdd}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>
          {achievements.length === 0 ? (
            <p className="text-sm text-neutral-500">No achievements recorded.</p>
          ) : (
            <div className="space-y-3">
              {achievements.map((ach) => (
                <div key={ach.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{ach.title}</p>
                      {ach.category && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">{ach.category}</span>
                      )}
                      {ach.achievementDate && (
                        <p className="text-xs text-neutral-400 mt-0.5">{new Date(ach.achievementDate).toLocaleDateString()}</p>
                      )}
                      {ach.description && <p className="mt-1 text-xs text-neutral-600">{ach.description}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:flex-col sm:items-end">
                      {ach.isVerified && (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Verified</span>
                      )}
                      {ach.certificateUrl && (
                        <a href={ach.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline">Certificate</a>
                      )}
                      <button onClick={() => openAchEdit(ach)} className="text-neutral-400 hover:text-neutral-700">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteAch(ach.id)} className="text-neutral-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="h-4 w-4 text-neutral-500" />
            <h3 className="text-sm font-semibold text-neutral-900">
              Projects <span className="text-neutral-400 font-normal">({projects.length})</span>
            </h3>
            <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 px-2 text-xs" onClick={openProjAdd}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-neutral-500">No projects recorded.</p>
          ) : (
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-neutral-900">{proj.title}</p>
                      {proj.techStack && proj.techStack.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {proj.techStack.map((t) => (
                            <span key={t} className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-700">{t}</span>
                          ))}
                        </div>
                      )}
                      {proj.description && <p className="mt-1 text-xs text-neutral-600">{proj.description}</p>}
                      {(proj.startDate || proj.endDate) && (
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : ""}
                          {proj.endDate ? ` — ${new Date(proj.endDate).toLocaleDateString()}` : proj.startDate ? " — Present" : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:flex-col sm:items-end sm:flex-shrink-0">
                      {proj.isVerified && (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Verified</span>
                      )}
                      {proj.projectUrl && (
                        <a href={proj.projectUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline">Live</a>
                      )}
                      {proj.repoUrl && (
                        <a href={proj.repoUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline">Repo</a>
                      )}
                      <button onClick={() => openProjEdit(proj)} className="text-neutral-400 hover:text-neutral-700">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteProj(proj.id)} className="text-neutral-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marks Modal */}
      {marksOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Edit Academic Marks</h3>
              <button onClick={() => setMarksOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MARKS_FIELDS.map(({ key, label }) => (
                <Field key={key}>
                  <FieldLabel>{label}</FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="—"
                    value={marksForm[key]}
                    onChange={(e) => setMarksForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </Field>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMarksOpen(false)}>Cancel</Button>
              <Button onClick={saveMarks} disabled={marksSaving}>{marksSaving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Internship Modal */}
      {intModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">{intModal.editing ? "Edit Internship" : "Add Internship"}</h3>
              <button onClick={() => setIntModal({ open: false, editing: null })}><X className="h-4 w-4" /></button>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel>Company Name *</FieldLabel>
                <Input value={intForm.companyName} onChange={(e) => setIntForm((f) => ({ ...f, companyName: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Role *</FieldLabel>
                <Input value={intForm.role} onChange={(e) => setIntForm((f) => ({ ...f, role: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Role Description</FieldLabel>
                <Input value={intForm.roleDescription ?? ""} onChange={(e) => setIntForm((f) => ({ ...f, roleDescription: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Duration (e.g. 2 months)</FieldLabel>
                <Input value={intForm.duration ?? ""} onChange={(e) => setIntForm((f) => ({ ...f, duration: e.target.value }))} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Start Date *</FieldLabel>
                  <Input type="date" value={intForm.startDate} onChange={(e) => setIntForm((f) => ({ ...f, startDate: e.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel>End Date</FieldLabel>
                  <Input type="date" value={intForm.endDate ?? ""} onChange={(e) => setIntForm((f) => ({ ...f, endDate: e.target.value }))} />
                </Field>
              </div>
              <Field>
                <FieldLabel>Certificate URL</FieldLabel>
                <Input value={intForm.certificateUrl ?? ""} onChange={(e) => setIntForm((f) => ({ ...f, certificateUrl: e.target.value }))} />
              </Field>
            </FieldGroup>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIntModal({ open: false, editing: null })}>Cancel</Button>
              <Button onClick={saveInt} disabled={intSaving}>{intSaving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Modal */}
      {achModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">{achModal.editing ? "Edit Achievement" : "Add Achievement"}</h3>
              <button onClick={() => setAchModal({ open: false, editing: null })}><X className="h-4 w-4" /></button>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel>Title *</FieldLabel>
                <Input value={achForm.title} onChange={(e) => setAchForm((f) => ({ ...f, title: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Category</FieldLabel>
                <Input placeholder="academic / sports / cultural / technical / other" value={achForm.category ?? ""} onChange={(e) => setAchForm((f) => ({ ...f, category: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Input type="date" value={achForm.achievementDate ?? ""} onChange={(e) => setAchForm((f) => ({ ...f, achievementDate: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Input value={achForm.description ?? ""} onChange={(e) => setAchForm((f) => ({ ...f, description: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Certificate URL</FieldLabel>
                <Input value={achForm.certificateUrl ?? ""} onChange={(e) => setAchForm((f) => ({ ...f, certificateUrl: e.target.value }))} />
              </Field>
            </FieldGroup>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAchModal({ open: false, editing: null })}>Cancel</Button>
              <Button onClick={saveAch} disabled={achSaving}>{achSaving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {projModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">{projModal.editing ? "Edit Project" : "Add Project"}</h3>
              <button onClick={() => setProjModal({ open: false, editing: null })}><X className="h-4 w-4" /></button>
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel>Title *</FieldLabel>
                <Input value={projForm.title} onChange={(e) => setProjForm((f) => ({ ...f, title: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Input value={projForm.description ?? ""} onChange={(e) => setProjForm((f) => ({ ...f, description: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Tech Stack</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tech and press Enter"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && techInput.trim()) {
                        e.preventDefault();
                        setProjForm((f) => ({ ...f, techStack: [...(f.techStack ?? []), techInput.trim()] }));
                        setTechInput("");
                      }
                    }}
                  />
                </div>
                {(projForm.techStack?.length ?? 0) > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {projForm.techStack?.map((t, i) => (
                      <span key={i} className="flex items-center gap-1 rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                        {t}
                        <button onClick={() => setProjForm((f) => ({ ...f, techStack: f.techStack?.filter((_, j) => j !== i) }))} className="text-neutral-400 hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Start Date</FieldLabel>
                  <Input type="date" value={projForm.startDate ?? ""} onChange={(e) => setProjForm((f) => ({ ...f, startDate: e.target.value }))} />
                </Field>
                <Field>
                  <FieldLabel>End Date</FieldLabel>
                  <Input type="date" value={projForm.endDate ?? ""} onChange={(e) => setProjForm((f) => ({ ...f, endDate: e.target.value }))} />
                </Field>
              </div>
              <Field>
                <FieldLabel>Live URL</FieldLabel>
                <Input value={projForm.projectUrl ?? ""} onChange={(e) => setProjForm((f) => ({ ...f, projectUrl: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Repository URL</FieldLabel>
                <Input value={projForm.repoUrl ?? ""} onChange={(e) => setProjForm((f) => ({ ...f, repoUrl: e.target.value }))} />
              </Field>
            </FieldGroup>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setProjModal({ open: false, editing: null })}>Cancel</Button>
              <Button onClick={saveProj} disabled={projSaving}>{projSaving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
