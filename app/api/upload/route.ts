import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, deleteFromR2 } from '@/utils/r2';
import type { ApiResponse } from '@/types/database';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
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

    if (!file) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No file provided.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File size exceeds maximum allowed limit of 10MB.' },
        { status: 400 }
      );
    }

    const contentType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Unsupported file type (${contentType}). Allowed types: JPG, PNG, WebP, AVIF, GIF, PDF.`,
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
    const body = await request.json().catch(() => ({}));
    const key = body.key as string | undefined;

    if (!key || typeof key !== 'string') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'File key is required for deletion.' },
        { status: 400 }
      );
    }

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
