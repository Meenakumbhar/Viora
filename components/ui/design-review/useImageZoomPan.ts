'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const TAP_MAX_TRAVEL_PX = 8;

interface Point {
  x: number;
  y: number;
}

interface Gesture {
  startPoint: Point;
  startTranslate: Point;
  travel: number;
  isPinch: boolean;
  pinchStartDistance: number | null;
  pinchStartScale: number;
}

interface UseImageZoomPanOptions {
  /** Fired for a genuine tap/click — not a drag or pinch. Coordinates are normalized 0..1 against the image's current on-screen box, so they stay correct at any zoom/pan. */
  onTap: (normalizedX: number, normalizedY: number) => void;
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Zoom/pan is hand-rolled rather than pulled from a library: pin coordinates
// are normalized against the image's live (post-transform) bounding rect, so
// panning and pinch-zoom need to share pointer-event bookkeeping with the
// pin-drop logic below — a black-box gesture library would own pointer
// events and fight that. Tap-to-pin itself, though, is a plain `onClick` —
// the browser's own tap/click synthesis is more reliable across real
// touch hardware than reimplementing "was this a tap" from raw pointer
// timing (an earlier duration/travel-based version, combined with
// setPointerCapture, hung real touch interactions in testing — the browser
// already solves this correctly on both mouse and touch).
export function useImageZoomPan({ onTap }: UseImageZoomPanOptions) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);

  const pointers = useRef<Map<number, Point>>(new Map());
  const gesture = useRef<Gesture | null>(null);
  // Set whenever a pointer sequence moves enough (or involves a pinch) to
  // count as a drag/zoom rather than a tap — checked by onClick, which
  // fires right after pointerup, to decide whether to drop a pin.
  const suppressNextClick = useRef(false);

  const clampTranslate = useCallback((next: Point, forScale: number) => {
    const stage = stageRef.current;
    if (!stage) return next;
    const rect = stage.getBoundingClientRect();
    const maxX = (Math.max(forScale, 1) - 1) * rect.width * 0.5;
    const maxY = (Math.max(forScale, 1) - 1) * rect.height * 0.5;
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 1) {
        gesture.current = {
          startPoint: { x: e.clientX, y: e.clientY },
          startTranslate: translate,
          travel: 0,
          isPinch: false,
          pinchStartDistance: null,
          pinchStartScale: scale,
        };
      } else if (pointers.current.size === 2 && gesture.current) {
        const [a, b] = Array.from(pointers.current.values());
        gesture.current.isPinch = true;
        gesture.current.pinchStartDistance = distance(a, b);
        gesture.current.pinchStartScale = scale;
        suppressNextClick.current = true;
        setIsInteracting(true);
      }
    },
    [scale, translate]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const g = gesture.current;
      if (!g) return;

      if (g.isPinch && pointers.current.size === 2 && g.pinchStartDistance) {
        const [a, b] = Array.from(pointers.current.values());
        const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, g.pinchStartScale * (distance(a, b) / g.pinchStartDistance)));
        setScale(nextScale);
        setTranslate((prev) => clampTranslate(prev, nextScale));
        return;
      }

      if (pointers.current.size === 1) {
        const dx = e.clientX - g.startPoint.x;
        const dy = e.clientY - g.startPoint.y;
        g.travel = Math.hypot(dx, dy);
        if (scale > 1 || g.travel > TAP_MAX_TRAVEL_PX) {
          suppressNextClick.current = true;
          setIsInteracting(true);
          setTranslate(clampTranslate({ x: g.startTranslate.x + dx, y: g.startTranslate.y + dy }, scale));
        }
      }
    },
    [scale, clampTranslate]
  );

  const endPointer = useCallback(
    (e: React.PointerEvent) => {
      const wasTracked = pointers.current.has(e.pointerId);
      pointers.current.delete(e.pointerId);
      if (!wasTracked) return;

      if (pointers.current.size === 0) {
        gesture.current = null;
        setIsInteracting(false);
      } else if (pointers.current.size === 1) {
        // Downgrading from a pinch (or a stray extra pointer) back to one
        // finger — treat the remainder as an in-progress pan.
        const [remaining] = Array.from(pointers.current.values());
        gesture.current = {
          startPoint: remaining,
          startTranslate: translate,
          travel: TAP_MAX_TRAVEL_PX + 1,
          isPinch: false,
          pinchStartDistance: null,
          pinchStartScale: scale,
        };
        suppressNextClick.current = true;
      }
    },
    [translate, scale]
  );

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (suppressNextClick.current) {
        suppressNextClick.current = false;
        return;
      }
      const rect = contentRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      onTap(x, y);
    },
    [onTap]
  );

  // React attaches JSX `onWheel` as a passive listener, so `preventDefault()`
  // inside it is a silent no-op (and logs a console warning) — the browser's
  // own page-scroll would fire alongside our zoom. A native listener with
  // `{ passive: false }` is the only way to actually suppress it.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = stage!.getBoundingClientRect();
      const cursor = { x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 };
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale - e.deltaY * 0.0015 * scale));
      const factor = nextScale / scale;
      const nextTranslate = clampTranslate(
        { x: cursor.x - (cursor.x - translate.x) * factor, y: cursor.y - (cursor.y - translate.y) * factor },
        nextScale
      );
      setScale(nextScale);
      setTranslate(nextTranslate);
    }

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [scale, translate, clampTranslate]);

  const onDoubleClick = useCallback(() => {
    if (scale > 1) {
      reset();
    } else {
      setScale(DOUBLE_TAP_SCALE);
    }
  }, [scale, reset]);

  return {
    stageRef,
    contentRef,
    scale,
    translate,
    isInteracting,
    reset,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onClick,
      onDoubleClick,
    },
  };
}
