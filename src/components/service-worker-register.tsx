"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js?v=3", { updateViaCache: "none" }).then((registration) => registration.update()).catch(() => undefined);
    }
  }, []);

  return null;
}
