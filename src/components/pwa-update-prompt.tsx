"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function PwaUpdatePrompt() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    function showUpdateToast() {
      toast("Update verfügbar", {
        description:
          "Eine neue Version der App ist bereit.",
        duration: Infinity,
        action: {
          label: "Jetzt aktualisieren",
          onClick: () => {
            window.location.reload();
          },
        },
      });
    }

    // Listen for a new service worker taking control
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      showUpdateToast();
    });

    // Check if there is already a waiting service worker
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        showUpdateToast();
      }

      // Listen for future updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showUpdateToast();
          }
        });
      });
    });
  }, []);

  return null;
}
