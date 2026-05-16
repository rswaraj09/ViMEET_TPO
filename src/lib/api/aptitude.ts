import { api } from "./base";
import type { AcademicYear, Department } from "./student";

export type TestCategory = "APTITUDE" | "TECHNICAL" | "BEHAVIORAL";
export type TestStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type SubmissionStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVIEWED"
  | "DISQUALIFIED";
export type OptionNumber = "1" | "2" | "3" | "4";

export const TEST_CATEGORY_LABELS: Record<TestCategory, string> = {
  APTITUDE: "Aptitude",
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  REVIEWED: "Reviewed",
  DISQUALIFIED: "Disqualified",
};

export interface AptitudeSection {
  id?: string;
  name: string;
  description?: string;
  order: number;
  timeLimit?: number | null;
}

export interface AptitudeQuestion {
  id?: number;
  sectionId?: string | null;
  question: string;
  option1: string;
  option2?: string | null;
  option3?: string | null;
  option4?: string | null;
  correctOption: OptionNumber;
  marks: number;
}

export interface AptitudeQuestionSafe {
  id: number;
  question: string;
  option1: string;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  marks: number;
}

export interface AptitudeTestSummary {
  id: number;
  title: string;
  description: string;
  category: TestCategory;
  totalTime: number;
  totalMarks: number;
  minimumMarks: number;
  allowedAttempts: number;
  tabSwitchLimit: number;
  status: TestStatus;
  isActive: boolean;
  isHomework: boolean;
  department: Department | null;
  eligibleYears: AcademicYear[];
  createdAt: string;
  updatedAt: string;
  createdById: number;
  _count: { questions: number; submissions: number };
  sections?: AptitudeSection[];
}

export interface AptitudeTestFull extends AptitudeTestSummary {
  rules: string[];
  questions: Array<{
    id: number;
    question: string;
    option1: string;
    option2: string | null;
    option3: string | null;
    option4: string | null;
    correctOption: OptionNumber;
    marks: number;
  }>;
}

export interface MySubmissionSummary {
  id: string;
  testId: number;
  attemptNumber: number;
  status: SubmissionStatus;
  autoScore: number | null;
  finalScore: number | null;
  submittedAt: string | null;
}

export interface StudentAvailableTest extends AptitudeTestSummary {
  mySubmissions: MySubmissionSummary[];
}

export interface StartedTest {
  id: number;
  title: string;
  description: string;
  rules: string[];
  totalTime: number;
  totalMarks: number;
  tabSwitchLimit: number;
  isHomework: boolean;
  questions: AptitudeQuestionSafe[];
}

export interface ActiveSubmission {
  id: string;
  startedAt: string;
  attemptNumber: number;
  answers: Record<string, OptionNumber>;
  tabSwitchCount: number;
}

export interface SubmissionRecord {
  id: string;
  testId: number;
  studentId: number;
  attemptNumber: number;
  status: SubmissionStatus;
  answers: Record<string, OptionNumber>;
  autoScore: number | null;
  finalScore: number | null;
  facultyRemarks: string | null;
  tabSwitchCount: number;
  startedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedById: number | null;
  student?: {
    id: number;
    fullName: string;
    emailId: string;
    studentId: string | null;
    department: Department | null;
    academicYear: AcademicYear | null;
  };
}

export interface SubmissionResult {
  id: string;
  testId: number;
  status: SubmissionStatus;
  autoScore: number | null;
  finalScore: number | null;
  facultyRemarks: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  tabSwitchCount: number;
  answers: Record<string, OptionNumber>;
  test: { title: string; totalMarks: number; minimumMarks: number };
}

export interface CreateTestInput {
  title: string;
  description: string;
  rules: string[];
  totalTime: number;
  minimumMarks: number;
  allowedAttempts: number;
  tabSwitchLimit: number;
  category: TestCategory;
  isHomework: boolean;
  department: Department | null;
  eligibleYears: AcademicYear[];
  questions: AptitudeQuestion[];
  sections: AptitudeSection[];
}

export const reportViolation = async (
  submissionId: string
): Promise<{ violations: number; disqualified: boolean; maxViolations: number }> => {
  const res = await api.post<{ violations: number; disqualified: boolean; maxViolations: number }>(
    `/aptitude/student/submissions/${submissionId}/violation`
  );
  return res.data;
};

// =============== Faculty ===============

export const facultyListTests = async (): Promise<AptitudeTestSummary[]> => {
  const res = await api.get<{ items: AptitudeTestSummary[] }>(
    "/aptitude/faculty/tests"
  );
  return res.data.items;
};

export const facultyGetTest = async (id: number): Promise<AptitudeTestFull> => {
  const res = await api.get<{ test: AptitudeTestFull }>(
    `/aptitude/faculty/tests/${id}`
  );
  return res.data.test;
};

export const createAptitudeTest = async (
  input: CreateTestInput
): Promise<AptitudeTestFull> => {
  const res = await api.post<{ test: AptitudeTestFull }>(
    "/aptitude/faculty/tests",
    input
  );
  return res.data.test;
};

export const updateAptitudeTest = async (
  id: number,
  input: Partial<CreateTestInput>
): Promise<AptitudeTestFull> => {
  const res = await api.patch<{ test: AptitudeTestFull }>(
    `/aptitude/faculty/tests/${id}`,
    input
  );
  return res.data.test;
};

export const setTestStatus = async (
  id: number,
  status: TestStatus
): Promise<AptitudeTestSummary> => {
  const res = await api.post<{ test: AptitudeTestSummary }>(
    `/aptitude/faculty/tests/${id}/status`,
    { status }
  );
  return res.data.test;
};

export const deleteAptitudeTest = async (id: number): Promise<void> => {
  await api.delete(`/aptitude/faculty/tests/${id}`);
};

export const listTestSubmissions = async (
  testId: number
): Promise<{ items: SubmissionRecord[]; test: AptitudeTestFull }> => {
  const res = await api.get<{
    items: SubmissionRecord[];
    test: AptitudeTestFull;
  }>(`/aptitude/faculty/tests/${testId}/submissions`);
  return res.data;
};

export const reviewSubmission = async (
  submissionId: string,
  finalScore: number,
  facultyRemarks?: string
): Promise<SubmissionRecord> => {
  const res = await api.post<{ submission: SubmissionRecord }>(
    `/aptitude/faculty/submissions/${submissionId}/review`,
    { finalScore, facultyRemarks }
  );
  return res.data.submission;
};

// =============== Student ===============

export const studentListAvailableTests = async (): Promise<
  StudentAvailableTest[]
> => {
  const res = await api.get<{ items: StudentAvailableTest[] }>(
    "/aptitude/student/tests"
  );
  return res.data.items;
};

export const studentStartTest = async (
  testId: number
): Promise<{ test: StartedTest; submission: ActiveSubmission }> => {
  const res = await api.post<{
    test: StartedTest;
    submission: ActiveSubmission;
  }>(`/aptitude/student/tests/${testId}/start`);
  return res.data;
};

export const studentSubmitTest = async (
  submissionId: string,
  answers: Record<string, OptionNumber>,
  tabSwitchCount: number
): Promise<{
  id: string;
  autoScore: number;
  totalMarks: number;
  submittedAt: string;
  status: SubmissionStatus;
}> => {
  const res = await api.post<{
    submission: {
      id: string;
      autoScore: number;
      totalMarks: number;
      submittedAt: string;
      status: SubmissionStatus;
    };
  }>(`/aptitude/student/submissions/${submissionId}/submit`, {
    answers,
    tabSwitchCount,
  });
  return res.data.submission;
};

export const studentGetMyResult = async (
  submissionId: string
): Promise<SubmissionResult> => {
  const res = await api.get<{ submission: SubmissionResult }>(
    `/aptitude/student/submissions/${submissionId}`
  );
  return res.data.submission;
};
