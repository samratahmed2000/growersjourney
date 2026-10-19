import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE, siteUrl } from "@/lib/content/site";

/**
 * Inter is loaded through next/font, which self-hosts the font files and
 * removes a third-party request. The CSS variable is consumed by
 * `--font-sans` in globals.css.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "web application development",
    "business automation",
    "AI integration",
    "Next.js development",
    "Growers Journy",
  ],
  authors: [{ name: SITE.founder.name }],
  creator: SITE.founder.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-canvas text-ink">{children}</body>
    </html>
  );
}
