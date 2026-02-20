"use client";

import Link from "next/link";
import { Palette, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "דף הבית" },
  { href: "/gallery", label: "גלריה" },
  { href: "/workshops", label: "סדנאות" },
  { href: "/about", label: "אודות" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-navy">
          <Palette className="w-6 h-6" />
          <span className="text-xl font-bold">סטודיו צבע</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-gray-warm hover:text-navy transition-colors">
              {link.label}
            </Link>
          ))}
          <Link href="/register" className="bg-clay text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-clay-dark transition-colors">
            הרשמה לסדנה
          </Link>
        </nav>

        <button className="md:hidden p-2 text-gray-warm" onClick={() => setMobileOpen(!mobileOpen)} aria-label="תפריט">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className={cn("md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-border", mobileOpen ? "max-h-72" : "max-h-0")}>
        <nav className="flex flex-col px-4 py-3 gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="py-2 px-3 rounded-lg text-sm font-medium text-gray-warm hover:bg-muted hover:text-navy transition-colors" onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/register" className="mt-2 text-center bg-clay text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-clay-dark transition-colors" onClick={() => setMobileOpen(false)}>
            הרשמה לסדנה
          </Link>
        </nav>
      </div>
    </header>
  );
}
