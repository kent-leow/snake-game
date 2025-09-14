/**
 * React hooks for game loop management and performance monitoring
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { GameLoop, type GameLoopCallbacks, type GameLoopOptions } from '@/lib/game/gameLoop';
import { type PerformanceStats } from '@/lib/game/performance';
import { AdaptiveTimer } from '@/lib/game/timing';

/**
 * Options for the useGameLoop hook
 */
export interface UseGameLoopOptions extends GameLoopOptions {
  enabled: boolean;
  autoStart?: boolean;
}

/**
 * Game loop hook that manages a high-performance game loop with React lifecycle
 */
export const useGameLoop = (
  onUpdate: (deltaTime: number, interpolation: number) => void,
  onRender: (interpolation: number) => void,
  options: UseGameLoopOptions & {
    onPerformanceUpdate?: (stats: PerformanceStats) => void;
  }
) => {
  const {
    enabled,
    autoStart = true,
    targetFPS = 60,
    maxDeltaTime = 100,
    enablePerformanceMonitoring = true,
    adaptiveQuality = true,
    onPerformanceUpdate,
  } = options;

  const gameLoopRef = useRef<GameLoop | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);

  // Callback refs to ensure they're stable
  const onUpdateRef = useRef(onUpdate);
  const onRenderRef = useRef(onRender);
  const onPerformanceUpdateRef = useRef(onPerformanceUpdate);

  // Update refs when callbacks change
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onRenderRef.current = onRender;
  }, [onRender]);

  useEffect(() => {
    onPerformanceUpdateRef.current = onPerformanceUpdate;
  }, [onPerformanceUpdate]);

  // Create stable callbacks
  const updateCallback = useCallback((deltaTime: number, interpolation: number) => {
    onUpdateRef.current(deltaTime, interpolation);
  }, []);

  const renderCallback = useCallback((interpolation: number) => {
    onRenderRef.current(interpolation);
  }, []);

  const performanceCallback = useCallback((stats: PerformanceStats) => {
    setPerformanceStats(stats);
    onPerformanceUpdateRef.current?.(stats);
  }, []);

  // Initialize game loop
  useEffect(() => {
    if (!enabled) {
      gameLoopRef.current?.stop();
      setIsRunning(false);
      setIsPaused(false);
      return;
    }

    const callbacks: GameLoopCallbacks = {
      onUpdate: updateCallback,
      onRender: renderCallback,
      onPerformanceUpdate: performanceCallback,
    };

    const options: GameLoopOptions = {
      targetFPS,
      maxDeltaTime,
      enablePerformanceMonitoring,
      adaptiveQuality,
    };

    gameLoopRef.current = new GameLoop(callbacks, options);

    if (autoStart) {
      gameLoopRef.current.start();
      setIsRunning(true);
    }

    return () => {
      gameLoopRef.current?.stop();
      gameLoopRef.current = null;
      setIsRunning(false);
      setIsPaused(false);
    };
  }, [enabled, targetFPS, maxDeltaTime, enablePerformanceMonitoring, adaptiveQuality, autoStart, updateCallback, renderCallback, performanceCallback]);

  // Control functions
  const start = useCallback(() => {
    gameLoopRef.current?.start();
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    gameLoopRef.current?.stop();
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    gameLoopRef.current?.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    gameLoopRef.current?.resume();
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }, [isPaused, pause, resume]);

  // Get current stats
  const getStats = useCallback(() => {
    return gameLoopRef.current?.getPerformanceStats() ?? null;
  }, []);

  const getRuntime = useCallback(() => {
    return gameLoopRef.current?.getRuntime() ?? 0;
  }, []);

  const getFrameCount = useCallback(() => {
    return gameLoopRef.current?.getFrameCount() ?? 0;
  }, []);

  return {
    // State
    isRunning,
    isPaused,
    isActive: isRunning && !isPaused,
    performanceStats,

    // Controls
    start,
    stop,
    pause,
    resume,
    togglePause,

    // Stats
    getStats,
    getRuntime,
    getFrameCount,

    // Internal ref for advanced usage
    gameLoopRef,
  };
};

/**
 * Hook for updating callback references without recreating the game loop
 */
export const useGameLoopCallbacks = (
  onUpdate: (deltaTime: number, interpolation: number) => void,
  onRender: (interpolation: number) => void,
  onPerformanceUpdate?: (stats: PerformanceStats) => void
) => {
  const onUpdateRef = useRef(onUpdate);
  const onRenderRef = useRef(onRender);
  const onPerformanceUpdateRef = useRef(onPerformanceUpdate);

  // Update refs when callbacks change
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onRenderRef.current = onRender;
  }, [onRender]);

  useEffect(() => {
    onPerformanceUpdateRef.current = onPerformanceUpdate;
  }, [onPerformanceUpdate]);

  return {
    onUpdateRef,
    onRenderRef,
    onPerformanceUpdateRef,
  };
};

/**
 * Adaptive timing hook that adjusts FPS based on performance
 */
export const useAdaptiveTiming = (
  initialFPS = 60,
  minFPS = 30,
  maxFPS = 120
) => {
  const timerRef = useRef<AdaptiveTimer>(new AdaptiveTimer(initialFPS, minFPS, maxFPS));
  const [currentFPS, setCurrentFPS] = useState(initialFPS);
  const [measuredFPS, setMeasuredFPS] = useState(initialFPS);

  const update = useCallback((currentTime?: number) => {
    const deltaTime = timerRef.current.update(currentTime);
    setCurrentFPS(timerRef.current.getCurrentFPS());
    setMeasuredFPS(timerRef.current.getMeasuredFPS());
    return deltaTime;
  }, []);

  const setTargetFPS = useCallback((fps: number) => {
    timerRef.current.setTargetFPS(fps);
    setCurrentFPS(fps);
  }, []);

  const reset = useCallback(() => {
    timerRef.current.reset();
    setCurrentFPS(initialFPS);
    setMeasuredFPS(initialFPS);
  }, [initialFPS]);

  return {
    currentFPS,
    measuredFPS,
    update,
    setTargetFPS,
    reset,
  };
};

/**
 * Game timing hook for simple frame-based timing
 */
export const useGameTiming = (targetFPS = 60) => {
  const lastTimeRef = useRef<number>(0);
  const deltaTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0, fps: 0 });

  const tick = useCallback((currentTime: number = performance.now()) => {
    // Calculate delta time
    deltaTimeRef.current = lastTimeRef.current === 0 ? 0 : currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    // Update FPS counter
    const fpsCounter = fpsCounterRef.current;
    fpsCounter.frames++;
    
    if (currentTime - fpsCounter.lastTime >= 1000) {
      fpsCounter.fps = Math.round((fpsCounter.frames * 1000) / (currentTime - fpsCounter.lastTime));
      fpsCounter.frames = 0;
      fpsCounter.lastTime = currentTime;
    }

    return deltaTimeRef.current;
  }, []);

  const getDeltaTime = useCallback(() => deltaTimeRef.current, []);
  const getFPS = useCallback(() => fpsCounterRef.current.fps, []);
  const getTargetFrameTime = useCallback(() => 1000 / targetFPS, [targetFPS]);

  const reset = useCallback(() => {
    lastTimeRef.current = 0;
    deltaTimeRef.current = 0;
    fpsCounterRef.current = { frames: 0, lastTime: 0, fps: 0 };
  }, []);

  return {
    tick,
    getDeltaTime,
    getFPS,
    getTargetFrameTime,
    reset,
  };
};