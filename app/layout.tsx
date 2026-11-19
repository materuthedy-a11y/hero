import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Materu · Cropped Puffer",
  description:
    "Cropped puffer jacket in five colours. The page colour changes with every jacket.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Materu",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/brand/materu-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/materu-app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/brand/materu-apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#b5420a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" as="image" href="/img/ember.webp" type="image/webp" />
      </head>
      <body>{children}</body>
    </html>
  );
}
