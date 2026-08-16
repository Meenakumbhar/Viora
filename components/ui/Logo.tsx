'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// Drop the logo file at public/images/logo.png (or update this path) to
// activate it — until that file exists, this quietly falls back to the
// text wordmark so nothing looks broken.
const LOGO_SRC = '/images/logo.png';

export default function Logo({
  wordmark,
  // width × height of the visible container that holds the logo image.
  // Because the PNG is a square canvas, we want a square (or near-square)
  // container so the graphic fills it properly without being squeezed.
  containerWidth = 120,
  containerHeight = 64,
  imgClassName = '',
  textClassName = 'font-display font-light text-xl tracking-wide',
}: {
  wordmark: string;
  containerWidth?: number;
  containerHeight?: number;
  imgClassName?: string;
  textClassName?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    // A browser-cached image can finish loading before this handler is even
    // attached, so the onLoad callback below never fires — check directly
    // once mounted to catch that case.
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <>
      {!errored && (
        // Sized container — Next.js `fill` renders the image at exactly this
        // pixel size so no upscaling or downscaling artefacts occur.
        <div
          className={`relative flex-shrink-0 ${loaded ? '' : 'hidden'} ${imgClassName}`}
          style={{ width: containerWidth, height: containerHeight }}
        >
          <Image
            ref={imgRef}
            src={LOGO_SRC}
            alt={wordmark}
            fill
            unoptimized
            style={{ objectFit: 'contain' }}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            priority
          />
        </div>
      )}
      {!loaded && <span className={textClassName}>{wordmark}</span>}
    </>
  );
}
