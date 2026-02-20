import { Palette, Phone, Mail, MapPin, Clock } from "lucide-react";
import { studioInfo } from "@/lib/data";

export function Footer() {
  return (
    <footer className="bg-charcoal text-white mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-gold" />
              <span className="text-lg font-bold">{studioInfo.name}</span>
            </div>
            <p className="text-sm text-white/70">{studioInfo.tagline}</p>
          </div>
          <div>
            <h3 className="font-bold mb-4">צרו קשר</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" />{studioInfo.address}</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /><a href={`tel:${studioInfo.phone}`} className="hover:text-white transition-colors">{studioInfo.phone}</a></li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" /><a href={`mailto:${studioInfo.email}`} className="hover:text-white transition-colors">{studioInfo.email}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">שעות פעילות</h3>
            <ul className="space-y-2 text-sm text-white/70">
              {studioInfo.hours.map((h) => (
                <li key={h.days} className="flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{h.days}: <strong className="text-white/90">{h.time}</strong></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} {studioInfo.name}. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  );
}
