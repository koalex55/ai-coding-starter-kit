"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minutes before logout
const WARNING_AT_MS = INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS; // 28 minutes

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

interface UseInactivityTimerReturn {
  showWarning: boolean;
  resetTimer: () => void;
  remainingSeconds: number;
}

export function useInactivityTimer(
  onTimeout: () => void,
  enabled: boolean = true
): UseInactivityTimerReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(120);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    warningTimerRef.current = null;
    logoutTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setRemainingSeconds(120);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingSeconds(120);

      countdownRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, WARNING_AT_MS);

    logoutTimerRef.current = setTimeout(() => {
      clearAllTimers();
      setShowWarning(false);
      onTimeout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearAllTimers, onTimeout]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    startTimers();
  }, [enabled, startTimers]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      return;
    }

    startTimers();

    const handleActivity = () => {
      // Only reset if warning is not showing — if warning is showing,
      // user must click "Aktiv bleiben" to reset
      if (!showWarning) {
        const now = Date.now();
        // Throttle resets to every 30 seconds to avoid excessive timer recreation
        if (now - lastActivityRef.current > 30_000) {
          startTimers();
        }
      }
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
      clearAllTimers();
    };
  }, [enabled, startTimers, clearAllTimers, showWarning]);

  return { showWarning, resetTimer, remainingSeconds };
}
