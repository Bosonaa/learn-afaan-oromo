"use client";

import { useEffect } from "react";
import { asset } from "@/lib/base-path";

export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(asset("/sw.js")).catch(() => {
      /* offline support is a bonus; a failed registration must not break the app */
    });
  }, []);
  return null;
}
