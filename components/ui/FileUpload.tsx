'use client';

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import Image from 'next/image';
import { uploadFileDirect } from '@/utils/presigned-upload';

// Uploads go straight from the browser to R2 (see the comment on
// maxSizeMB below) — nothing server-side ever gets a chance to touch the
// file, so an admin picking a straight-off-camera photo (routinely
// 15-30MB, several thousand pixels wide) ends up served to every visitor
// at full size forever. Shrinking oversized images client-side, before
// they ever leave the browser, is the only place left to catch this.
// Only JPEG/PNG — the two formats an actual camera/screenshot produces —
// get touched; PDFs, SVGs (already tiny/vector), HEIC (canvas can't
// reliably decode it) and anything already a sane size pass through
// untouched. Any failure here just falls back to the original file rather
// than blocking the upload.
const RESIZABLE_TYPES = new Set(['image/jpeg', 'image/png']);
const MAX_DIMENSION = 2500; // comfortably covers even a full-bleed hero on a retina display

async function shrinkIfOversized(file: File): Promise<File> {
  if (!RESIZABLE_TYPES.has(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    if (Math.max(width, height) <= MAX_DIMENSION) {
      bitmap.close();
      return file;
    }

    const scale = MAX_DIMENSION / Math.max(width, height);
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    // PNG stays PNG (preserves transparency) — everything else becomes a
    // quality-85 JPEG, same target quality used elsewhere in this app.
    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, 0.85)
    );
    if (!blob) return file;

    return new File([blob], file.name, { type: outputType });
  } catch (err) {
    console.error('[FileUpload] client-side resize failed, uploading original:', err);
    return file;
  }
}

interface FileUploadProps {
  value?: string;
  onChange: (url: string, key?: string) => void;
  folder?: string;
  /** Prepended to the filename (e.g. a short order/job reference) so uploads stay distinguishable in storage. */
  filenamePrefix?: string;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
  disabled?: boolean;
}

export default function FileUpload({
  value = '',
  onChange,
  folder = 'portfolio',
  filenamePrefix,
  // Includes HEIC/HEIF (and their .heic/.heif extensions aren't in the
  // display regex below) since that's the default capture format on modern
  // iPhones — without it, uploading a photo straight from an iOS camera roll
  // fails with "unsupported file type".
  accept = 'image/jpeg,image/png,image/webp,image/avif,image/svg+xml,image/heic,image/heif,application/pdf',
  // The file goes straight from the browser to R2 via a presigned URL, not
  // through our server, so this is just a sane ceiling rather than a
  // workaround for a hosting-platform request-body limit — see
  // utils/presigned-upload.ts.
  maxSizeMB = 25,
  label = 'Upload Media',
  helperText = 'PNG, JPG, WebP, AVIF, SVG, HEIC or PDF up to 25MB',
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // An explicit allowlist, not "anything that isn't a PDF" — browsers can't
  // decode HEIC/HEIF (or other unknown types) in an <img>, so those need the
  // generic file icon below rather than a silently-broken <Image>.
  const isImage = Boolean(value && value.match(/\.(jpeg|jpg|png|webp|avif|gif|svg)(\?.*)?$/i));
  const isPdf = Boolean(value && value.toLowerCase().includes('.pdf'));

  async function uploadFile(file: File) {
    if (disabled || isUploading) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`File size exceeds maximum limit of ${maxSizeMB}MB.`);
      return;
    }

    setErrorMessage('');
    setIsUploading(true);
    setProgress(0);

    try {
      const toUpload = await shrinkIfOversized(file);
      const uploaded = await uploadFileDirect(toUpload, {
        folder,
        filenamePrefix,
        onProgress: setProgress,
      });

      onChange(uploaded.url, uploaded.key);
    } catch (err) {
      console.error('[FileUpload] upload error:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Upload failed. Please try again.'
      );
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  }

  function handleRemove() {
    onChange('', '');
    setErrorMessage('');
  }

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block font-mono text-base uppercase tracking-wider text-text-muted">
          {label}
        </label>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* If file is already uploaded / value exists */}
      {value ? (
        <div className="relative overflow-hidden border border-border bg-bg-secondary p-4 transition-all duration-200 hover:border-accent-gold/50">
          <div className="flex items-center gap-4">
            {/* Thumbnail / Icon */}
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-cat-surface">
              {isImage ? (
                <Image
                  src={value}
                  alt="Uploaded file preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : isPdf ? (
                <div className="flex flex-col items-center justify-center text-accent-gold">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span className="mt-1 font-mono text-base uppercase">PDF</span>
                </div>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
              )}
            </div>

            {/* URL info & Action buttons */}
            <div className="min-w-0 flex-1">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-mono text-base text-text-heading hover:text-accent-gold hover:underline"
              >
                {value.split('/').pop() || 'Uploaded File'}
              </a>
              <p className="mt-1 truncate font-mono text-base text-text-muted">
                {value}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-base text-accent-gold hover:underline"
                >
                  View / download
                </a>
                <span className="text-border">·</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                  className="font-mono text-base text-accent-gold hover:underline"
                >
                  Replace file
                </button>
                <span className="text-border">·</span>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={disabled || isUploading}
                  className="font-mono text-base text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={[
            'relative flex cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-8 text-center transition-all duration-200',
            isDragging
              ? 'border-accent-gold bg-accent-gold/5 scale-[0.99]'
              : 'border-border hover:border-accent-gold hover:bg-bg-secondary/50',
            disabled || isUploading ? 'opacity-60 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {isUploading ? (
            <div className="w-full max-w-xs space-y-3">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent-gold border-t-transparent" />
              <p className="font-mono text-base text-accent-gold">
                Uploading... {progress}%
              </p>
              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full bg-accent-gold transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Upload Icon — swap /images/upload-icon.svg with your own file in public/images/ */}
              <div className="mb-3 flex h-12 w-12 items-center justify-center">
                <Image
                  src="/images/upload-icon.svg"
                  alt="Upload"
                  width={48}
                  height={48}
                  unoptimized
                />
              </div>

              <p className="font-body text-base text-text-heading">
                <span className="font-semibold text-accent-gold">Click to upload</span>{' '}
                or drag & drop
              </p>
              <p className="mt-1 font-mono text-base text-text-muted">{helperText}</p>
            </>
          )}
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <p className="font-mono text-base text-red-400" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
