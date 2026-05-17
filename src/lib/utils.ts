import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ensures a Cloudinary raw resume URL ends with .pdf so browsers open it inline. */
export function resumeViewUrl(url: string): string {
  if (!url) return url;
  if (url.includes("/image/upload/")) {
    return url.replace(/\.pdf$/i, ".jpg");
  }
  return url.endsWith(".pdf") ? url : `${url}.pdf`;
}

/**
 * Converts a Cloudinary marksheet URL to a viewable image URL.
 * PDFs uploaded via resource_type "auto" land under /image/upload/ and can be
 * rendered as JPEG by Cloudinary when the extension is changed to .jpg.
 */
export function marksheetImageUrl(url: string): string {
  if (!url) return url;
  if (url.includes("/image/upload/")) {
    return url.replace(/\.pdf$/i, ".jpg");
  }
  return url;
}
