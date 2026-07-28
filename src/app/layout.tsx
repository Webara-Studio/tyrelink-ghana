import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "TyreLink Ghana",
  description: "Compare tyres and book fitting at an approved Ghanaian station.",
  applicationName: "TyreLink Ghana",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f5b72b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GH">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
