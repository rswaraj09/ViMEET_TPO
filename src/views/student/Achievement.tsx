"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  X,
} from "lucide-react";
import { StudentLayout } from "@/components/shared/StudentLayout";
import { extractErrorMessage } from "@/lib/api/base";
import { validateFileSize } from "@/lib/api/fileUpload";
import {
  listAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  uploadCertificate,
  type Achievement,
  type AchievementPayload,
} from "@/lib/api/student";

const CATEGORIES = ["academic", "sports", "cultural", "technical", "other"];

interface FormState {
  title: string;
  description: string;
  category: string;
  achievementDate: string;
  certificateUrl: string;
}

const emptyForm: FormState = {
  title: "",
  description: "",
  category: "",
  achievementDate: "",
  certificateUrl: "",
};

const toForm = (a: Achievement): FormState => ({
  title: a.title,
  description: a.description ?? "",
  category: a.category ?? "",
  achievementDate: a.achievementDate ? a.achievementDate.slice(0, 10) : "",
  certificateUrl: a.certificateUrl ?? "",
});

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function Achievement() {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAchievements();
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

  const startEdit = (a: Achievement) => {
    setEditingId(a.id);
    setForm(toForm(a));
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

  const onCertChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFileSize(file)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploadingCert(true);
    try {
      const { url } = await uploadCertificate(file);
      set("certificateUrl", url);
      toast.success("Certificate uploaded.");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUploadingCert(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }

    setSaving(true);
    const payload: AchievementPayload = {
      title: form.title.trim(),
      description: form.description || undefined,
      category: form.category || undefined,
      achievementDate: form.achievementDate || undefined,
      certificateUrl: form.certificateUrl || undefined,
    };

    try {
      if (editingId) {
        await updateAchievement(editingId, payload);
        toast.success("Achievement updated. Pending re-verification.");
      } else {
        await createAchievement(payload);
        toast.success("Achievement added. Pending faculty verification.");
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
    if (!confirm("Delete this achievement? This cannot be undone.")) return;
    try {
      await deleteAchievement(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
      toast.success("Achievement deleted.");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <StudentLayout
      title="Achievements"
      subtitle="Awards, hackathons, and certifications. Faculty verifies each entry."
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Add achievement
          </button>
        </div>
        {isAdding && (
          <section className="rounded-2xl border border-neutral-200 bg-white">
            <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-neutral-900">
                  {editingId ? "Edit achievement" : "Add achievement"}
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Editing a verified achievement resets it to pending.
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
                    placeholder="Winner - Smart India Hackathon 2025"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextField
                    id="description"
                    label="Description"
                    value={form.description}
                    onChange={(v) => set("description", v)}
                    placeholder="Led a team of 4 to build an AI-powered traffic solution…"
                  />
                </div>
                <div>
                  <label
                    htmlFor="category"
                    className="block text-xs font-medium text-neutral-700"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <TextField
                  id="achievementDate"
                  label="Date"
                  type="date"
                  value={form.achievementDate}
                  onChange={(v) => set("achievementDate", v)}
                />
              </div>

              <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Certificate
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  PDF, max 2MB.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {form.certificateUrl ? (
                    <a
                      href={form.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-900 underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View uploaded file
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-500">
                      No file uploaded
                    </span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={onCertChange}
                  />
                  <button
                    type="button"
                    disabled={uploadingCert}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingCert ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {uploadingCert
                      ? "Uploading…"
                      : form.certificateUrl
                        ? "Replace"
                        : "Upload"}
                  </button>
                </div>
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
              <Award className="h-5 w-5 text-neutral-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900">
              No achievements yet
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Click "Add achievement" to create your first entry.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((a) => (
              <article
                key={a.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-900">
                        {a.title}
                      </h3>
                      {a.category && (
                        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium capitalize text-neutral-700">
                          {a.category}
                        </span>
                      )}
                      <VerificationBadge isVerified={a.isVerified} />
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      {formatDate(a.achievementDate)}
                    </p>
                    {a.description && (
                      <p className="mt-2 text-sm text-neutral-700">
                        {a.description}
                      </p>
                    )}
                    {a.certificateUrl && (
                      <a
                        href={a.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-neutral-900 underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        View certificate
                      </a>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(a)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 transition hover:bg-neutral-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
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
