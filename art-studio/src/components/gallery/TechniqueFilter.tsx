"use client";

import { cn } from "@/lib/utils";
import { techniqueLabels, type Technique } from "@/lib/data";

interface TechniqueFilterProps {
  selected: Technique | "all";
  onChange: (t: Technique | "all") => void;
}

export function TechniqueFilter({ selected, onChange }: TechniqueFilterProps) {
  const options: (Technique | "all")[] = ["all", ...Object.keys(techniqueLabels) as Technique[]];
  const labels: Record<string, string> = { all: "הכל", ...techniqueLabels };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {options.map((t) => (
        <button key={t} onClick={() => onChange(t)} className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer", selected === t ? "bg-navy text-white" : "bg-muted text-gray-warm hover:bg-border")}>
          {labels[t]}
        </button>
      ))}
    </div>
  );
}
