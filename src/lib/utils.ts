import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ensures a Cloudinary raw resume URL ends with .pdf so browsers open it inline. */
export function resumeViewUrl(url: string): string {
  return url.endsWith(".pdf") ? url : `${url}.pdf`;
}
