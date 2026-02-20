import { Badge } from "@/components/ui/badge";
import { techniqueLabels, type Artwork } from "@/lib/data";

const gradients = [
  "from-navy/15 to-clay/10",
  "from-clay/15 to-gold/15",
  "from-gold/10 to-navy/15",
  "from-navy/10 to-clay/15",
  "from-clay/10 to-gold/10",
  "from-gold/15 to-clay/10",
];

interface ArtworkCardProps {
  artwork: Artwork;
  index: number;
}

export function ArtworkCard({ artwork, index }: ArtworkCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`aspect-[4/5] bg-gradient-to-br ${gradients[index % gradients.length]} relative flex items-center justify-center`}>
        <svg viewBox="0 0 80 80" className="w-16 h-16 text-navy/10" fill="currentColor">
          <rect x="15" y="10" width="50" height="55" rx="2" opacity="0.5" />
          <circle cx="35" cy="32" r="8" opacity="0.4" />
          <path d="M15 50l15-12 10 8 15-15 10 19H15z" opacity="0.3" />
        </svg>
        <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/30 transition-colors flex items-end">
          <p className="text-white text-sm p-4 opacity-0 group-hover:opacity-100 transition-opacity">{artwork.description}</p>
        </div>
      </div>
      <div className="p-4">
        <Badge variant="secondary" className="mb-2 text-[10px]">{techniqueLabels[artwork.technique]}</Badge>
        <h3 className="font-bold text-charcoal mb-1">{artwork.title}</h3>
        <p className="text-xs text-gray-warm">{artwork.artist} | {artwork.dimensions}</p>
      </div>
    </div>
  );
}
