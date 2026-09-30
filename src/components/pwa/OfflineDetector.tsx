/**
 * OfflineDetector.tsx
 * 
 * A small, additive banner that appears only when the browser reports the
 * network is unavailable. It does NOT modify any existing component or layout.
 * 
 * Usage: Rendered once at the App root level (inside ThemeProvider/AuthProvider)
 * so it overlays the existing UI without touching any page component.
 * 
 * Security notes:
 * - Does NOT cache or store any data.
 * - Does NOT fake/mock API responses.
 * - Does NOT affect authentication state.
 * - Only listens to browser online/offline events.
 */

import { useEffect, useState } from "react";

export function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position:        "fixed",
        top:             0,
        left:            0,
        right:           0,
        zIndex:          9999,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        gap:             "0.5rem",
        padding:         "0.5rem 1rem",
        backgroundColor: "#f59e0b",   /* amber-400 — visible in both light/dark */
        color:           "#1c1917",   /* stone-900 — high contrast */
        fontSize:        "0.875rem",
        fontWeight:      500,
        fontFamily:      "inherit",
        boxShadow:       "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      {/* Wi-Fi off icon (inline SVG — no external dep) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <circle cx="12" cy="20" r="1" />
      </svg>
      You are currently offline. Data will reload when your connection is restored.
    </div>
  );
}
