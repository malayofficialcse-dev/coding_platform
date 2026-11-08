import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// All credentials MUST be provided via environment variables.
// Never hardcode credentials in source files.
const endpoint = process.env.NEON_STORAGE_ENDPOINT;
const bucket   = process.env.NEON_STORAGE_BUCKET;
const region   = process.env.NEON_STORAGE_REGION || "ap-southeast-1";
const accessKeyId     = process.env.NEON_STORAGE_ACCESS_KEY;
const secretAccessKey = process.env.NEON_STORAGE_SECRET_KEY;

if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
  console.warn(
    "[NeonStorage] WARNING: One or more Neon storage env vars are missing. " +
    "Video uploads will fail. Set NEON_STORAGE_ENDPOINT, NEON_STORAGE_BUCKET, " +
    "NEON_STORAGE_ACCESS_KEY, NEON_STORAGE_SECRET_KEY in your environment."
  );
}

export const s3 = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId:     accessKeyId     || "",
    secretAccessKey: secretAccessKey || "",
  },
  forcePathStyle: true,
});

export const BUCKET_NAME = bucket || "";

/**
 * Upload a file (from a temp path on disk or a Buffer) to Neon Object Storage.
 * @param {Object} options
 * @param {Buffer}  [options.buffer]       - File data as Buffer
 * @param {string}  [options.filePath]     - Absolute path to temp file on disk
 * @param {string}  [options.originalname] - Original filename (for extension)
 * @param {string}  [options.mimetype]     - MIME type
 * @param {string}  [options.folder]       - Destination folder in bucket
 * @returns {Promise<{ key: string, url: string }>}
 */
export async function uploadToNeonStorage({
  buffer,
  filePath,
  originalname = "upload.bin",
  mimetype = "application/octet-stream",
  folder = "uploads",
}) {
  const ext = path.extname(originalname) || ".bin";
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const cleanBase = path
    .basename(originalname, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 30);
  const key = `${folder}/${Date.now()}_${cleanBase}_${uniqueId}${ext}`;

  let body;
  let contentLength;

  if (filePath && fs.existsSync(filePath)) {
    body = fs.createReadStream(filePath);
    const stat = fs.statSync(filePath);
    contentLength = stat.size;
  } else if (buffer) {
    body = buffer;
    contentLength = buffer.length;
  } else {
    throw new Error("[NeonStorage] No buffer or filePath provided to uploadToNeonStorage");
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: mimetype,
      ContentLength: contentLength,
    })
  );

  // Generate signed URL valid for 7 days (604800 seconds)
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: 604800 }
  );

  return { key, url };
}

/**
 * Generate a fresh signed URL for an existing Neon storage object.
 * @param {string} key - Object key (e.g. "post-videos/timestamp_name_id.mp4")
 * @param {number} expiresIn - Expiry in seconds (default 7 days)
 */
export async function getNeonSignedUrl(key, expiresIn = 604800) {
  if (!key) return "";
  try {
    // Strip leading URL prefix if a full URL was stored
    const cleanKey = key.includes("://")
      ? key.replace(/^https?:\/\/[^/]+\/[^/]+\//, "")
      : key;
    return await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: bucket, Key: cleanKey }),
      { expiresIn }
    );
  } catch (err) {
    console.error("[NeonStorage] Failed to generate signed URL:", err.message);
    return "";
  }
}

/**
 * Delete an object from Neon Object Storage.
 * @param {string} key - S3 object key or full signed URL
 */
export async function deleteFromNeonStorage(key) {
  if (!key) return;
  try {
    const cleanKey = key.includes("://")
      ? key.replace(/^https?:\/\/[^/]+\/[^/]+\//, "")
      : key;
    await s3.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: cleanKey })
    );
  } catch (err) {
    console.error("[NeonStorage] Failed to delete object:", err.message);
  }
}
