import type { Metadata } from "next";
import Script from "next/script";
import "../styles/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import {
  lilitaOne,
  playpenSansHebrew,
  secularOne,
  dmSans,
  heebo,
} from "@/lib/fonts";
import RendererLoggerInit from "@/components/renderer-logger-init";

export const metadata: Metadata = {
  title: "Claude for Beginners",
  description: "From idea to reality. No code required.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRTL = locale === "he";
  const fontClasses = `${lilitaOne.variable} ${playpenSansHebrew.variable} ${secularOne.variable} ${dmSans.variable} ${heebo.variable}`;
  const bodyFont = isRTL
    ? "font-[family-name:var(--font-body-he)]"
    : "font-[family-name:var(--font-body-en)]";

  return (
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"}>
      <head>
        <Script src="/electron-hmr-fix.js" strategy="beforeInteractive" />
      </head>
      <body className={`${fontClasses} ${bodyFont} antialiased`}>
        <RendererLoggerInit />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
