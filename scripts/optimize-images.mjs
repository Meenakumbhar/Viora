#!/usr/bin/env node
// Runs automatically before every build (see package.json's "prebuild")
// and catches exactly the bug class that caused most of today's real
// performance issues: a print-resolution photo (2000-12000px, often 300 DPI)
// gets dropped into public/images/ and shipped as-is. That's harmless in
// isolation, but expensive in two ways — Vercel's Image Optimization has to
// do real work transforming it on every cache miss (the 10-second loads we
// found earlier trace directly back to this), and if a component ever
// bypasses that pipeline (a plain <img>, a CSS background-image, an
// `unoptimized` <Image>), the full oversized file ships untouched.
//
// This can't fix content already served through Vercel's optimizer (that's
// still doing its job fine) — it fixes the SOURCE, so even a cold cache miss
// has little work to do, and any code path that skips optimization entirely
// still gets a reasonably sized file instead of a multi-megabyte one.
//
// Safe by construction: only touches files that are actually oversized,
// never writes a result larger than the original, and a failure on any one
// file is logged and skipped rather than failing the build.

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Without this, processing many files in one run can exhaust file handles
// on Windows (each sharp pipeline holds a libvips handle open until GC'd,
// and this script's sequential loop can create them faster than that
// happens) — verified directly: files that fail here read perfectly fine
// in isolation, only failing as part of a longer batch.
sharp.cache(false);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MAX_DIMENSION = 2500; // comfortably covers even a full-bleed hero on a retina display
const SIZE_THRESHOLD_BYTES = 350 * 1024; // files under this are left alone even if slightly over MAX_DIMENSION — not worth the build-time cost for a marginal saving
const JPEG_QUALITY = 85;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (/\.(jpe?g|png)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

async function optimizeOne(filePath) {
  const before = fs.statSync(filePath).size;
  if (before < SIZE_THRESHOLD_BYTES) return null; // already small — skip without even reading metadata

  // Explicitly destroyed in `finally` below — otherwise each pipeline's
  // libvips handle can outlive its usefulness until GC gets to it, and this
  // script creates one per file in quick succession.
  const image = sharp(filePath);
  try {
    const meta = await image.metadata();
    const oversized = (meta.width ?? 0) > MAX_DIMENSION || (meta.height ?? 0) > MAX_DIMENSION;
    if (!oversized && before < SIZE_THRESHOLD_BYTES * 2) return null; // big-ish but not absurd and not oversized — leave it

    const isPng = /\.png$/i.test(filePath);
    const buffer = await (isPng
      ? image.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
          .png({ compressionLevel: 9, palette: true, quality: 90 })
          .toBuffer()
      : image.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
          .toBuffer());

    if (buffer.length >= before) return null; // never replace with something bigger

    fs.writeFileSync(filePath, buffer);
    return { before, after: buffer.length };
  } finally {
    image.destroy();
  }
}

async function main() {
  const files = walk(PUBLIC_DIR);
  const changed = [];

  for (const file of files) {
    try {
      const result = await optimizeOne(file);
      if (result) changed.push({ file: path.relative(PUBLIC_DIR, file), ...result });
    } catch (err) {
      console.warn(`[optimize-images] skipped ${path.relative(PUBLIC_DIR, file)}: ${err.message}`);
    }
  }

  if (changed.length === 0) {
    console.log('[optimize-images] all public images already within size limits — nothing to do.');
    return;
  }

  console.log(`[optimize-images] optimized ${changed.length} file(s):`);
  let totalBefore = 0;
  let totalAfter = 0;
  for (const { file, before, after } of changed) {
    totalBefore += before;
    totalAfter += after;
    const pct = (100 - (after / before) * 100).toFixed(0);
    console.log(`  ${file}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (-${pct}%)`);
  }
  console.log(`[optimize-images] total: ${(totalBefore / 1024 / 1024).toFixed(2)}MB -> ${(totalAfter / 1024 / 1024).toFixed(2)}MB`);
}

main().catch((err) => {
  // Never fail the build over this — worst case, an oversized image ships
  // and gets caught the way all of today's were: manually, later.
  console.error('[optimize-images] unexpected error, continuing build:', err);
});
