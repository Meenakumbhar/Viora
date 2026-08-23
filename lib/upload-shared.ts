import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from '@/utils/admin-auth';

// The one folder a signed-out visitor is allowed to upload into — the
// customer order form (app/order-form/[enquiryId]) has no login of its own,
// matching the trust model of the enquiry-id link it's reached through.
// Everything else (portfolio images, design proofs, etc.) stays admin/staff only.
export const PUBLIC_UPLOAD_FOLDERS = new Set(['order-form-attachments']);
export const UPLOAD_ROLES = new Set(['designer', 'employee', 'admin']);

export async function isUploadRequestAuthorized(request: NextRequest, folder: string): Promise<boolean> {
  if (PUBLIC_UPLOAD_FOLDERS.has(folder)) return true;

  const adminPassword = process.env.ADMIN_PASSWORD;
  const cookieToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (await verifyAdminToken(cookieToken, adminPassword)) return true;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return false;
  const user = await getUserById(session.user.id);
  return Boolean(user && UPLOAD_ROLES.has(user.role));
}

// Files go straight from the browser to R2 via a presigned URL (see
// getPresignedUploadUrl in utils/r2.ts) rather than through this server, so
// this is a sanity ceiling against abuse/storage cost — not a workaround for
// a hosting-platform request-body limit.
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  // iPhones capture photos as HEIC/HEIF by default — without these, a photo
  // picked straight from an iOS camera roll fails to upload.
  'image/heic',
  'image/heif',
  'application/pdf',
];

export function sanitizeFolder(folder: string | null | undefined): string {
  return (folder || 'uploads').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
}

// Same key shape the old direct-upload route used, so existing objects and
// tooling that parse the key format keep working.
export function buildObjectKey(folder: string, originalName: string): string {
  const extensionParts = (originalName || 'file').split('.');
  const ext = extensionParts.length > 1 ? extensionParts.pop()?.toLowerCase() : 'bin';
  const safeBaseName = (extensionParts.join('.') || 'file')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);

  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return `${folder}/${safeBaseName}-${uniqueId}.${ext}`;
}
