"use client";

import { artworks, techniqueLabels } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import Link from "next/link";

const gradients = [
  "from-navy/15 to-clay/15",
  "from-clay/15 to-gold/20",
  "from-gold/15 to-navy/10",
  "from-navy/10 to-gold/15",
];

export function FeaturedWorks() {
  const featured = artworks.filter((a) => a.featured);

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <h2 className="text-3xl font-bold text-charcoal mb-3">עבודות נבחרות</h2>
        <p className="text-gray-warm">מתוך הגלריה של תלמידינו ומדריכינו</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featured.map((artwork, i) => (
          <motion.div key={artwork.id} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}>
            <div className={`aspect-[4/5] bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center`}>
              <svg viewBox="0 0 80 80" className="w-16 h-16 text-navy/15" fill="currentColor">
                <rect x="15" y="10" width="50" height="55" rx="2" opacity="0.5" />
                <circle cx="35" cy="32" r="8" opacity="0.4" />
                <path d="M15 50l15-12 10 8 15-15 10 19H15z" opacity="0.3" />
              </svg>
            </div>
            <div className="p-4">
              <Badge variant="secondary" className="mb-2">{techniqueLabels[artwork.technique]}</Badge>
              <h3 className="font-bold text-charcoal mb-1">{artwork.title}</h3>
              <p className="text-xs text-gray-warm">{artwork.artist} | {artwork.dimensions}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link href="/gallery" className="text-sm font-medium text-navy hover:text-navy-dark transition-colors">לגלריה המלאה &larr;</Link>
      </div>
    </section>
  );
}
