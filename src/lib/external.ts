import { Capacitor } from "@capacitor/core";
import { site } from "./site";

/**
 * Opens WhatsApp with a prefilled message.
 * - Web: opens the wa.me/api.whatsapp.com link in a new tab.
 * - Android app (Capacitor): opens the WhatsApp app directly, falling back to the browser link.
 */
export async function openWhatsApp(message: string) {
  const text = encodeURIComponent(message);
  const webUrl = `https://api.whatsapp.com/send?phone=${site.whatsappNumber}&text=${text}`;

  if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
    try {
      const { AppLauncher } = await import("@capacitor/app-launcher");
      await AppLauncher.openUrl({ url: `whatsapp://send?phone=${site.whatsappNumber}&text=${text}` });
      return;
    } catch {
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: webUrl });
        return;
      } catch {
        /* fall through */
      }
    }
  }
  window.open(webUrl, "_blank", "noopener");
}

/** Opens a non-web link (e.g. a upi:// payment link). Inside the Android app it goes through the app launcher. */
export async function openExternalUrl(url: string) {
  if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
    try {
      const { AppLauncher } = await import("@capacitor/app-launcher");
      await AppLauncher.openUrl({ url });
      return;
    } catch {
      /* fall through */
    }
  }
  window.location.href = url;
}

/** True on phones/tablets and in the Android app (where UPI apps can be opened directly). */
export const isMobileDevice = () =>
  typeof navigator !== "undefined" && (Capacitor.isNativePlatform() || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
