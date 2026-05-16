import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";
import logger from "@/lib/logger";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export type UploadFolder =
  | "tpo/profile-pics"
  | "tpo/resumes"
  | "tpo/certificates"
  | "tpo/marksheets"
  | "tpo/company-logos"
  | "tpo/resources";

export type ResourceType = "image" | "raw" | "auto";

interface UploadOptions {
  folder: UploadFolder;
  resourceType?: ResourceType;
  publicId?: string;
}

export const uploadBuffer = (
  buffer: Buffer,
  options: UploadOptions
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resourceType ?? "auto",
        public_id: options.publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          logger.error({ error }, "Cloudinary upload failed");
          return reject(error ?? new Error("Upload failed"));
        }
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const deleteByPublicId = async (
  publicId: string,
  resourceType: ResourceType = "image"
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    logger.error({ error, publicId }, "Cloudinary delete failed");
  }
};

export const extractPublicIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
};
