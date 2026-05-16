"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FolderGit2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Github,
  X,
} from "lucide-react";
import { StudentLayout } from "@/components/shared/StudentLayout";
import { extractErrorMessage } from "@/lib/api/base";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  type Project,
  type ProjectPayload,
} from "@/lib/api/student";

interface FormState {
  title: string;
  description: string;
  techStackRaw: string;
  projectUrl: string;
  repoUrl: string;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  techStackRaw: "",
  projectUrl: "",
  repoUrl: "",
};

const toForm = (p: Project): FormState => ({
  title: p.title,
  description: p.description ?? "",
  techStackRaw: p.techStack.join(", "),
  projectUrl: p.projectUrl ?? "",
  repoUrl: p.repoUrl ?? "",
});


export function Projects() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listProjects();
      setItems(data.items);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsAdding(true);
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setForm(toForm(p));
    setIsAdding(true);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    setSaving(true);
    const techStack = form.techStackRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: ProjectPayload = {
      title: form.title.trim(),
      description: form.description || undefined,
      techStack,
      projectUrl: form.projectUrl || undefined,
      repoUrl: form.repoUrl || undefined,
    };

    try {
      if (editingId) {
        await updateProject(editingId, payload);
        toast.success("Project updated. Pending re-verification.");
      } else {
        await createProject(payload);
        toast.success("Project added. Pending faculty verification.");
      }
      cancelForm();
      await load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    try {
      await deleteProject(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted.");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <StudentLayout
      title="Projects"
      subtitle="Showcase what you've built. Faculty verifies each entry."
    >
      <div className="mx-auto max-w-5xl space-y-4">
        {!isAdding && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={startAdd}
              className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              Add project
            </button>
          </div>
        )}

        {isAdding && (
          <section className="rounded-2xl border border-neutral-200 bg-white">
            <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-neutral-900">
                  {editingId ? "Edit project" : "Add project"}
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Editing a verified project resets it to pending.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelForm}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField
                    id="title"
                    label="Title *"
                    value={form.title}
                    onChange={(v) => set("title", v)}
                    placeholder="Real-time placement dashboard"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-xs font-medium text-neutral-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="What does it do? What tech choices did you make?"
                    rows={3}
                    className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextField
                    id="techStack"
                    label="Tech stack (comma-separated)"
                    value={form.techStackRaw}
                    onChange={(v) => set("techStackRaw", v)}
                    placeholder="React, Node.js, PostgreSQL, Docker"
                  />
                </div>
                <TextField
                  id="projectUrl"
                  label="Live URL"
                  type="url"
                  value={form.projectUrl}
                  onChange={(v) => set("projectUrl", v)}
                  placeholder="https://myproject.vercel.app"
                />
                <TextField
                  id="repoUrl"
                  label="Repository URL"
                  type="url"
                  value={form.repoUrl}
                  onChange={(v) => set("repoUrl", v)}
                  placeholder="https://github.com/you/repo"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add"}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        ) : items.length === 0 && !isAdding ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <FolderGit2 className="h-5 w-5 text-neutral-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900">
              No projects yet
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Click "Add project" to showcase your work.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((p) => (
              <article
                key={p.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-900">
                        {p.title}
                      </h3>
                      <VerificationBadge isVerified={p.isVerified} />
                    </div>
                    {p.description && (
                      <p className="mt-2 text-sm text-neutral-700">
                        {p.description}
                      </p>
                    )}
                    {p.techStack.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.techStack.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-700"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      {p.projectUrl && (
                        <a
                          href={p.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-neutral-900 underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Live
                        </a>
                      )}
                      {p.repoUrl && (
                        <a
                          href={p.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-neutral-900 underline"
                        >
                          <Github className="h-3.5 w-3.5" />
                          Code
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 transition hover:bg-neutral-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-neutral-700"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
      />
    </div>
  );
}

function VerificationBadge({ isVerified }: { isVerified: boolean }) {
  return isVerified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700 ring-1 ring-green-200">
      <CheckCircle2 className="h-3 w-3" />
      Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
      <Clock className="h-3 w-3" />
      Pending
    </span>
  );
}
