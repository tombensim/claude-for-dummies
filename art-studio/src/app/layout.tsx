import type { Metadata } from "next";
import { Assistant } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "@/styles/globals.css";

const assistant = Assistant({ subsets: ["hebrew", "latin"], variable: "--font-assistant" });

export const metadata: Metadata = {
  title: "סטודיו צבע | סדנאות ציור בתל אביב",
  description: "סטודיו ציור בלב תל אביב. סדנאות לכל הרמות — שמן, אקוורל, אקריליק, פחם ועוד. צבעו את העולם שלכם.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${assistant.variable} font-sans antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
