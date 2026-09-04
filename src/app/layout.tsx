import type { Metadata } from "next";
import { PIECE } from "@/lib/piece.config";
import "./globals.css";

export const metadata: Metadata = {
  title: PIECE.title,
  description: PIECE.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
