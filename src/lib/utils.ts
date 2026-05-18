import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ensures a Cloudinary resume URL has a proper extension so browsers open it correctly. */
export function resumeViewUrl(url: string): string {
  if (!url) return url;
  if (url.includes("/image/upload/")) {
    if (url.endsWith(".pdf")) return url.replace(/\.pdf$/i, ".jpg");
    if (!url.endsWith(".jpg") && !url.endsWith(".jpeg")) return `${url}.jpg`;
    return url;
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
    if (url.endsWith(".pdf")) return url.replace(/\.pdf$/i, ".jpg");
    if (!url.endsWith(".jpg") && !url.endsWith(".jpeg")) return `${url}.jpg`;
    return url;
  }
  return url;
}
