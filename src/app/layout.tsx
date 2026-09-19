import type { Metadata } from "next";

import { Cursor, faviconIcons, Logo } from "@design-system";
import { mono, sans } from "@design-system/fonts";

import { NOTE_STRIKE_EVENT } from "@/lib/engine/note-strike-event";
import { PIECE } from "@/lib/piece.config";

import "./globals.css";

export const metadata: Metadata = {
  title: PIECE.title,
  description: PIECE.description,
  icons: faviconIcons,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Logo
          tone="light"
          alt="Daniel Isaac Miller"
          href="https://danielisaacmiller.com"
        />
        <Cursor color="var(--cursor-color)" strikeEvent={NOTE_STRIKE_EVENT} />
        {children}
      </body>
    </html>
  );
}
