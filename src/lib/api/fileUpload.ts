import { toast } from "sonner";

export const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
export const MAX_SIZE_LABEL = "1MB";

export const MAX_PROFILE_PIC_BYTES = 1 * 1024 * 1024; // 1 MB
export const MAX_PROFILE_PIC_LABEL = "1MB";

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Validate a file's size against the 2MB limit.
 * If it fails, shows a toast warning and returns false.
 */
export const validateFileSize = (
  file: File,
  maxBytes: number = MAX_FILE_SIZE_BYTES
): boolean => {
  if (file.size > maxBytes) {
    toast.warning(
      `"${file.name}" is ${formatSize(file.size)} — exceeds the ${MAX_SIZE_LABEL} limit.`,
      { duration: 6000 }
    );
    return false;
  }
  return true;
};

export const validateFileType = (
  file: File,
  allowed: string[]
): boolean => {
  if (!allowed.includes(file.type)) {
    toast.warning(`"${file.name}" is not an allowed file type.`);
    return false;
  }
  return true;
};
