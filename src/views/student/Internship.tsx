"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
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
  listInternships,
  createInternship,
  updateInternship,
  deleteInternship,
  uploadCertificate,
  type Internship,
  type InternshipPayload,
} from "@/lib/api/student";

interface FormState {
  companyName: string;
  role: string;
  roleDescription: string;
  duration: string;
  startDate: string;
  endDate: string;
  hrName: string;
  hrEmail: string;
  hrPhone: string;
  certificateUrl: string;
}

const emptyForm: FormState = {
  companyName: "",
  role: "",
  roleDescription: "",
  duration: "",
  startDate: "",
  endDate: "",
  hrName: "",
  hrEmail: "",
  hrPhone: "",
  certificateUrl: "",
};

const toForm = (i: Internship): FormState => ({
  companyName: i.companyName,
  role: i.role,
  roleDescription: i.roleDescription ?? "",
  duration: i.duration ?? "",
  startDate: i.startDate ? i.startDate.slice(0, 10) : "",
  endDate: i.endDate ? i.endDate.slice(0, 10) : "",
  hrName: i.hrName ?? "",
  hrEmail: i.hrEmail ?? "",
  hrPhone: i.hrPhone ?? "",
  certificateUrl: i.certificateUrl ?? "",
});

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function Internship() {
  const [items, setItems] = useState<Internship[]>([]);
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
      const data = await listInternships();
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

  const startEdit = (i: Internship) => {
    setEditingId(i.id);
    setForm(toForm(i));
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
    if (!form.companyName.trim() || !form.role.trim() || !form.startDate) {
      toast.error("Company, role, and start date are required.");
      return;
    }

    setSaving(true);
    const payload: InternshipPayload = {
      companyName: form.companyName.trim(),
      role: form.role.trim(),
      roleDescription: form.roleDescription || undefined,
      duration: form.duration || undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      hrName: form.hrName || undefined,
      hrEmail: form.hrEmail || undefined,
      hrPhone: form.hrPhone || undefined,
      certificateUrl: form.certificateUrl || undefined,
    };

    try {
      if (editingId) {
        await updateInternship(editingId, payload);
        toast.success("Internship updated. Pending re-verification.");
      } else {
        await createInternship(payload);
        toast.success("Internship added. Pending faculty verification.");
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
    if (!confirm("Delete this internship? This cannot be undone.")) return;
    try {
      await deleteInternship(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Internship deleted.");
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <StudentLayout
      title="Internships"
      subtitle="Faculty verifies each entry. Certificates must be PDF, max 2MB."
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Add internship
          </button>
        </div>
        {isAdding && (
          <section className="rounded-2xl border border-neutral-200 bg-white">
            <header className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-neutral-900">
                  {editingId ? "Edit internship" : "Add internship"}
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Editing a verified internship resets it to pending.
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
                <TextField
                  id="companyName"
                  label="Company *"
                  value={form.companyName}
                  onChange={(v) => set("companyName", v)}
                  placeholder="Google"
                  required
                />
                <TextField
                  id="role"
                  label="Role *"
                  value={form.role}
                  onChange={(v) => set("role", v)}
                  placeholder="SDE Intern"
                  required
                />
                <div className="sm:col-span-2">
                  <TextField
                    id="roleDescription"
                    label="Work description"
                    value={form.roleDescription}
                    onChange={(v) => set("roleDescription", v)}
                    placeholder="Built internal tools using React and Node.js"
                  />
                </div>
                <TextField
                  id="duration"
                  label="Duration"
                  value={form.duration}
                  onChange={(v) => set("duration", v)}
                  placeholder="3 months"
                />
                <TextField
                  id="startDate"
                  label="Start date *"
                  type="date"
                  value={form.startDate}
                  onChange={(v) => set("startDate", v)}
                  required
                />
                <TextField
                  id="endDate"
                  label="End date"
                  type="date"
                  value={form.endDate}
                  onChange={(v) => set("endDate", v)}
                />
                <TextField
                  id="hrName"
                  label="HR / manager name"
                  value={form.hrName}
                  onChange={(v) => set("hrName", v)}
                />
                <TextField
                  id="hrEmail"
                  label="HR email"
                  type="email"
                  value={form.hrEmail}
                  onChange={(v) => set("hrEmail", v)}
                  placeholder="hr@company.com"
                />
                <TextField
                  id="hrPhone"
                  label="HR phone"
                  value={form.hrPhone}
                  onChange={(v) => set("hrPhone", v)}
                />
              </div>

              <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Offer / experience certificate
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
              <Briefcase className="h-5 w-5 text-neutral-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900">
              No internships yet
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Click "Add internship" to create your first entry.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((i) => (
              <article
                key={i.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-900">
                        {i.role}
                      </h3>
                      <span className="text-sm text-neutral-500">
                        @ {i.companyName}
                      </span>
                      <VerificationBadge isVerified={i.isVerified} />
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      {formatDate(i.startDate)} → {formatDate(i.endDate)}
                      {i.duration ? ` · ${i.duration}` : ""}
                    </p>
                    {i.roleDescription && (
                      <p className="mt-2 text-sm text-neutral-700">
                        {i.roleDescription}
                      </p>
                    )}
                    {(i.hrName || i.hrEmail || i.hrPhone) && (
                      <p className="mt-2 text-xs text-neutral-500">
                        HR:{" "}
                        {[i.hrName, i.hrEmail, i.hrPhone]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {i.certificateUrl && (
                      <a
                        href={i.certificateUrl}
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
                      onClick={() => startEdit(i)}
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 transition hover:bg-neutral-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(i.id)}
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
