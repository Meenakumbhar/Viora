import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { uploadToR2, deleteFromR2 } from '@/utils/r2';
import { parseJsonBody } from '@/lib/validation';
import { auth } from '@/lib/auth';
import { getUserById } from '@/lib/db';
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from '@/utils/admin-auth';
import type { ApiResponse } from '@/types/database';

const deleteSchema = z.object({ key: z.string().trim().min(1, 'File key is required for deletion.').max(500) });

// The one folder a signed-out visitor is allowed to upload into — the
// customer order form (app/order-form/[enquiryId]) has no login of its own,
// matching the trust model of the enquiry-id link it's reached through.
// Everything else (portfolio images, etc.) stays admin/staff only.
const PUBLIC_UPLOAD_FOLDERS = new Set(['order-form-attachments']);
const UPLOAD_ROLES = new Set(['designer', 'employee', 'admin']);

async function isUploadRequestAuthorized(request: NextRequest): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const cookieToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (await verifyAdminToken(cookieToken, adminPassword)) return true;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return false;
  const user = await getUserById(session.user.id);
  return Boolean(user && UPLOAD_ROLES.has(user.role));
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_TYPES = [
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

interface UploadResult {
  url: string;
  key: string;
  name: string;
  size: number;
  contentType: string;
}

// POST /api/upload — Upload a file to Cloudflare R2
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = ((formData.get('folder') as string) || 'uploads')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .toLowerCase();

    if (!PUBLIC_UPLOAD_FOLDERS.has(folder) && !(await isUploadRequestAuthorized(request))) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No file provided.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File size exceeds maximum allowed limit of 25MB.' },
        { status: 400 }
      );
    }

    const contentType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Unsupported file type (${contentType}). Allowed types: JPG, PNG, WebP, AVIF, GIF, HEIC, PDF.`,
        },
        { status: 400 }
      );
    }

    // Determine safe file extension
    const originalName = file.name || 'file';
    const extensionParts = originalName.split('.');
    const ext = extensionParts.length > 1 ? extensionParts.pop()?.toLowerCase() : 'bin';
    const safeBaseName = (extensionParts.join('.') || 'file')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const key = `${folder}/${safeBaseName}-${uniqueId}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToR2({
      key,
      body: buffer,
      contentType,
      metadata: {
        originalName: encodeURIComponent(originalName),
        uploadedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json<ApiResponse<UploadResult>>(
      {
        success: true,
        data: {
          url: result.url,
          key: result.key,
          name: originalName,
          size: file.size,
          contentType,
        },
        message: 'File uploaded successfully.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[upload] Error uploading to R2:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to upload file to Cloudflare R2.';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// DELETE /api/upload — Delete a file from Cloudflare R2
export async function DELETE(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, deleteSchema, 'upload/delete');
    if (parsed.error) return parsed.error;
    const { key } = parsed.data;

    await deleteFromR2(key);

    return NextResponse.json<ApiResponse<{ key: string }>>(
      {
        success: true,
        data: { key },
        message: 'File deleted successfully.',
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[upload] Error deleting from R2:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to delete file from Cloudflare R2.';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
