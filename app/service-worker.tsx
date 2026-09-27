"use client";

import { useEffect } from "react";
import { asset } from "@/lib/base-path";

export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // A worker installed by an earlier production build on the same origin
      // would keep serving that build's cached chunks over `next dev`.
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister())),
        )
        .then(() => caches.keys())
        .then((keys) =>
          Promise.all(
            keys.filter((key) => key.startsWith("barsiisaa-")).map((key) => caches.delete(key)),
          ),
        )
        .catch(() => {
          /* best effort: a stale cache is a nuisance, not a failure */
        });
      return;
    }
    navigator.serviceWorker.register(asset("/sw.js")).catch(() => {
      /* offline support is a bonus; a failed registration must not break the app */
    });
  }, []);
  return null;
}
