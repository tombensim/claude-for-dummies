"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-bl from-secondary via-cream-light to-white">
      <div className="max-w-6xl mx-auto px-4 py-20 md:py-32">
        <div className="max-w-2xl">
          <motion.h1 className="text-4xl md:text-6xl font-bold text-charcoal leading-tight mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            צבעו את
            <br />
            <span className="text-navy">העולם שלכם</span>
          </motion.h1>
          <motion.p className="text-lg md:text-xl text-gray-warm mb-8 leading-relaxed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            סטודיו ציור בלב תל אביב. סדנאות לכל הרמות, מדריכים מנוסים,
            וחומרים איכותיים — הכל כדי שתגלו את האמן שבכם.
          </motion.p>
          <motion.div className="flex flex-wrap gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <Link href="/workshops" className={buttonVariants({ size: "xl" })}>לסדנאות</Link>
            <Link href="/gallery" className={buttonVariants({ size: "xl", variant: "outline" })}>לגלריה</Link>
          </motion.div>
        </div>
      </div>
      <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-clay/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-navy/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
