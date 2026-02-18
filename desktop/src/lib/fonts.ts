import { DM_Sans, Heebo, Lilita_One, Playpen_Sans_Hebrew, Secular_One } from "next/font/google";

export const lilitaOne = Lilita_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const playpenSansHebrew = Playpen_Sans_Hebrew({
  subsets: ["hebrew"],
  weight: ["700", "800"],
  variable: "--font-display-he-hand",
  display: "swap",
});

export const secularOne = Secular_One({
  subsets: ["hebrew", "latin"],
  weight: "400",
  variable: "--font-display-he",
  display: "swap",
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body-en",
  display: "swap",
});

export const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-body-he",
  display: "swap",
});
