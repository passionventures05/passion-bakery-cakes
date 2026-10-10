import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.passionbakerynchocos.cakes",
  appName: "PasssionBakeryNChocos",
  webDir: "out", // Next.js static export output
  server: { androidScheme: "https" },
};

export default config;
