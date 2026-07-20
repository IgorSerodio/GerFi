import { useState, useEffect, useRef, useCallback } from "react";

export function useTvTimers() {
  const [time, setTime] = useState<Date>(new Date());
  const [isIdle, setIsIdle] = useState(true);
  const [showControls, setShowControls] = useState(true);
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 30000); // 30 seconds
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 5000); // 5 seconds
  }, []);

  useEffect(() => {
    setTimeout(() => resetControlsTimer(), 0);
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetControlsTimer]);

  return { time, isIdle, setIsIdle, showControls, resetIdleTimer, resetControlsTimer };
}
