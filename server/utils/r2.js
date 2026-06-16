import crypto from "crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "../config/db.js";

export const getR2Config = async () => {
  try {
    const dbRecord = await prisma.settings.findUnique({
      where: { key: "r2_config" },
    });
    if (dbRecord && dbRecord.value) {
      const val = dbRecord.value;
      const accountId = val.accountId;
      const accessKeyId = val.accessKeyId;
      const secretAccessKey = val.secretAccessKey;
      const bucket = val.bucketName || val.bucket;
      const publicUrl = val.publicUrl;
      const endpoint = val.endpoint || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

      if (accessKeyId && secretAccessKey && bucket && endpoint) {
        return {
          endpoint,
          accessKeyId,
          secretAccessKey,
          bucket,
          publicUrl,
        };
      }
    }
  } catch (err) {
    console.error("Failed to load R2 config from DB:", err);
  }

  // Fallback to process.env
  return {
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL,
  };
};

export const isR2Configured = true;
export const r2Client = null;

export const getR2Client = async () => {
  const config = await getR2Config();
  if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
    throw new Error("Cloudflare R2 is not configured");
  }
  const client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return { client, bucket: config.bucket, publicUrl: config.publicUrl, endpoint: config.endpoint };
};

export const buildR2PublicUrl = (key, config) => {
  const base = config.publicUrl;
  if (base) return `${base.replace(/\/$/, "")}/${key}`;
  return `${config.endpoint.replace(/\/$/, "")}/${config.bucket}/${key}`;
};

export const createR2Key = (folder, originalName) => {
  const sanitized = originalName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  return `${folder}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${sanitized}`;
};

export const uploadBufferToR2 = async ({ buffer, key, contentType }) => {
  const { client, bucket, publicUrl, endpoint } = await getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return {
    key,
    url: buildR2PublicUrl(key, { publicUrl, endpoint, bucket }),
  };
};

export const deleteObjectFromR2 = async (key) => {
  if (!key) return;
  try {
    const { client, bucket } = await getR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch (err) {
    console.warn("Failed to delete object from R2:", err.message);
  }
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

export const extractR2Key = (url, config) => {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("data:") || !url.startsWith("http")) return null;

  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;

    if (config.publicUrl) {
      try {
        const pubPath = new URL(config.publicUrl).pathname.replace(/\/$/, "");
        if (pubPath && pathname.startsWith(pubPath)) {
          return pathname.slice(pubPath.length).replace(/^\//, "");
        }
      } catch (e) {}
    }

    if (config.bucket && pathname.startsWith(`/${config.bucket}/`)) {
      return pathname.slice(config.bucket.length + 2);
    }

    return pathname.replace(/^\//, "");
  } catch (e) {
    return null;
  }
};

export const deleteR2Image = async (url) => {
  if (!url) return;
  try {
    const config = await getR2Config();
    const key = extractR2Key(url, config);
    if (key) {
      await deleteObjectFromR2(key);
    }
  } catch (err) {
    console.warn("Failed to delete R2 image from URL:", url, err.message);
  }
};


