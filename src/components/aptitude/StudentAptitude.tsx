"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Brain,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
  FileText,
  Camera,
  CameraOff,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/api/base";
import {
  studentListAvailableTests,
  studentStartTest,
  studentSubmitTest,
  studentGetMyResult,
  reportViolation,
  TEST_CATEGORY_LABELS,
  type StudentAvailableTest,
  type StartedTest,
  type ActiveSubmission,
  type OptionNumber,
  type SubmissionResult,
} from "@/lib/api/aptitude";

const MAX_VIOLATIONS = 3;

type View =
  | { kind: "list" }
  | { kind: "taking"; test: StartedTest; submission: ActiveSubmission }
  | { kind: "result"; submissionId: string };

export function StudentAptitudeView() {
  const [view, setView] = useState<View>({ kind: "list" });

  if (view.kind === "taking") {
    return (
      <TakeTest
        test={view.test}
        submission={view.submission}
        onSubmitted={(id) => setView({ kind: "result", submissionId: id })}
        onAbort={() => setView({ kind: "list" })}
      />
    );
  }
  if (view.kind === "result") {
    return (
      <ResultView
        submissionId={view.submissionId}
        onBack={() => setView({ kind: "list" })}
      />
    );
  }
  return (
    <TestsList
      onStart={(test, submission) => setView({ kind: "taking", test, submission })}
      onOpenResult={(id) => setView({ kind: "result", submissionId: id })}
    />
  );
}

// ==================== LIST ====================

function TestsList({
  onStart,
  onOpenResult,
}: {
  onStart: (test: StartedTest, submission: ActiveSubmission) => void;
  onOpenResult: (submissionId: string) => void;
}) {
  const [items, setItems] = useState<StudentAvailableTest[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setItems(await studentListAvailableTests());
      } catch (e) {
        toast.error(extractErrorMessage(e));
      }
    })();
  }, []);

  const handleStart = async (testId: number) => {
    setBusyId(testId);
    try {
      const data = await studentStartTest(testId);
      onStart(data.test, data.submission);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  if (items === null) {
    return (
      <div className="mx-auto max-w-4xl space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg border border-neutral-200 bg-white" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <Brain className="h-5 w-5 text-neutral-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-neutral-900">No tests available</h2>
          <p className="mt-1 max-w-md text-sm text-neutral-500">
            Aptitude tests and homework published by faculty will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {items.map((t) => {
        const attemptsUsed = t.mySubmissions.filter((s) => s.status !== "IN_PROGRESS").length;
        const inProgress = t.mySubmissions.find((s) => s.status === "IN_PROGRESS");
        const latestDone = t.mySubmissions.find((s) => s.status !== "IN_PROGRESS");
        const canStart = attemptsUsed < t.allowedAttempts;
        return (
          <div key={t.id} className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">{t.title}</h3>
                  {t.isHomework && (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                      Homework
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                    {TEST_CATEGORY_LABELS[t.category]}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-inset ring-red-200">
                    <Camera className="h-3 w-3" /> Proctored
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-600">{t.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {t.totalTime} min
                  </span>
                  <span>{t._count.questions} Q · {t.totalMarks} marks</span>
                  <span>Min {t.minimumMarks}</span>
                  <span>Attempts {attemptsUsed} / {t.allowedAttempts}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {latestDone && (
                  <Button variant="outline" size="sm" onClick={() => onOpenResult(latestDone.id)}>
                    <FileText className="h-3.5 w-3.5" /> View result
                  </Button>
                )}
                {inProgress ? (
                  <Button size="sm" onClick={() => handleStart(t.id)} disabled={busyId === t.id}>
                    <RotateCcw className="h-3.5 w-3.5" /> Resume
                  </Button>
                ) : canStart ? (
                  <Button size="sm" onClick={() => handleStart(t.id)} disabled={busyId === t.id}>
                    Start test
                  </Button>
                ) : (
                  <span className="text-xs text-neutral-500">No attempts left</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== TAKE TEST (PROCTORED) ====================

function TakeTest({
  test,
  submission,
  onSubmitted,
  onAbort,
}: {
  test: StartedTest;
  submission: ActiveSubmission;
  onSubmitted: (submissionId: string) => void;
  onAbort: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, OptionNumber>>(() => submission.answers ?? {});
  const [tabSwitches, setTabSwitches] = useState(submission.tabSwitchCount ?? 0);
  const [violations, setViolations] = useState(0);
  const [violationMsg, setViolationMsg] = useState<string | null>(null);
  const [cameraOk, setCameraOk] = useState<boolean | null>(null); // null = requesting
  const [remaining, setRemaining] = useState<number>(() => {
    const deadline = new Date(submission.startedAt).getTime() + test.totalTime * 60 * 1000;
    return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  });
  const [submitting, setSubmitting] = useState(false);
  const [disqualified, setDisqualified] = useState(false);

  const submittedRef = useRef(false);
  const tabSwitchesRef = useRef(tabSwitches);
  const answersRef = useRef(answers);
  const violationsRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const devtoolsCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coverCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { tabSwitchesRef.current = tabSwitches; }, [tabSwitches]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const totalSeconds = test.totalTime * 60;
  const timerEnabled = test.totalTime > 0;

  const doSubmit = useCallback(
    async (silent = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      // Release camera
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (devtoolsCheckRef.current) clearInterval(devtoolsCheckRef.current);
      if (coverCheckRef.current) clearInterval(coverCheckRef.current);
      try {
        const res = await studentSubmitTest(submission.id, answersRef.current, tabSwitchesRef.current);
        if (!silent) toast.success(`Submitted · Auto score ${res.autoScore} / ${res.totalMarks}`);
        onSubmitted(submission.id);
      } catch (e) {
        submittedRef.current = false;
        toast.error(extractErrorMessage(e));
      } finally {
        setSubmitting(false);
      }
    },
    [submission.id, onSubmitted]
  );

  const recordViolation = useCallback(
    async (reason: string) => {
      violationsRef.current += 1;
      const count = violationsRef.current;
      setViolations(count);
      setViolationMsg(`⚠ ${reason} — Warning ${count} / ${MAX_VIOLATIONS}`);

      try {
        const res = await reportViolation(submission.id);
        if (res.disqualified) {
          setDisqualified(true);
          setViolationMsg("You have been disqualified due to repeated violations. Submitting…");
          setTimeout(() => doSubmit(true), 2000);
        }
      } catch {
        // best-effort
      }
    },
    [submission.id, doSubmit]
  );

  // Request camera on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => null);
        }
        setCameraOk(true);
      } catch {
        setCameraOk(false);
        recordViolation("Camera access denied");
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Camera coverage detection — sample video frame brightness every 3s
  useEffect(() => {
    const check = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !streamRef.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 40;
      canvas.height = 30;
      try {
        ctx.drawImage(video, 0, 0, 40, 30);
        const data = ctx.getImageData(0, 0, 40, 30).data;
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const avg = total / (data.length / 4);
        if (avg < 10) {
          recordViolation("Camera appears to be covered");
        }
      } catch {
        // cross-origin or permissions error — ignore
      }
    };
    coverCheckRef.current = setInterval(check, 3000);
    return () => { if (coverCheckRef.current) clearInterval(coverCheckRef.current); };
  }, [recordViolation]);

  // DevTools detection — check window size discrepancy every 1.5s
  useEffect(() => {
    let wasOpen = false;
    const check = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      const isOpen = widthThreshold || heightThreshold;
      if (isOpen && !wasOpen) {
        wasOpen = true;
        recordViolation("Developer tools detected");
      } else if (!isOpen) {
        wasOpen = false;
      }
    };
    devtoolsCheckRef.current = setInterval(check, 1500);
    return () => { if (devtoolsCheckRef.current) clearInterval(devtoolsCheckRef.current); };
  }, [recordViolation]);

  // Countdown timer
  useEffect(() => {
    if (!timerEnabled) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(interval); doSubmit(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerEnabled, doSubmit]);

  // Tab-switch / visibility detection
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        setTabSwitches((n) => {
          const next = n + 1;
          if (next > test.tabSwitchLimit) {
            doSubmit(true);
          }
          return next;
        });
        recordViolation("Tab / window switch detected");
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [test.tabSwitchLimit, doSubmit, recordViolation]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (devtoolsCheckRef.current) clearInterval(devtoolsCheckRef.current);
      if (coverCheckRef.current) clearInterval(coverCheckRef.current);
    };
  }, []);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Hidden canvas for camera brightness check */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Sticky header */}
      <div className="sticky top-0 z-20 -mx-6 border-b border-neutral-200 bg-white px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">{test.title}</h2>
            <p className="text-[11px] text-neutral-500">
              {answeredCount} / {test.questions.length} answered · Tab switches: {tabSwitches} / {test.tabSwitchLimit} · Violations: {violations} / {MAX_VIOLATIONS}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Camera indicator */}
            <div className={`relative overflow-hidden rounded-md border ${cameraOk ? "border-green-300" : "border-red-300"}`}>
              {cameraOk ? (
                <video ref={videoRef} autoPlay muted playsInline className="h-12 w-16 object-cover" />
              ) : (
                <div className="flex h-12 w-16 items-center justify-center bg-red-50">
                  <CameraOff className="h-5 w-5 text-red-500" />
                </div>
              )}
              <div className={`absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full ${cameraOk ? "bg-green-500" : "bg-red-500"}`} />
            </div>

            {timerEnabled && (
              <div className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-sm font-semibold ${remaining < 60 ? "bg-red-50 text-red-700" : "bg-neutral-100 text-neutral-900"}`}>
                <Clock className="h-4 w-4" />
                {formatTime(remaining)}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Leave test? Your progress is saved and you can resume later.")) {
                  streamRef.current?.getTracks().forEach((t) => t.stop());
                  onAbort();
                }
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Exit
            </Button>
            <Button size="sm" onClick={() => { if (confirm("Submit test now?")) doSubmit(); }} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </div>
      </div>

      {/* Violation warning banner */}
      {violationMsg && (
        <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${disqualified ? "border-red-400 bg-red-50 text-red-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
          <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{violationMsg}</p>
        </div>
      )}

      {/* Camera warning */}
      {cameraOk === false && (
        <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
          <CameraOff className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>Camera access was denied. This is a proctored test — camera is required. A violation has been recorded.</p>
        </div>
      )}

      {/* Proctoring notice */}
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
        <p>
          This is a proctored test. Your camera is active. Do not cover the camera, open developer tools, or switch tabs/windows. After {MAX_VIOLATIONS} violations your test will be auto-submitted and marked disqualified.
        </p>
      </div>

      {test.rules.length > 0 && (
        <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Rules</p>
          <ul className="list-disc space-y-1 pl-5 text-neutral-700">
            {test.rules.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      <ol className="space-y-4">
        {test.questions.map((q, idx) => (
          <li key={q.id} className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold text-neutral-900">Q{idx + 1}. {q.question}</p>
              <span className="ml-3 text-[11px] text-neutral-500">{q.marks} mark{q.marks === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-3 space-y-2">
              {(["1", "2", "3", "4"] as OptionNumber[]).map((n) => {
                const label = (q as unknown as Record<string, unknown>)[`option${n}`] as string | null;
                if (!label) return null;
                const picked = answers[String(q.id)] === n;
                return (
                  <label
                    key={n}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${picked ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 hover:bg-neutral-50"}`}
                  >
                    <input
                      type="radio"
                      className="accent-white"
                      checked={picked}
                      onChange={() => setAnswers((a) => ({ ...a, [String(q.id)]: n }))}
                      disabled={disqualified}
                    />
                    <span className="font-semibold">{n}.</span>
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex justify-end">
        <Button onClick={() => { if (confirm("Submit test now?")) doSubmit(); }} disabled={submitting || disqualified}>
          {submitting ? "Submitting…" : "Submit test"}
        </Button>
      </div>

      {timerEnabled && (
        <p className="text-center text-[11px] text-neutral-500">
          Time limit: {test.totalTime} min · Total marks: {test.totalMarks} ·{" "}
          Elapsed: {Math.min(100, Math.round(((totalSeconds - remaining) / totalSeconds) * 100))}%
        </p>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ==================== RESULT ====================

function ResultView({ submissionId, onBack }: { submissionId: string; onBack: () => void }) {
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setSubmission(await studentGetMyResult(submissionId));
      } catch (e) {
        toast.error(extractErrorMessage(e));
      }
    })();
  }, [submissionId]);

  if (!submission) {
    return <div className="mx-auto h-48 max-w-3xl animate-pulse rounded-lg bg-white" />;
  }

  const score = submission.finalScore ?? submission.autoScore ?? 0;
  const passed = score >= submission.test.minimumMarks;
  const isReviewed = submission.status === "REVIEWED";
  const isDisqualified = submission.status === "DISQUALIFIED";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" /> Back to tests
      </button>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">{submission.test.title}</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Status: {submission.status}
              {submission.submittedAt && ` · Submitted ${new Date(submission.submittedAt).toLocaleString()}`}
            </p>
          </div>
          <div className={`rounded-md px-3 py-2 text-right ${isDisqualified ? "bg-red-50 text-red-700" : passed ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-700"}`}>
            <p className="text-[11px] uppercase">{isReviewed ? "Final score" : "Auto score"}</p>
            <p className="text-lg font-bold">{isDisqualified ? "DQ" : `${score} / ${submission.test.totalMarks}`}</p>
          </div>
        </div>

        {isDisqualified && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            <ShieldAlert className="h-4 w-4" />
            This submission was disqualified due to proctoring violations.
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Auto score" value={`${submission.autoScore ?? 0}`} />
          <Stat label="Final score" value={submission.finalScore === null ? "Pending" : `${submission.finalScore}`} />
          <Stat label="Tab switches" value={`${submission.tabSwitchCount}`} />
        </div>

        {submission.facultyRemarks && (
          <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm">
            <p className="text-[11px] font-semibold uppercase text-neutral-500">Faculty remarks</p>
            <p className="mt-1 text-neutral-800">{submission.facultyRemarks}</p>
          </div>
        )}

        {!isReviewed && !isDisqualified && (
          <p className="mt-4 inline-flex items-center gap-1 text-xs text-neutral-500">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Auto-graded. Final score will be updated once faculty reviews.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-neutral-200 px-3 py-2">
      <p className="text-[11px] uppercase text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
