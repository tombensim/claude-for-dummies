import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude for Beginners",
  description: "From idea to reality. No code required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
