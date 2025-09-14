import { useRef, useEffect, useCallback } from 'react';
import { setupCanvasContext } from '@/lib/utils/canvas';

/**
 * Canvas management hook for handling canvas lifecycle and context
 */
export interface UseCanvasProps {
  width: number;
  height: number;
  onCanvasReady?: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => void;
}

export interface UseCanvasReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  contextRef: React.RefObject<CanvasRenderingContext2D | null>;
  isReady: boolean;
}

export function useCanvas({ width, height, onCanvasReady }: UseCanvasProps): UseCanvasReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isReadyRef = useRef<boolean>(false);

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = setupCanvasContext(canvas);
    if (!context) return;

    contextRef.current = context;
    isReadyRef.current = true;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Call ready callback
    if (onCanvasReady) {
      onCanvasReady(canvas, context);
    }
  }, [width, height, onCanvasReady]);

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  // Reinitialize if dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  return {
    canvasRef,
    contextRef,
    isReady: isReadyRef.current,
  };
}