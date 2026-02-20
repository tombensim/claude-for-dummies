"use client";

import { workshops } from "@/lib/data";
import { WorkshopCard } from "@/components/workshops/WorkshopCard";
import { motion } from "framer-motion";

export default function WorkshopsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-charcoal mb-3">סדנאות</h1>
        <p className="text-gray-warm">הסדנאות הקרובות שלנו — בחרו ובואו ליצור</p>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {workshops.map((ws, i) => (
          <motion.div key={ws.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }}>
            <WorkshopCard workshop={ws} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
