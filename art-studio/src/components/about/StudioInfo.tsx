"use client";

import { studioInfo } from "@/lib/data";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function StudioInfo() {
  return (
    <div className="space-y-12">
      {/* Story */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
        <h2 className="text-2xl font-bold text-charcoal mb-4">הסיפור שלנו</h2>
        <p className="text-gray-warm leading-relaxed text-lg">{studioInfo.story}</p>
      </motion.section>

      {/* Artist */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
        <h2 className="text-2xl font-bold text-charcoal mb-6">הכירו את {studioInfo.artist.name}</h2>
        <div className="bg-white p-6 rounded-xl border border-border flex flex-col md:flex-row gap-6 items-start">
          <div className="w-32 h-32 bg-gradient-to-br from-navy/15 to-clay/15 rounded-xl shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 80 80" className="w-16 h-16 text-navy/20" fill="currentColor">
              <circle cx="40" cy="28" r="14" />
              <ellipse cx="40" cy="65" rx="22" ry="15" opacity="0.6" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-charcoal">{studioInfo.artist.name}</h3>
            <p className="text-sm text-clay font-medium mb-2">{studioInfo.artist.title}</p>
            <p className="text-sm text-gray-warm leading-relaxed">{studioInfo.artist.bio}</p>
          </div>
        </div>
      </motion.section>

      {/* Values */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}>
        <h2 className="text-2xl font-bold text-charcoal mb-6">הערכים שלנו</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {studioInfo.values.map((v) => (
            <div key={v.title} className="bg-white p-6 rounded-xl border border-border">
              <h3 className="font-bold text-charcoal mb-2">{v.title}</h3>
              <p className="text-sm text-gray-warm">{v.description}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Contact */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
        <h2 className="text-2xl font-bold text-charcoal mb-6">בואו לבקר</h2>
        <div className="bg-white p-8 rounded-xl border border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-navy mt-0.5 shrink-0" /><div><p className="font-medium text-charcoal">כתובת</p><p className="text-sm text-gray-warm">{studioInfo.address}</p></div></div>
              <div className="flex items-start gap-3"><Phone className="w-5 h-5 text-navy mt-0.5 shrink-0" /><div><p className="font-medium text-charcoal">טלפון</p><p className="text-sm text-gray-warm">{studioInfo.phone}</p></div></div>
              <div className="flex items-start gap-3"><Mail className="w-5 h-5 text-navy mt-0.5 shrink-0" /><div><p className="font-medium text-charcoal">אימייל</p><p className="text-sm text-gray-warm">{studioInfo.email}</p></div></div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-navy" /><p className="font-medium text-charcoal">שעות פעילות</p></div>
              <ul className="space-y-2">
                {studioInfo.hours.map((h) => (
                  <li key={h.days} className="flex justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                    <span className="text-gray-warm">{h.days}</span>
                    <span className="font-medium text-charcoal">{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
