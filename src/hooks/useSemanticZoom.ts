import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';

const ZOOM_OUT_THRESHOLD = 0.6;

/**
 * Detects the Win8 semantic-zoom gesture: ctrl+wheel (trackpad pinch emits
 * synthetic ctrl+wheel) and two-finger pinch on touch. Below 0.6 scale → zoom
 * out to the group overview; pinching back in exits.
 */
export function useSemanticZoom(enabled: boolean) {
  const setSemanticZoom = useUiStore((s) => s.setSemanticZoom);

  useEffect(() => {
    if (!enabled) return;

    let scale = 1;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      scale = clamp(scale - e.deltaY * 0.01, 0.3, 1.2);
      setSemanticZoom(scale < ZOOM_OUT_THRESHOLD);
    };

    // Two-finger pinch tracking.
    const points = new Map<number, { x: number; y: number }>();
    let startDist = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (points.size === 2) startDist = pinchDistance(points);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!points.has(e.pointerId)) return;
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (points.size === 2 && startDist > 0) {
        const ratio = pinchDistance(points) / startDist;
        setSemanticZoom(ratio < ZOOM_OUT_THRESHOLD);
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      points.delete(e.pointerId);
      if (points.size < 2) startDist = 0;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [enabled, setSemanticZoom]);
}

function pinchDistance(points: Map<number, { x: number; y: number }>): number {
  const [a, b] = [...points.values()];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
