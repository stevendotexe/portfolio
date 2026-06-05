import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stevensimbolon.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Steven Simbolon | Fullstack Developer",
    template: "%s | Steven Simbolon",
  },
  description:
    "Steven Simbolon — Fullstack Developer and Software Engineering student at Indonesian University of Education. Building interfaces from outer space.",
  keywords: [
    "Steven Simbolon",
    "Fullstack Developer",
    "Software Engineer",
    "Web Developer",
    "Indonesia",
    "Bandung",
    "Portfolio",
  ],
  authors: [{ name: "Steven Martua Christian Simbolon" }],
  creator: "Steven Martua Christian Simbolon",
  icons: {
    icon: "/Logo with Background.ico",
  },
  openGraph: {
    type: "website",
    title: "Steven Simbolon | Fullstack Developer",
    description:
      "Software Engineering student & fullstack developer based in Indonesia. Interface. Outer Space.",
    siteName: "Steven Simbolon",
    images: [
      {
        url: "/frontpage.png",
        width: 1200,
        height: 630,
        alt: "Steven Simbolon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Steven Simbolon | Fullstack Developer",
    description:
      "Software Engineering student & fullstack developer based in Indonesia.",
    images: ["/frontpage.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${dmSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
