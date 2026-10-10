"use client";

import { Capacitor } from "@capacitor/core";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Android app only: hardware back button navigates back, and exits from the home screen. */
export default function CapacitorBridge() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;
    import("@capacitor/app").then(({ App }) => {
      App.addListener("backButton", () => {
        if (pathname === "/" || pathname === "") App.exitApp();
        else router.back();
      }).then((h) => (remove = () => h.remove()));
    });
    return () => remove?.();
  }, [pathname, router]);

  return null;
}
