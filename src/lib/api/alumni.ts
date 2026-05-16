import { api } from "./base";
import type { Department } from "./student";

export type AlumniPostType =
  | "MENTORSHIP"
  | "REFERRAL"
  | "CAREER_ADVICE"
  | "GENERAL";

export const POST_TYPE_LABELS: Record<AlumniPostType, string> = {
  MENTORSHIP: "Mentorship",
  REFERRAL: "Referral",
  CAREER_ADVICE: "Career Advice",
  GENERAL: "General",
};

export interface PastOrg {
  id: number;
  companyName: string;
  role: string;
  joiningDate: string;
  leavingDate: string | null;
}

export interface HigherStudies {
  id: number;
  collegeName: string;
  branch: string;
  location: string;
  joiningDate: string;
  leavingDate: string | null;
}

export interface AlumniProfileBlock {
  id: number;
  userId: number;
  currentOrg: string | null;
  currentRole: string | null;
  package: string | null;
  graduationYear: number | null;
  placedBy: string | null;
  pastOrgs: PastOrg[];
  higherStudies: HigherStudies | null;
}

export interface AlumniUser {
  id: number;
  fullName: string;
  emailId: string;
  contactNo: string | null;
  profilePic: string | null;
  department: Department | null;
  studentId: string | null;
  skills: string[];
  socialProfile: string | null;
  alumniProfile: AlumniProfileBlock | null;
}

export interface AlumniPost {
  id: string;
  alumniId: number;
  postType: AlumniPostType;
  title: string;
  body: string;
  companyName: string | null;
  role: string | null;
  contactInfo: string | null;
  createdAt: string;
  updatedAt: string;
  alumni: {
    id: number;
    fullName: string;
    profilePic: string | null;
    department: Department | null;
    alumniProfile: {
      currentOrg: string | null;
      currentRole: string | null;
      graduationYear: number | null;
    } | null;
  };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UpdateAlumniProfilePayload {
  currentOrg?: string;
  currentRole?: string;
  package?: string;
  graduationYear?: number;
  placedBy?: string;
}

export interface PastOrgPayload {
  companyName: string;
  role: string;
  joiningDate: string;
  leavingDate?: string;
}

export interface HigherStudiesPayload {
  collegeName: string;
  branch: string;
  location: string;
  joiningDate: string;
  leavingDate?: string;
}

export interface AlumniPostPayload {
  postType: AlumniPostType;
  title: string;
  body: string;
  companyName?: string;
  role?: string;
  contactInfo?: string;
}

export interface DirectoryItem {
  id: number;
  fullName: string;
  emailId: string;
  contactNo: string | null;
  profilePic: string | null;
  department: Department | null;
  studentId: string | null;
  skills: string[];
  socialProfile: string | null;
  alumniProfile: {
    currentOrg: string | null;
    currentRole: string | null;
    package: string | null;
    graduationYear: number | null;
    placedBy: string | null;
    higherStudies: {
      collegeName: string;
      branch: string;
      location: string;
    } | null;
  } | null;
}

export interface FeedFilters {
  page?: number;
  limit?: number;
  postType?: AlumniPostType;
  search?: string;
}

export interface DirectoryFilters {
  page?: number;
  limit?: number;
  department?: Department;
  graduationYear?: number;
  currentOrg?: string;
  track?: "WORKING" | "HIGHER_STUDIES";
  search?: string;
}

// ==================== ME ====================

export const getMyAlumniProfile = async () => {
  const { data } = await api.get<{ user: AlumniUser }>("/alumni/me");
  return data.user;
};

export const updateAlumniProfile = async (payload: UpdateAlumniProfilePayload) => {
  const { data } = await api.patch<{ profile: AlumniProfileBlock }>(
    "/alumni/me",
    payload
  );
  return data.profile;
};

export const addPastOrg = async (payload: PastOrgPayload) => {
  const { data } = await api.post<{ pastOrg: PastOrg }>(
    "/alumni/me/past-orgs",
    payload
  );
  return data.pastOrg;
};

export const deletePastOrg = async (id: number) => {
  await api.delete(`/alumni/me/past-orgs/${id}`);
};

export const upsertHigherStudies = async (payload: HigherStudiesPayload) => {
  const { data } = await api.put<{ higherStudies: HigherStudies }>(
    "/alumni/me/higher-studies",
    payload
  );
  return data.higherStudies;
};

export const deleteHigherStudies = async () => {
  await api.delete("/alumni/me/higher-studies");
};

export const createAlumniPost = async (payload: AlumniPostPayload) => {
  const { data } = await api.post<{ post: AlumniPost }>(
    "/alumni/me/posts",
    payload
  );
  return data.post;
};

export const listMyAlumniPosts = async () => {
  const { data } = await api.get<{ items: AlumniPost[] }>("/alumni/me/posts");
  return data.items;
};

export const deleteMyAlumniPost = async (id: string) => {
  await api.delete(`/alumni/me/posts/${id}`);
};

// ==================== PUBLIC (all authenticated) ====================

export const listAlumniFeed = async (filters: FeedFilters = {}) => {
  const { data } = await api.get<Paginated<AlumniPost>>("/alumni/feed", {
    params: filters,
  });
  return data;
};

export const listAlumniDirectory = async (filters: DirectoryFilters = {}) => {
  const { data } = await api.get<Paginated<DirectoryItem>>("/alumni/directory", {
    params: filters,
  });
  return data;
};

export const getAlumniById = async (id: number) => {
  const { data } = await api.get<{ user: AlumniUser }>(`/alumni/by/${id}`);
  return data.user;
};

// ==================== ACADEMIC HISTORY ====================

export interface AlumniMarks {
  id: string;
  sscPercentage: number | null;
  hscPercentage: number | null;
  sem1: number | null;
  sem2: number | null;
  sem3: number | null;
  sem4: number | null;
  sem5: number | null;
  sem6: number | null;
  sem7: number | null;
  sem8: number | null;
  isVerified: boolean;
  updatedAt: string;
}

export interface AlumniInternship {
  id: string;
  companyName: string;
  role: string;
  roleDescription: string | null;
  duration: string | null;
  startDate: string;
  endDate: string | null;
  certificateUrl: string | null;
  isVerified: boolean;
}

export interface AlumniAchievement {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  certificateUrl: string | null;
  achievementDate: string | null;
  isVerified: boolean;
}

export interface AlumniProject {
  id: string;
  title: string;
  description: string | null;
  techStack: string[];
  projectUrl: string | null;
  repoUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isVerified: boolean;
}

export interface AcademicHistoryUser {
  id: number;
  fullName: string;
  legalName: string | null;
  emailId: string;
  contactNo: string | null;
  studentId: string | null;
  department: Department | null;
  academicYear: string | null;
  skills: string[];
  socialProfile: string | null;
  profilePic: string | null;
  resumeUrl: string | null;
  avgCgpa: number | null;
}

export interface AcademicHistoryResponse {
  user: AcademicHistoryUser;
  marks: AlumniMarks | null;
  internships: AlumniInternship[];
  achievements: AlumniAchievement[];
  projects: AlumniProject[];
}

export const getAlumniAcademicHistory = async (): Promise<AcademicHistoryResponse> => {
  const { data } = await api.get<AcademicHistoryResponse>("/alumni/me/academic-history");
  return data;
};
