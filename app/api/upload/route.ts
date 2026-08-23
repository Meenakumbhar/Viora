import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteFromR2, getPresignedUploadUrl, getR2PublicUrl } from '@/utils/r2';
import { parseJsonBody } from '@/lib/validation';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  buildObjectKey,
  isUploadRequestAuthorized,
  sanitizeFolder,
} from '@/lib/upload-shared';
import type { ApiResponse } from '@/types/database';

const deleteSchema = z.object({ key: z.string().trim().min(1, 'File key is required for deletion.').max(500) });

const presignSchema = z.object({
  filename: z.string().trim().min(1, 'A filename is required.').max(200),
  contentType: z.string().trim().min(1, 'A content type is required.').max(100),
  size: z.number().int().positive().max(MAX_FILE_SIZE, `File size exceeds maximum allowed limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`),
  folder: z.string().trim().max(100).optional(),
});

interface PresignResult {
  uploadUrl: string;
  key: string;
  url: string;
}

// POST /api/upload — Issue a short-lived, single-object presigned URL so the
// browser can PUT the file straight to R2. The file's bytes never pass
// through this route, so there's no hosting-platform request-body ceiling to
// hit — the earlier direct-proxy version silently truncated anything past
// Vercel's ~4.5MB serverless limit, which is what broke larger PDF uploads.
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, presignSchema, 'upload/presign');
    if (parsed.error) return parsed.error;
    const { filename, contentType, size, folder: rawFolder } = parsed.data;

    const folder = sanitizeFolder(rawFolder);

    if (!(await isUploadRequestAuthorized(request, folder))) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Unsupported file type (${contentType}). Allowed types: JPG, PNG, WebP, AVIF, GIF, HEIC, PDF.`,
        },
        { status: 400 }
      );
    }

    // `size` is client-reported at this stage (used only for the pre-check
    // above) — R2 enforces the actual byte count against the presigned PUT
    // regardless, so a spoofed value here can't smuggle a larger object in.
    void size;

    const key = buildObjectKey(folder, filename);
    const uploadUrl = await getPresignedUploadUrl({ key, contentType });

    return NextResponse.json<ApiResponse<PresignResult>>(
      {
        success: true,
        data: {
          uploadUrl,
          key,
          url: getR2PublicUrl(key),
        },
        message: 'Presigned upload URL created.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[upload] Error creating presigned upload URL:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to prepare file upload.';
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
