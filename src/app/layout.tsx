import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PwaRegistry } from "@/components/pwa/PwaRegistry";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { AuthProvider } from "@/shared/components/AuthProvider";
import { GlobalLoaderOverlay } from "@/shared/components/GlobalLoaderOverlay";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MYFIT | Premium Personal Fitness",
  description: "Your intelligent space to track workouts, build consistency, and engineer real progress.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MYFIT",
  },
};

export const viewport: Viewport = {
  themeColor: "#020B1A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased min-h-screen overflow-hidden`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <GlobalLoaderOverlay />
        <PwaRegistry />
        <InstallPrompt />
      </body>
    </html>
  );
}
