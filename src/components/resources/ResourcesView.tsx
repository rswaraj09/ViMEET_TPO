"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, FileText, Pencil, Trash2, X, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/api/base";
import { departmentLabel } from "@/lib/api/student";
import {
  listResources,
  createResource,
  updateResource,
  deleteResource,
  RESOURCE_FILE_TYPE_LABELS,
  type Resource,
  type ResourceFileType,
} from "@/lib/api/resources";
import type { AcademicYear, Department } from "@/lib/api/student";

const YEAR_LABELS: Record<AcademicYear, string> = {
  FIRST_YEAR: "First Year",
  SECOND_YEAR: "Second Year",
  THIRD_YEAR: "Third Year",
  FOURTH_YEAR: "Fourth Year",
};

const YEAR_VALUES: AcademicYear[] = [
  "FIRST_YEAR",
  "SECOND_YEAR",
  "THIRD_YEAR",
  "FOURTH_YEAR",
];

const DEPT_VALUES: Department[] = [
  "CSE",
  "COMPUTER",
  "ELECTRICAL",
  "MECHANICAL",
  "EXTC",
  "CIVIL",
];

const FILE_TYPE_VALUES: ResourceFileType[] = [
  "QUESTION_PAPER",
  "SYLLABUS",
  "EXAM_FORM",
  "OTHER_FORM",
  "OTHER",
];

const FILE_TYPE_COLORS: Record<ResourceFileType, string> = {
  QUESTION_PAPER: "bg-blue-50 text-blue-700 ring-blue-200",
  SYLLABUS: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  EXAM_FORM: "bg-purple-50 text-purple-700 ring-purple-200",
  OTHER_FORM: "bg-amber-50 text-amber-700 ring-amber-200",
  OTHER: "bg-neutral-100 text-neutral-600 ring-neutral-200",
};

interface Props {
  canAdd: boolean;
  canDelete: boolean;
  forceDepartment?: Department | null;
}

export function ResourcesView({ canAdd, canDelete, forceDepartment }: Props) {
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [filterType, setFilterType] = useState<ResourceFileType | "">("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);

  const load = async () => {
    try {
      setResources(await listResources(filterType || undefined));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource permanently?")) return;
    try {
      await deleteResource(id);
      toast.success("Resource deleted");
      await load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ResourceFileType | "")}
            className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm"
          >
            <option value="">All types</option>
            {FILE_TYPE_VALUES.map((t) => (
              <option key={t} value={t}>
                {RESOURCE_FILE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        {canAdd && (
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> Add resource
          </Button>
        )}
      </div>

      {resources === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-neutral-200 bg-white" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <BookOpen className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-neutral-900">No resources yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            {canAdd
              ? "Add question papers, syllabi, or forms for students."
              : "No resources have been uploaded for your department and year."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {resources.map((r) => (
            <li key={r.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900">{r.title}</h3>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${FILE_TYPE_COLORS[r.fileType]}`}
                    >
                      {RESOURCE_FILE_TYPE_LABELS[r.fileType]}
                    </span>
                  </div>
                  {r.description && (
                    <p className="mt-1 text-sm text-neutral-600">{r.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-neutral-500">
                    <span>
                      Dept:{" "}
                      {r.department ? departmentLabel(r.department) : "All departments"}
                    </span>
                    {r.academicYear && (
                      <span>Year: {YEAR_LABELS[r.academicYear]}</span>
                    )}
                    <span>Added by {r.addedBy.fullName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </a>
                  {canAdd && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditing(r); setShowForm(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <ResourceFormModal
          resource={editing}
          forceDepartment={forceDepartment}
          onClose={() => setShowForm(false)}
          onSaved={async () => {
            setShowForm(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function ResourceFormModal({
  resource,
  forceDepartment,
  onClose,
  onSaved,
}: {
  resource: Resource | null;
  forceDepartment?: Department | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(resource?.title ?? "");
  const [description, setDescription] = useState(resource?.description ?? "");
  const [fileType, setFileType] = useState<ResourceFileType>(resource?.fileType ?? "QUESTION_PAPER");
  const [department, setDepartment] = useState<Department | "">(
    resource?.department ?? forceDepartment ?? ""
  );
  const [academicYear, setAcademicYear] = useState<AcademicYear | "">(
    resource?.academicYear ?? ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!resource;

  const handleSave = async () => {
    if (!title.trim() || !fileType) {
      toast.error("Title and file type are required");
      return;
    }
    if (!isEdit && !file) {
      toast.error("Please select a file to upload");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateResource(resource.id, {
          title,
          description: description || null,
          fileType,
          academicYear: (academicYear as AcademicYear) || null,
        });
        toast.success("Resource updated");
      } else {
        const fd = new FormData();
        fd.append("title", title);
        if (description) fd.append("description", description);
        fd.append("fileType", fileType);
        if (department) fd.append("department", department);
        if (academicYear) fd.append("academicYear", academicYear);
        if (file) fd.append("file", file);
        await createResource(fd);
        toast.success("Resource added");
      }
      onSaved();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900">
            {isEdit ? "Edit resource" : "Add resource"}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-700">Title</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DBMS Question Paper 2024" />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-neutral-700">Description (optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-16 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              placeholder="Brief description…"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-700">File type</span>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as ResourceFileType)}
                className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
              >
                {FILE_TYPE_VALUES.map((t) => (
                  <option key={t} value={t}>{RESOURCE_FILE_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-700">Year (optional)</span>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value as AcademicYear | "")}
                className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
              >
                <option value="">All years</option>
                {YEAR_VALUES.map((y) => (
                  <option key={y} value={y}>{YEAR_LABELS[y]}</option>
                ))}
              </select>
            </label>
          </div>

          {!forceDepartment && !isEdit && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-700">Department (optional)</span>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department | "")}
                className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
              >
                <option value="">All departments (admin-wide)</option>
                {DEPT_VALUES.map((d) => (
                  <option key={d} value={d}>{departmentLabel(d)}</option>
                ))}
              </select>
            </label>
          )}

          {!isEdit && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-700">File (PDF)</span>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-neutral-700"
              />
              {file && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-neutral-500">
                  <FileText className="h-3 w-3" /> {file.name}
                </p>
              )}
            </label>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Upload resource"}
          </Button>
        </div>
      </div>
    </div>
  );
}
