import { api } from "./base";
import type { AcademicYear, Department } from "./student";

export type ResourceFileType =
  | "QUESTION_PAPER"
  | "SYLLABUS"
  | "EXAM_FORM"
  | "OTHER_FORM"
  | "OTHER";

export const RESOURCE_FILE_TYPE_LABELS: Record<ResourceFileType, string> = {
  QUESTION_PAPER: "Question Paper",
  SYLLABUS: "Syllabus",
  EXAM_FORM: "Exam Form",
  OTHER_FORM: "Other Form",
  OTHER: "Other",
};

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: ResourceFileType;
  department: Department | null;
  academicYear: AcademicYear | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  addedBy: {
    fullName: string;
    role: string;
    isHOD: boolean;
    department: Department | null;
  };
}

export const listResources = async (fileType?: ResourceFileType): Promise<Resource[]> => {
  const params = fileType ? `?fileType=${fileType}` : "";
  const res = await api.get<{ resources: Resource[] }>(`/resources${params}`);
  return res.data.resources;
};

export const createResource = async (formData: FormData): Promise<Resource> => {
  const res = await api.post<{ resource: Resource }>("/resources", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.resource;
};

export const updateResource = async (
  id: string,
  data: Partial<Pick<Resource, "title" | "description" | "fileType" | "academicYear" | "isActive">>
): Promise<Resource> => {
  const res = await api.put<{ resource: Resource }>(`/resources/${id}`, data);
  return res.data.resource;
};

export const deleteResource = async (id: string): Promise<void> => {
  await api.delete(`/resources/${id}`);
};
