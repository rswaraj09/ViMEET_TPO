"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Brain,
  Plus,
  FileText,
  Archive,
  Pencil,
  Trash2,
  ArrowLeft,
  Check,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/api/base";
import { departmentLabel } from "@/lib/api/student";
import {
  facultyListTests,
  facultyGetTest,
  createAptitudeTest,
  updateAptitudeTest,
  setTestStatus,
  deleteAptitudeTest,
  listTestSubmissions,
  reviewSubmission,
  TEST_CATEGORY_LABELS,
  SUBMISSION_STATUS_LABELS,
  type AptitudeTestSummary,
  type AptitudeTestFull,
  type CreateTestInput,
  type SubmissionRecord,
  type TestStatus,
  type AptitudeQuestion,
  type AptitudeSection,
  type OptionNumber,
} from "@/lib/api/aptitude";
import type { AcademicYear, Department } from "@/lib/api/student";

const DEPARTMENT_VALUES: Department[] = [
  "CSE",
  "COMPUTER",
  "ELECTRICAL",
  "MECHANICAL",
  "EXTC",
  "CIVIL",
];

const YEAR_VALUES: AcademicYear[] = [
  "FIRST_YEAR",
  "SECOND_YEAR",
  "THIRD_YEAR",
  "FOURTH_YEAR",
];

const YEAR_LABELS: Record<AcademicYear, string> = {
  FIRST_YEAR: "First",
  SECOND_YEAR: "Second",
  THIRD_YEAR: "Third",
  FOURTH_YEAR: "Fourth",
};

type View =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; id: number }
  | { kind: "submissions"; id: number };

export function FacultyAptitudeTab() {
  const [view, setView] = useState<View>({ kind: "list" });

  if (view.kind === "create") {
    return (
      <AptitudeEditor
        mode="create"
        onDone={() => setView({ kind: "list" })}
        onCancel={() => setView({ kind: "list" })}
      />
    );
  }
  if (view.kind === "edit") {
    return (
      <AptitudeEditor
        mode="edit"
        testId={view.id}
        onDone={() => setView({ kind: "list" })}
        onCancel={() => setView({ kind: "list" })}
      />
    );
  }
  if (view.kind === "submissions") {
    return (
      <SubmissionsView
        testId={view.id}
        onBack={() => setView({ kind: "list" })}
      />
    );
  }
  return (
    <TestsList
      onCreate={() => setView({ kind: "create" })}
      onEdit={(id) => setView({ kind: "edit", id })}
      onSubmissions={(id) => setView({ kind: "submissions", id })}
    />
  );
}

// ==================== LIST ====================

function TestsList({
  onCreate,
  onEdit,
  onSubmissions,
}: {
  onCreate: () => void;
  onEdit: (id: number) => void;
  onSubmissions: (id: number) => void;
}) {
  const [tests, setTests] = useState<AptitudeTestSummary[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    try {
      setTests(await facultyListTests());
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatus = async (id: number, status: TestStatus) => {
    setBusyId(id);
    try {
      await setTestStatus(id, status);
      toast.success(`Test ${status.toLowerCase()}`);
      await load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this test? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await deleteAptitudeTest(id);
      toast.success("Test deleted");
      await load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          {tests ? `${tests.length} test${tests.length === 1 ? "" : "s"}` : "Loading…"}
        </p>
        <Button onClick={onCreate} size="sm">
          <Plus className="h-4 w-4" /> New test
        </Button>
      </div>

      {tests === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-neutral-200 bg-white"
            />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <Brain className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-neutral-900">
            No tests yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-neutral-500">
            Create your first aptitude test or homework assignment for your
            department.
          </p>
          <Button className="mt-4" size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4" /> Create test
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {tests.map((t) => (
            <li
              key={t.id}
              className="rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {t.title}
                    </h3>
                    <StatusChip status={t.status} />
                    {t.isHomework && (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                        Homework
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                      {TEST_CATEGORY_LABELS[t.category]}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                    {t.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
                    <span>
                      {t._count.questions} Q · {t.totalMarks} marks
                    </span>
                    <span>{t.totalTime} min</span>
                    <span>Min {t.minimumMarks}</span>
                    <span>{t.allowedAttempts} attempt(s)</span>
                    <span>
                      Dept: {t.department ? departmentLabel(t.department) : "All"}
                    </span>
                    <span>
                      Years:{" "}
                      {t.eligibleYears.length === 0
                        ? "All"
                        : t.eligibleYears.map((y) => YEAR_LABELS[y as AcademicYear]).join(", ")}
                    </span>
                    <span>{t._count.submissions} submissions</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSubmissions(t.id)}
                  >
                    <Eye className="h-3.5 w-3.5" /> Submissions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(t.id)}
                    disabled={busyId === t.id}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  {t.status === "DRAFT" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatus(t.id, "PUBLISHED")}
                      disabled={busyId === t.id}
                    >
                      <Check className="h-3.5 w-3.5" /> Publish
                    </Button>
                  )}
                  {t.status === "PUBLISHED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatus(t.id, "ARCHIVED")}
                      disabled={busyId === t.id}
                    >
                      <Archive className="h-3.5 w-3.5" /> Archive
                    </Button>
                  )}
                  {t.status === "ARCHIVED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatus(t.id, "DRAFT")}
                      disabled={busyId === t.id}
                    >
                      <FileText className="h-3.5 w-3.5" /> Reopen
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(t.id)}
                    disabled={busyId === t.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: TestStatus }) {
  const cls =
    status === "PUBLISHED"
      ? "bg-green-50 text-green-700 ring-green-200"
      : status === "DRAFT"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-neutral-100 text-neutral-600 ring-neutral-200";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  );
}

// ==================== EDITOR ====================

type EditorState = Omit<CreateTestInput, "questions" | "sections"> & {
  questions: AptitudeQuestion[];
  sections: AptitudeSection[];
};

const blankQuestion = (): AptitudeQuestion => ({
  question: "",
  option1: "",
  option2: "",
  option3: "",
  option4: "",
  correctOption: "1",
  marks: 1,
});

const initialState = (): EditorState => ({
  title: "",
  description: "",
  rules: [],
  totalTime: 30,
  minimumMarks: 0,
  allowedAttempts: 1,
  tabSwitchLimit: 3,
  category: "APTITUDE",
  isHomework: false,
  department: null,
  eligibleYears: [],
  questions: [blankQuestion()],
  sections: [],
});

function AptitudeEditor({
  mode,
  testId,
  onDone,
  onCancel,
}: {
  mode: "create" | "edit";
  testId?: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, setState] = useState<EditorState>(initialState);
  const [rulesText, setRulesText] = useState("");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !testId) return;
    (async () => {
      try {
        const t = await facultyGetTest(testId);
        setState({
          title: t.title,
          description: t.description,
          rules: t.rules,
          totalTime: t.totalTime,
          minimumMarks: t.minimumMarks,
          allowedAttempts: t.allowedAttempts,
          tabSwitchLimit: t.tabSwitchLimit,
          category: t.category,
          isHomework: t.isHomework,
          department: t.department,
          eligibleYears: t.eligibleYears,
          sections: (t.sections ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            order: s.order,
            timeLimit: s.timeLimit,
          })),
          questions: t.questions.map((q) => ({
            id: q.id,
            question: q.question,
            option1: q.option1,
            option2: q.option2 ?? "",
            option3: q.option3 ?? "",
            option4: q.option4 ?? "",
            correctOption: q.correctOption,
            marks: q.marks,
          })),
        });
        setRulesText(t.rules.join("\n"));
      } catch (e) {
        toast.error(extractErrorMessage(e));
        onCancel();
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, testId, onCancel]);

  const totalMarks = useMemo(
    () => state.questions.reduce((s, q) => s + (Number(q.marks) || 0), 0),
    [state.questions]
  );

  const updateQuestion = (
    idx: number,
    patch: Partial<AptitudeQuestion>
  ) => {
    setState((s) => ({
      ...s,
      questions: s.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    }));
  };

  const addQuestion = () =>
    setState((s) => ({ ...s, questions: [...s.questions, blankQuestion()] }));
  const removeQuestion = (idx: number) =>
    setState((s) => ({
      ...s,
      questions:
        s.questions.length <= 1
          ? s.questions
          : s.questions.filter((_, i) => i !== idx),
    }));

  const handleSave = async () => {
    if (!state.title.trim() || !state.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    if (state.questions.length === 0) {
      toast.error("At least one question is required");
      return;
    }
    for (const [i, q] of state.questions.entries()) {
      if (!q.question.trim() || !q.option1.trim()) {
        toast.error(`Question ${i + 1}: text and option 1 are required`);
        return;
      }
      if (!q.marks || q.marks <= 0) {
        toast.error(`Question ${i + 1}: marks must be positive`);
        return;
      }
    }

    const rules = rulesText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    const payload: CreateTestInput = {
      ...state,
      rules,
      sections: state.sections.map((s, idx) => ({
        name: s.name,
        description: s.description,
        order: idx,
        timeLimit: s.timeLimit ?? null,
      })),
      questions: state.questions.map((q) => ({
        sectionId: q.sectionId ?? null,
        question: q.question,
        option1: q.option1,
        option2: q.option2 || null,
        option3: q.option3 || null,
        option4: q.option4 || null,
        correctOption: q.correctOption,
        marks: q.marks,
      })),
    };

    setSaving(true);
    try {
      if (mode === "create") {
        await createAptitudeTest(payload);
        toast.success("Test created as draft");
      } else if (testId) {
        await updateAptitudeTest(testId, payload);
        toast.success("Test updated");
      }
      onDone();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-96 animate-pulse rounded-lg bg-white" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to tests
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : mode === "create" ? "Create test" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-neutral-900">Basic info</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <Input
              value={state.title}
              onChange={(e) => setState({ ...state, title: e.target.value })}
              placeholder="e.g. Quant round — Sept 2026"
            />
          </Field>
          <Field label="Category">
            <select
              value={state.category}
              onChange={(e) =>
                setState({
                  ...state,
                  category: e.target.value as EditorState["category"],
                })
              }
              className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
            >
              {Object.entries(TEST_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea
              value={state.description}
              onChange={(e) =>
                setState({ ...state, description: e.target.value })
              }
              className="min-h-20 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              placeholder="Context for students…"
            />
          </Field>
          <Field label="Rules (one per line)" className="sm:col-span-2">
            <textarea
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              className="min-h-20 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              placeholder={"No tab switching\nCalculators not allowed"}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-neutral-900">Settings</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Total time (min)">
            <Input
              type="number"
              min={0}
              value={state.totalTime}
              onChange={(e) =>
                setState({ ...state, totalTime: Number(e.target.value) || 0 })
              }
            />
          </Field>
          <Field label="Minimum marks">
            <Input
              type="number"
              min={0}
              value={state.minimumMarks}
              onChange={(e) =>
                setState({
                  ...state,
                  minimumMarks: Number(e.target.value) || 0,
                })
              }
            />
          </Field>
          <Field label="Allowed attempts">
            <Input
              type="number"
              min={1}
              max={10}
              value={state.allowedAttempts}
              onChange={(e) =>
                setState({
                  ...state,
                  allowedAttempts: Number(e.target.value) || 1,
                })
              }
            />
          </Field>
          <Field label="Tab switch limit">
            <Input
              type="number"
              min={0}
              value={state.tabSwitchLimit}
              onChange={(e) =>
                setState({
                  ...state,
                  tabSwitchLimit: Number(e.target.value) || 0,
                })
              }
            />
          </Field>
          <Field label="Department (optional)">
            <select
              value={state.department ?? ""}
              onChange={(e) =>
                setState({
                  ...state,
                  department: (e.target.value || null) as Department | null,
                })
              }
              className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
            >
              <option value="">All departments</option>
              {DEPARTMENT_VALUES.map((d) => (
                <option key={d} value={d}>
                  {departmentLabel(d)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Homework?">
            <label className="flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm">
              <input
                type="checkbox"
                checked={state.isHomework}
                onChange={(e) =>
                  setState({ ...state, isHomework: e.target.checked })
                }
              />
              <span className="text-neutral-700">
                {state.isHomework ? "Homework" : "Aptitude test"}
              </span>
            </label>
          </Field>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-neutral-700">
            Eligible years (leave empty for all)
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {YEAR_VALUES.map((y) => {
              const on = state.eligibleYears.includes(y);
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      eligibleYears: on
                        ? s.eligibleYears.filter((v) => v !== y)
                        : [...s.eligibleYears, y],
                    }))
                  }
                  className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                    on
                      ? "bg-neutral-900 text-white ring-neutral-900"
                      : "bg-white text-neutral-700 ring-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {YEAR_LABELS[y]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-neutral-900">Sections (optional)</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setState((s) => ({
                ...s,
                sections: [
                  ...s.sections,
                  { name: "", description: "", order: s.sections.length, timeLimit: null },
                ],
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" /> Add section
          </Button>
        </div>
        {state.sections.length === 0 ? (
          <p className="mt-3 text-xs text-neutral-500">
            No sections — all questions will be in a single unlabelled group. Add sections to organise questions (e.g. "Section A: Verbal", "Section B: Quant").
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {state.sections.map((sec, idx) => (
              <li key={idx} className="flex items-start gap-2 rounded-md border border-neutral-200 p-3">
                <span className="mt-1.5 text-xs font-semibold text-neutral-400 w-5">{idx + 1}</span>
                <div className="flex-1 grid gap-2 sm:grid-cols-3">
                  <Field label="Section name" className="sm:col-span-2">
                    <Input
                      value={sec.name}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          sections: s.sections.map((v, i) =>
                            i === idx ? { ...v, name: e.target.value } : v
                          ),
                        }))
                      }
                      placeholder="e.g. Section A: Verbal"
                    />
                  </Field>
                  <Field label="Time limit (min, optional)">
                    <Input
                      type="number"
                      min={0}
                      value={sec.timeLimit ?? ""}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          sections: s.sections.map((v, i) =>
                            i === idx
                              ? { ...v, timeLimit: e.target.value ? Number(e.target.value) : null }
                              : v
                          ),
                        }))
                      }
                      placeholder="None"
                    />
                  </Field>
                </div>
                <button
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      sections: s.sections.filter((_, i) => i !== idx),
                    }))
                  }
                  className="mt-1 text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Questions</h3>
            <p className="text-xs text-neutral-500">
              Total marks: {totalMarks} · {state.questions.length} question
              {state.questions.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="h-3.5 w-3.5" /> Add question
          </Button>
        </div>
        <ol className="mt-4 space-y-4">
          {state.questions.map((q, idx) => (
            <li
              key={idx}
              className="rounded-md border border-neutral-200 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Q{idx + 1}
                </span>
                {state.questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(idx)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="mt-2 space-y-3">
                {state.sections.length > 0 && (
                  <Field label="Section">
                    <select
                      value={q.sectionId ?? ""}
                      onChange={(e) =>
                        updateQuestion(idx, { sectionId: e.target.value || null })
                      }
                      className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
                    >
                      <option value="">No section</option>
                      {state.sections.map((s, si) => (
                        <option key={si} value={`section:${si}`}>
                          {s.name || `Section ${si + 1}`}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label="Question">
                  <textarea
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(idx, { question: e.target.value })
                    }
                    className="min-h-16 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["1", "option1"],
                      ["2", "option2"],
                      ["3", "option3"],
                      ["4", "option4"],
                    ] as const
                  ).map(([num, key]) => (
                    <label
                      key={num}
                      className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2"
                    >
                      <input
                        type="radio"
                        name={`correct-${idx}`}
                        checked={q.correctOption === num}
                        onChange={() =>
                          updateQuestion(idx, {
                            correctOption: num as OptionNumber,
                          })
                        }
                      />
                      <span className="w-5 text-xs font-semibold text-neutral-500">
                        {num}
                      </span>
                      <input
                        value={(q[key] as string) ?? ""}
                        onChange={(e) =>
                          updateQuestion(idx, {
                            [key]: e.target.value,
                          } as Partial<AptitudeQuestion>)
                        }
                        placeholder={`Option ${num}${num !== "1" ? " (optional)" : ""}`}
                        className="flex-1 bg-transparent text-sm outline-none"
                      />
                    </label>
                  ))}
                </div>
                <Field label="Marks" className="w-24">
                  <Input
                    type="number"
                    min={1}
                    value={q.marks}
                    onChange={(e) =>
                      updateQuestion(idx, {
                        marks: Number(e.target.value) || 1,
                      })
                    }
                  />
                </Field>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-medium text-neutral-700">
        {label}
      </span>
      {children}
    </label>
  );
}

// ==================== SUBMISSIONS ====================

function SubmissionsView({
  testId,
  onBack,
}: {
  testId: number;
  onBack: () => void;
}) {
  const [data, setData] = useState<{
    items: SubmissionRecord[];
    test: AptitudeTestFull;
  } | null>(null);
  const [reviewing, setReviewing] = useState<SubmissionRecord | null>(null);

  const load = async () => {
    try {
      setData(await listTestSubmissions(testId));
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  useEffect(() => {
    load();
  }, [testId]);

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tests
      </button>

      {!data ? (
        <div className="h-40 animate-pulse rounded-lg bg-white" />
      ) : (
        <>
          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-neutral-900">
              {data.test.title}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              {data.items.length} submission
              {data.items.length === 1 ? "" : "s"} · {data.test.totalMarks}{" "}
              total marks · min {data.test.minimumMarks}
            </p>
          </div>

          {data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                <FileText className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-medium text-neutral-900">
                No submissions yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Attempt</th>
                    <th className="px-5 py-3">Auto</th>
                    <th className="px-5 py-3">Final</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Tab switches</th>
                    <th className="px-5 py-3">Submitted</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.items.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-neutral-900">
                          {s.student?.fullName ?? "—"}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {s.student?.studentId ?? s.student?.emailId ?? ""}
                        </div>
                      </td>
                      <td className="px-5 py-3">#{s.attemptNumber}</td>
                      <td className="px-5 py-3">
                        {s.autoScore ?? "—"} / {data.test.totalMarks}
                      </td>
                      <td className="px-5 py-3">
                        {s.finalScore ?? "—"} / {data.test.totalMarks}
                      </td>
                      <td className="px-5 py-3">
                        {SUBMISSION_STATUS_LABELS[s.status]}
                      </td>
                      <td className="px-5 py-3">{s.tabSwitchCount}</td>
                      <td className="px-5 py-3 text-xs text-neutral-500">
                        {s.submittedAt
                          ? new Date(s.submittedAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewing(s)}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {reviewing && data && (
        <ReviewDialog
          submission={reviewing}
          test={data.test}
          onClose={() => setReviewing(null)}
          onSaved={async () => {
            setReviewing(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function ReviewDialog({
  submission,
  test,
  onClose,
  onSaved,
}: {
  submission: SubmissionRecord;
  test: AptitudeTestFull;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [finalScore, setFinalScore] = useState<number>(
    submission.finalScore ?? submission.autoScore ?? 0
  );
  const [remarks, setRemarks] = useState(submission.facultyRemarks ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (finalScore > test.totalMarks) {
      toast.error("Score exceeds total marks");
      return;
    }
    setSaving(true);
    try {
      await reviewSubmission(submission.id, finalScore, remarks);
      toast.success("Submission reviewed");
      onSaved();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              Review submission
            </h3>
            <p className="text-xs text-neutral-500">
              {submission.student?.fullName} · Attempt #{submission.attemptNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-neutral-50 px-3 py-2">
            <p className="text-[11px] uppercase text-neutral-500">Auto score</p>
            <p className="text-sm font-semibold text-neutral-900">
              {submission.autoScore ?? "—"} / {test.totalMarks}
            </p>
          </div>
          <div className="rounded-md bg-neutral-50 px-3 py-2">
            <p className="text-[11px] uppercase text-neutral-500">Tab switches</p>
            <p className="text-sm font-semibold text-neutral-900">
              {submission.tabSwitchCount}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {test.questions.map((q, idx) => {
            const picked = submission.answers[String(q.id)];
            const correct = q.correctOption;
            return (
              <div
                key={q.id}
                className="rounded-md border border-neutral-200 p-3 text-sm"
              >
                <p className="font-medium text-neutral-900">
                  Q{idx + 1}. {q.question}
                </p>
                <ul className="mt-2 space-y-1 text-[13px]">
                  {(["1", "2", "3", "4"] as OptionNumber[]).map((n) => {
                    const label = (q as Record<string, unknown>)[
                      `option${n}`
                    ] as string | null;
                    if (!label) return null;
                    const isPicked = picked === n;
                    const isCorrect = correct === n;
                    return (
                      <li
                        key={n}
                        className={`flex items-center gap-2 rounded px-2 py-1 ${
                          isCorrect
                            ? "bg-green-50 text-green-700"
                            : isPicked
                              ? "bg-red-50 text-red-700"
                              : "text-neutral-600"
                        }`}
                      >
                        <span className="font-semibold">{n}.</span>
                        <span>{label}</span>
                        {isCorrect && (
                          <span className="ml-auto text-[11px] font-semibold">
                            Correct
                          </span>
                        )}
                        {isPicked && !isCorrect && (
                          <span className="ml-auto text-[11px] font-semibold">
                            Chose
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Final score">
            <Input
              type="number"
              min={0}
              max={test.totalMarks}
              value={finalScore}
              onChange={(e) => setFinalScore(Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Remarks (optional)">
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="min-h-16 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save review"}
          </Button>
        </div>
      </div>
    </div>
  );
}
