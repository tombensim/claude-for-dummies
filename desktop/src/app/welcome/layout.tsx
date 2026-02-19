import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claude for Beginners",
  description: "Build anything with AI",
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
