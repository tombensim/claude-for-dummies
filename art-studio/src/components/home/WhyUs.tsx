"use client";

import { Users, Award, Paintbrush } from "lucide-react";
import { studioInfo } from "@/lib/data";
import { motion } from "framer-motion";

const icons = [Users, Award, Paintbrush];

export function WhyUs() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2 className="text-3xl font-bold text-charcoal text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          למה סטודיו צבע?
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {studioInfo.values.map((value, i) => {
            const Icon = icons[i];
            return (
              <motion.div key={value.title} className="text-center p-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.15 }}>
                <div className="w-14 h-14 mx-auto mb-4 bg-navy/10 rounded-2xl flex items-center justify-center">
                  <Icon className="w-7 h-7 text-navy" />
                </div>
                <h3 className="text-lg font-bold text-charcoal mb-2">{value.title}</h3>
                <p className="text-sm text-gray-warm leading-relaxed">{value.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
