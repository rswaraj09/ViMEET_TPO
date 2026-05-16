import { api } from "./base";
import type { Department, AcademicYear } from "./student";

export type JobStatus = "OPEN" | "CLOSED";
export type JobType = "FULL_TIME" | "INTERNSHIP" | "PPO";
export type LocationType = "ON_SITE" | "REMOTE" | "HYBRID";
export type ApplicationStatus =
  | "APPLIED"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "SELECTED"
  | "REJECTED";

export interface Job {
  id: string;
  companyName: string;
  jobTitle: string;
  description: string;
  package: string;
  location: string;
  locationType: LocationType;
  jobType: JobType;
  eligibleDepartments: Department[];
  minCgpa: number | null;
  eligibleYears: AcademicYear[];
  deadline: string;
  rounds: string[];
  openings: number | null;
  bondDetails: string | null;
  additionalNotes: string | null;
  status: JobStatus;
  createdAt: string;
  updatedAt?: string;
  createdById?: number;
  _count?: { applications: number };
}

export interface JobListResponse {
  items: Job[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobFilters {
  page?: number;
  limit?: number;
  status?: JobStatus;
  jobType?: JobType;
  search?: string;
}

export interface CreateJobPayload {
  companyName: string;
  jobTitle: string;
  description: string;
  package: string;
  location: string;
  locationType: LocationType;
  jobType: JobType;
  eligibleDepartments: Department[];
  minCgpa?: number;
  eligibleYears: AcademicYear[];
  deadline: string;
  rounds?: string[];
  openings?: number;
  bondDetails?: string;
  additionalNotes?: string;
}

export type UpdateJobPayload = Partial<CreateJobPayload>;

export interface ApplicationStudent {
  id: number;
  fullName: string;
  emailId: string;
  studentId: string | null;
  department: Department | null;
  academicYear: AcademicYear | null;
  avgCgpa: number | null;
  resumeUrl: string | null;
  profilePic: string | null;
}

export interface JobApplication {
  id: string;
  jobId: string;
  studentId: number;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  student: ApplicationStudent;
}

// ==================== ADMIN ====================

export const adminListJobs = async (
  filters: JobFilters = {}
): Promise<JobListResponse> => {
  const params: Record<string, string | number> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) {
      params[k] = v as string | number;
    }
  });
  const { data } = await api.get<JobListResponse>("/admin/jobs", { params });
  return data;
};

export const adminCreateJob = async (
  payload: CreateJobPayload
): Promise<{ job: Job; eligibleCount: number }> => {
  const { data } = await api.post<{ job: Job; eligibleCount: number }>(
    "/admin/jobs",
    payload
  );
  return data;
};

export const adminGetJob = async (id: string): Promise<Job> => {
  const { data } = await api.get<{ job: Job }>(`/admin/jobs/${id}`);
  return data.job;
};

export const adminUpdateJob = async (
  id: string,
  payload: UpdateJobPayload
): Promise<Job> => {
  const { data } = await api.patch<{ job: Job }>(`/admin/jobs/${id}`, payload);
  return data.job;
};

export const adminSetJobStatus = async (
  id: string,
  status: JobStatus
): Promise<Job> => {
  const { data } = await api.patch<{ job: Job }>(`/admin/jobs/${id}/status`, {
    status,
  });
  return data.job;
};

export const adminDeleteJob = async (id: string): Promise<void> => {
  await api.delete(`/admin/jobs/${id}`);
};

export const adminListApplications = async (
  jobId: string,
  status?: ApplicationStatus
): Promise<JobApplication[]> => {
  const { data } = await api.get<{ items: JobApplication[] }>(
    `/admin/jobs/${jobId}/applications`,
    { params: status ? { status } : {} }
  );
  return data.items;
};

export const adminUpdateApplicationStatus = async (
  applicationId: string,
  status: ApplicationStatus
): Promise<JobApplication> => {
  const { data } = await api.patch<{ application: JobApplication }>(
    `/admin/applications/${applicationId}/status`,
    { status }
  );
  return data.application;
};

// ==================== STUDENT ====================

export interface StudentJob extends Job {
  myApplication: {
    jobId?: string;
    status: ApplicationStatus;
    appliedAt: string;
  } | null;
  eligible: boolean;
  ineligibleReasons: Array<"department" | "year" | "cgpa">;
}

export interface StudentJobDetail {
  job: Job;
  eligible: boolean;
  hasResume: boolean;
  myApplication: {
    id: string;
    status: ApplicationStatus;
    appliedAt: string;
    updatedAt: string;
  } | null;
}

export const studentListEligibleJobs = async (): Promise<StudentJob[]> => {
  const { data } = await api.get<{ items: StudentJob[] }>("/student/jobs");
  return data.items;
};

export const studentGetJob = async (id: string): Promise<StudentJobDetail> => {
  const { data } = await api.get<StudentJobDetail>(`/student/jobs/${id}`);
  return data;
};

export const studentApplyToJob = async (
  id: string
): Promise<JobApplication> => {
  const { data } = await api.post<{ application: JobApplication }>(
    `/student/jobs/${id}/apply`
  );
  return data.application;
};

export const studentListMyApplications = async (): Promise<
  Array<JobApplication & { job: Job }>
> => {
  const { data } = await api.get<{
    items: Array<JobApplication & { job: Job }>;
  }>("/student/applications");
  return data.items;
};
