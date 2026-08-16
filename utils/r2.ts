import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 Client & Storage Utilities
 *
 * S3-compatible object storage via Cloudflare R2.
 * Zero egress fees and generous free tier (10GB / month).
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'viora-media';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

let r2ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error(
      'Missing Cloudflare R2 credentials. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in .env.local'
    );
  }

  if (!r2ClientInstance) {
    r2ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return r2ClientInstance;
}

export function getR2BucketName(): string {
  return R2_BUCKET_NAME;
}

export function getR2PublicUrl(key: string): string {
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  if (R2_PUBLIC_URL) {
    const base = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
    return `${base}/${cleanKey}`;
  }
  // Fallback if public URL is not yet configured
  return `/api/storage/${cleanKey}`;
}

export interface UploadOptions {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export async function uploadToR2({
  key,
  body,
  contentType,
  cacheControl = 'public, max-age=31536000, immutable',
  metadata,
}: UploadOptions): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: cacheControl,
    Metadata: metadata,
  });

  await client.send(command);

  return {
    key,
    url: getR2PublicUrl(key),
  };
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
}

export async function checkR2ObjectExists(key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    const bucket = getR2BucketName();
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch {
    return false;
  }
}
