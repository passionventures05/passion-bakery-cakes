import type { Metadata, Viewport } from "next";
import "@fontsource/great-vibes";
import CapacitorBridge from "@/components/CapacitorBridge";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import ScrollReveal from "@/components/ScrollReveal";
import { site } from "@/lib/site";
import "./globals.css";
import "@/styles/shared.css";
import "@/styles/luxe.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets the Android app draw edge-to-edge; safe areas handled in CSS
  themeColor: "#4a90e2",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | Custom Cakes in ${site.city}`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  icons: { icon: "/Cake_Logo.jpg", apple: "/Cake_Logo.jpg" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    title: `${site.name} | Custom Cakes in ${site.city}`,
    description: site.description,
    images: [{ url: "/og-banner.jpg", width: 1200, height: 600, alt: `${site.name} cakes` }],
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.description, images: ["/og-banner.jpg"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        {/* lets the CSS hide scroll-reveal elements only when JavaScript is actually running */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        {children}
        <FloatingWhatsApp />
        <ScrollReveal />
        <CapacitorBridge />
      </body>
    </html>
  );
}
