// Shared by every direct-to-R2 uploader (FileUpload, DesignManager, ...):
// ask our server for a presigned URL, then PUT the file straight to R2 from
// the browser. The file's bytes never pass through our own server, so there
// is no hosting-platform request-body ceiling to hit — see the comment on
// POST /api/upload for why that mattered.

export interface UploadedFile {
  url: string;
  key: string;
}

export class UploadError extends Error {}

interface PresignResponse {
  success: boolean;
  error?: string;
  data?: { uploadUrl: string; key: string; url: string };
}

export async function uploadFileDirect(
  file: File,
  options: {
    folder?: string;
    /** Prepended to the filename (e.g. a short order/job reference) so uploads stay distinguishable in storage. */
    filenamePrefix?: string;
    onProgress?: (percent: number) => void;
  } = {}
): Promise<UploadedFile> {
  const { folder = 'uploads', filenamePrefix, onProgress } = options;
  const filename = filenamePrefix ? `${filenamePrefix}_${file.name}` : file.name;
  const contentType = file.type || 'application/octet-stream';

  const presignRes = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType, size: file.size, folder }),
  });

  let presignJson: PresignResponse;
  try {
    presignJson = await presignRes.json();
  } catch {
    throw new UploadError(`Upload failed (server returned an unexpected response, status ${presignRes.status}). Please try again.`);
  }

  if (!presignRes.ok || !presignJson.success || !presignJson.data) {
    throw new UploadError(presignJson.error || 'Upload failed. Please try again.');
  }

  const { uploadUrl, key, url } = presignJson.data;

  // XHR rather than fetch — it's the only one of the two that reports
  // upload progress, which the dropzone UI shows while a large PDF is
  // still on its way up.
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new UploadError(`Upload to storage failed (status ${xhr.status}). Please try again.`));
    };
    xhr.onerror = () => reject(new UploadError('Upload to storage failed — check your connection and try again.'));

    xhr.send(file);
  });

  return { url, key };
}
