import type { Metadata } from "next";
import "@iantroisi/ui/styles.css";
import "@iantroisi/sickmaps/css";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "NYC Subway & NJ Rail · iliketrains",
  description: "Live NYC Subway and NJ Transit map — Next.js, steddy, Troisi UI, sickmaps",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
