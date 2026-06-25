import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";

import Navbar from "@/components/Navbar";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ModalProvider } from "@/components/ModalContext";
import AuthModals from "@/components/AuthModals";

// Configure Geist Sans and Mono fonts from Google Fonts with CSS variables
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Define global metadata for the Next.js application
export const metadata: Metadata = {
  title: "speed math",
  description: "Speed Math Practice Platform",
};

/**
 * RootLayout component wraps all pages with required global providers:
 * - SessionProviderWrapper: Manages user authentication sessions.
 * - ModalProvider: Provides context for handling authentication modals globally.
 * - Navbar & AuthModals: Renders global navigation and auth dialog components.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SessionProviderWrapper>
          <ModalProvider>
            <Navbar />
            {children}
            <AuthModals />
          </ModalProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

