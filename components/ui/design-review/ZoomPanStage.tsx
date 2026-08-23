'use client';

import { useImageZoomPan } from './useImageZoomPan';

interface ZoomPanStageProps {
  onTap?: (normalizedX: number, normalizedY: number) => void;
  contentRefOut?: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
  borderClassName?: string;
}

// Fixed-size, overflow-hidden viewport wrapping a transformed content box —
// the content box's layout size never changes (CSS transforms don't affect
// flow), so overflow-hidden naturally clips zoomed content back to the
// original frame regardless of current scale/translate.
export default function ZoomPanStage({ onTap, contentRefOut, children, borderClassName }: ZoomPanStageProps) {
  const { stageRef, contentRef, scale, translate, isInteracting, reset, bind } = useImageZoomPan({
    onTap: onTap ?? (() => {}),
  });

  return (
    <div
      ref={stageRef}
      className={`relative w-full touch-none select-none overflow-hidden border ${borderClassName ?? ''}`}
      style={{ touchAction: 'none' }}
      {...bind}
    >
      <div
        ref={(el) => {
          contentRef.current = el;
          contentRefOut?.(el);
        }}
        className="relative aspect-[4/3] w-full"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isInteracting ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>

      {scale !== 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            reset();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-2 top-2 z-10 border border-white/20 bg-black/50 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur-sm hover:border-[#C6A85C] hover:text-[#C6A85C]"
        >
          Reset zoom
        </button>
      )}
    </div>
  );
}
