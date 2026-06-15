import crypto from "crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;

export const r2Client = new S3Client({
  region: "auto",
  endpoint,
  credentials:
    endpoint && accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined,
});

export const isR2Configured =
  Boolean(endpoint) && Boolean(accessKeyId) && Boolean(secretAccessKey) && Boolean(bucket);

export const buildR2PublicUrl = (key) => {
  const base = process.env.R2_PUBLIC_URL;
  if (base) return `${base.replace(/\/$/, "")}/${key}`;
  return `${endpoint?.replace(/\/$/, "")}/${bucket}/${key}`;
};

export const createR2Key = (folder, originalName) => {
  const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  return `${folder}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${sanitized}`;
};

export const uploadBufferToR2 = async ({ buffer, key, contentType }) => {
  if (!isR2Configured) {
    throw new Error("Cloudflare R2 is not configured");
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return {
    key,
    url: buildR2PublicUrl(key),
  };
};

export const deleteObjectFromR2 = async (key) => {
  if (!isR2Configured || !key) return;

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
};

export const getOptimizedImageUrl = (url, { width, quality = 80 } = {}) => {
  if (!url) return url;
  const hasQuery = url.includes("?");
  const params = new URLSearchParams(hasQuery ? url.split("?")[1] : "");

  if (width) params.set("width", String(width));
  params.set("quality", String(quality));

  const base = hasQuery ? url.split("?")[0] : url;
  return `${base}?${params.toString()}`;
};

