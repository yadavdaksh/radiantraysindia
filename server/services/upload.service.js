import { createR2Key, deleteObjectFromR2, getOptimizedImageUrl, isR2Configured, uploadBufferToR2, getR2Client } from "../utils/r2.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ApiError } from "../utils/ApiError.js";

export const uploadService = {
  upload: async ({ file, folder = "assets" }) => {
    if (!file) {
      throw new ApiError(400, "File is required");
    }

    if (!isR2Configured) {
      throw new ApiError(500, "Cloudflare R2 is not configured");
    }

    const key = createR2Key(folder, file.originalname);
    const uploaded = await uploadBufferToR2({
      buffer: file.buffer,
      key,
      contentType: file.mimetype,
    });

    return {
      key: uploaded.key,
      url: uploaded.url,
      optimizedUrl: getOptimizedImageUrl(uploaded.url, { width: 1600 }),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  },

  delete: async (key) => {
    if (!key) {
      throw new ApiError(400, "Key is required");
    }
    await deleteObjectFromR2(key);
    return { success: true };
  },

  replace: async (oldKey, newFile, folder = "assets") => {
    if (!newFile) {
      throw new ApiError(400, "New file is required for replacement");
    }

    // Delete old asset if key exists
    if (oldKey) {
      try {
        await deleteObjectFromR2(oldKey);
      } catch (err) {
        console.warn(`Failed to delete old key: ${oldKey} during replacement. Continuing...`);
      }
    }

    // Upload new file
    return uploadService.upload({ file: newFile, folder });
  },

  getPresignedUrl: async (key, expiresInSeconds = 3600) => {
    const { client, bucket: dynamicBucket } = await getR2Client();

    try {
      const command = new GetObjectCommand({
        Bucket: dynamicBucket,
        Key: key,
      });
      const signed = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
      return signed;
    } catch (err) {
      console.error("Presigned URL generation error:", err);
      throw new ApiError(500, "Failed to generate signed URL");
    }
  },
};
