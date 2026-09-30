import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Occhiale Matto — Email Intelligence Platform",
  description: "AI-powered email marketing for Occhiale Matto"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
