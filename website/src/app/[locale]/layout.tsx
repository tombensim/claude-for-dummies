import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { lilitaOne, playpenSansHebrew, secularOne, dmSans, heebo } from "@/lib/fonts";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const isRTL = locale === "he";
  const fontClasses = `${lilitaOne.variable} ${playpenSansHebrew.variable} ${secularOne.variable} ${dmSans.variable} ${heebo.variable}`;
  const bodyFont = isRTL
    ? "font-[family-name:var(--font-body-he)]"
    : "font-[family-name:var(--font-body-en)]";

  return (
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"}>
      <body className={`${fontClasses} ${bodyFont} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
