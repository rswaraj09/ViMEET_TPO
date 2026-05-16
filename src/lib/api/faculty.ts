import { api } from "./base";
import type { Department, AcademicYear, FieldDiff } from "./student";

export type VerificationEntityType = "PROFILE" | "MARKS" | "INTERNSHIP" | "ACHIEVEMENT" | "CERTIFICATE";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface FacultyStats {
  dept: Department;
  pending: {
    profileAndMarks: number;
    internships: number;
    achievements: number;
    certificates: number;
    total: number;
  };
  totalStudents: number;
  upcomingEvents: number;
}

export interface QueueStudentStub {
  id: number;
  fullName: string;
  emailId: string;
  studentId: string | null;
  department: Department | null;
  academicYear: AcademicYear | null;
  profilePic: string | null;
}

interface BaseQueueItem {
  id: string;
  entityType: VerificationEntityType;
  entityId: string | null;
  createdAt: string;
  student: QueueStudentStub;
}

export interface VerificationRequestItem extends BaseQueueItem {
  kind: "VERIFICATION_REQUEST";
  entityType: "PROFILE" | "MARKS";
  changes: Record<string, FieldDiff>;
}

export interface InternshipQueueItem extends BaseQueueItem {
  kind: "INTERNSHIP";
  entityType: "INTERNSHIP";
  data: {
    companyName: string;
    role: string;
    roleDescription: string | null;
    duration: string | null;
    startDate: string;
    endDate: string | null;
    certificateUrl: string | null;
    hrName: string | null;
    hrEmail: string | null;
    hrPhone: string | null;
  };
}

export interface AchievementQueueItem extends BaseQueueItem {
  kind: "ACHIEVEMENT";
  entityType: "ACHIEVEMENT";
  data: {
    title: string;
    description: string | null;
    category: string | null;
    certificateUrl: string | null;
    achievementDate: string | null;
  };
}

export interface CertificateQueueItem extends BaseQueueItem {
  kind: "CERTIFICATE";
  entityType: "CERTIFICATE";
  data: {
    title: string;
    issuingOrg: string;
    issueDate: string | null;
    expiryDate: string | null;
    credentialId: string | null;
    credentialUrl: string | null;
    certificateUrl: string | null;
  };
}

export type QueueItem =
  | VerificationRequestItem
  | InternshipQueueItem
  | AchievementQueueItem
  | CertificateQueueItem;

export interface DeptStudentListItem {
  id: number;
  fullName: string;
  legalName: string | null;
  emailId: string;
  contactNo: string | null;
  studentId: string | null;
  department: Department | null;
  academicYear: AcademicYear | null;
  avgCgpa: number | null;
  role: string;
  profilePic: string | null;
  resumeUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface DeptStudentListResponse {
  items: DeptStudentListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DeptStudentFilters {
  page?: number;
  limit?: number;
  academicYear?: AcademicYear;
  isVerified?: boolean;
  isActive?: boolean;
  minCgpa?: number;
  search?: string;
}

export interface DeptStudentDetail {
  user: DeptStudentListItem & {
    parentsContactNo: string | null;
    skills: string[];
    socialProfile: string | null;
    alumniProfile: {
      currentOrg: string | null;
      currentRole: string | null;
      package: string | null;
      graduationYear: number | null;
      placedBy: string | null;
    } | null;
  };
  marks: Record<string, unknown> | null;
  internships: Array<Record<string, unknown>>;
  achievements: Array<Record<string, unknown>>;
  certificates: Array<Record<string, unknown>>;
  pendingVerifications: Array<Record<string, unknown>>;
}

export interface DeptFacultyItem {
  id: number;
  fullName: string;
  emailId: string;
  contactNo: string | null;
  department: Department | null;
  isHOD: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export const getFacultyStats = async (): Promise<FacultyStats> => {
  const { data } = await api.get<FacultyStats>("/faculty/stats");
  return data;
};

export const listPendingVerifications = async (): Promise<QueueItem[]> => {
  const { data } = await api.get<{ items: QueueItem[] }>("/faculty/verifications");
  return data.items;
};

export const reviewVerificationRequest = async (
  id: string,
  payload: { status: "APPROVED" | "REJECTED"; remarks?: string }
): Promise<void> => {
  await api.post(`/faculty/verifications/${id}/review`, payload);
};

export const reviewInternship = async (
  id: string,
  payload: { isVerified: boolean; remarks?: string }
): Promise<void> => {
  await api.post(`/faculty/internships/${id}/review`, payload);
};

export const reviewAchievement = async (
  id: string,
  payload: { isVerified: boolean; remarks?: string }
): Promise<void> => {
  await api.post(`/faculty/achievements/${id}/review`, payload);
};

export const reviewCertificate = async (
  id: string,
  payload: { isVerified: boolean; remarks?: string }
): Promise<void> => {
  await api.post(`/faculty/certificates/${id}/review`, payload);
};

export const listDeptStudents = async (
  filters: DeptStudentFilters = {}
): Promise<DeptStudentListResponse> => {
  const params: Record<string, string | number | boolean> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      params[key] = value as string | number | boolean;
    }
  });
  const { data } = await api.get<DeptStudentListResponse>("/faculty/students", {
    params,
  });
  return data;
};

export interface AlumniListItem {
  id: number;
  fullName: string;
  emailId: string;
  studentId: string | null;
  department: Department | null;
  profilePic: string | null;
  resumeUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  alumniProfile: {
    currentOrg: string | null;
    currentRole: string | null;
    package: string | null;
    graduationYear: number | null;
  } | null;
}

export interface AlumniListResponse {
  items: AlumniListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const listDeptAlumni = async (filters: { page?: number; limit?: number; search?: string } = {}): Promise<AlumniListResponse> => {
  const params: Record<string, string | number> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      params[key] = value as string | number;
    }
  });
  const { data } = await api.get<AlumniListResponse>("/faculty/alumni", { params });
  return data;
};

export const getDeptStudentDetail = async (id: number): Promise<DeptStudentDetail> => {
  const { data } = await api.get<DeptStudentDetail>(`/faculty/students/${id}`);
  return data;
};

export const listDeptFaculty = async (): Promise<DeptFacultyItem[]> => {
  const { data } = await api.get<{ items: DeptFacultyItem[] }>("/faculty/hod/faculty");
  return data.items;
};

export const updateDeptFaculty = async (
  id: number,
  payload: { fullName?: string; contactNo?: string; isHOD?: boolean }
): Promise<DeptFacultyItem> => {
  const { data } = await api.patch<{ faculty: DeptFacultyItem }>(
    `/faculty/hod/faculty/${id}`,
    payload
  );
  return data.faculty;
};

export const setDeptFacultyStatus = async (
  id: number,
  isActive: boolean
): Promise<DeptFacultyItem> => {
  const { data } = await api.patch<{ faculty: DeptFacultyItem }>(
    `/faculty/hod/faculty/${id}/status`,
    { isActive }
  );
  return data.faculty;
};

// =================== STUDENT NOTES ===================

export interface StudentNote {
  id: string;
  content: string;
  createdAt: string;
  author: { id: number; fullName: string; role: string; profilePic: string | null };
}

export const listStudentNotes = async (studentId: number): Promise<StudentNote[]> => {
  const { data } = await api.get<{ notes: StudentNote[] }>(`/faculty/students/${studentId}/notes`);
  return data.notes;
};

export const addStudentNote = async (studentId: number, content: string): Promise<StudentNote> => {
  const { data } = await api.post<{ note: StudentNote }>(`/faculty/students/${studentId}/notes`, { content });
  return data.note;
};

export const deleteStudentNote = async (studentId: number, noteId: string): Promise<void> => {
  await api.delete(`/faculty/students/${studentId}/notes/${noteId}`);
};
