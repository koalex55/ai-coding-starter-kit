"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function PwaUpdatePrompt() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let waitingWorker: ServiceWorker | null = null;

    function activateUpdate() {
      // Tell the waiting SW to skip waiting and take control
      if (waitingWorker) {
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
      }
      window.location.reload();
    }

    function showUpdateToast() {
      toast("Update verfügbar", {
        description: "Eine neue Version der App ist bereit.",
        duration: Infinity,
        action: {
          label: "Jetzt aktualisieren",
          onClick: activateUpdate,
        },
      });
    }

    // Reload once the new SW has taken control
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        waitingWorker = registration.waiting;
        showUpdateToast();
      }

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            waitingWorker = newWorker;
            showUpdateToast();
          }
        });
      });
    });
  }, []);

  return null;
}
