"use client";

import { useState } from "react";
import { artworks, type Technique } from "@/lib/data";
import { ArtworkCard } from "@/components/gallery/ArtworkCard";
import { TechniqueFilter } from "@/components/gallery/TechniqueFilter";
import { motion } from "framer-motion";

export default function GalleryPage() {
  const [selected, setSelected] = useState<Technique | "all">("all");
  const filtered = selected === "all" ? artworks : artworks.filter((a) => a.technique === selected);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-charcoal mb-3">הגלריה</h1>
        <p className="text-gray-warm mb-8">עבודות של תלמידינו ומדריכינו — בחרו טכניקה או גללו בהכל</p>
        <TechniqueFilter selected={selected} onChange={setSelected} />
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((artwork, i) => (
          <motion.div key={artwork.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
            <ArtworkCard artwork={artwork} index={i} />
          </motion.div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-gray-warm py-12">אין עבודות בטכניקה זו כרגע</p>}
    </div>
  );
}
