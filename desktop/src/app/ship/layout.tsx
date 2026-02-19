import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ship",
  description: "Deploy your project",
};

export default function ShipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
