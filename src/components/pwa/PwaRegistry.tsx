"use client";

import { useEffect } from "react";

export function PwaRegistry() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register after page load to prevent blocking hydration and initial auth flow
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            if (process.env.NODE_ENV === 'development') {
              console.log("ServiceWorker registration successful with scope: ", registration.scope);
            }
          },
          (err) => {
            if (process.env.NODE_ENV === 'development') {
              console.log("ServiceWorker registration failed: ", err);
            }
          }
        );
      });
    }
  }, []);

  return null;
}
