"use client";

import { useEffect, useRef, useCallback } from "react";
import { logoutRequest } from "./auth";

const IDLE_MS         = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE  = 60 * 1000;       // show warning 1 minute before logout
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

interface UseIdleTimeoutOptions {
  onWarning?: (secondsLeft: number) => void; // called once when warning window starts
  onLogout?:  () => void;                    // called just before the actual logout
}

/**
 * Auto-logs out the user after IDLE_MS of no interaction.
 * Shows a warning WARN_BEFORE ms before logout so the UI can alert the user.
 *
 * Usage: call in a layout component that wraps authenticated pages.
 */
export function useIdleTimeout({ onWarning, onLogout }: UseIdleTimeoutOptions = {}) {
  const warnTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warned      = useRef(false);

  const clearTimers = useCallback(() => {
    if (warnTimer.current)   clearTimeout(warnTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    warned.current = false;

    warnTimer.current = setTimeout(() => {
      warned.current = true;
      onWarning?.(Math.round(WARNING_BEFORE / 1000));
    }, IDLE_MS - WARNING_BEFORE);

    logoutTimer.current = setTimeout(async () => {
      onLogout?.();
      await logoutRequest();
      window.location.replace("/login");
    }, IDLE_MS);
  }, [clearTimers, onWarning, onLogout]);

  useEffect(() => {
    // Start timers on mount
    reset();

    // Reset on any user activity
    const handleActivity = () => {
      if (!warned.current) reset(); // don't reset if already in warning window
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [reset, clearTimers]);
}
