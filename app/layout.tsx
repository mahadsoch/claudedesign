import type { Metadata } from "next";
import { Poppins, Open_Sans, JetBrains_Mono } from "next/font/google";
import "../styles/global.css";

// Self-hosted at build time by next/font — no runtime network dependency, so
// PDFs never render in a fallback font.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brand Deck Builder · Soch",
  description: "Create on-brand decks at scale, edit on a canvas, export to PDF.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Font CSS variables go on <html> so the :root brand tokens
    // (--font-title = var(--font-poppins), …) can resolve them.
    <html
      lang="en"
      className={`${poppins.variable} ${openSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
