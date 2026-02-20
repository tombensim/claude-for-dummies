"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Users, Calendar } from "lucide-react";
import { techniqueLabels, levelLabels, type Workshop, type Level } from "@/lib/data";
import { useStudioStore } from "@/lib/store";
import Link from "next/link";

interface WorkshopCardProps {
  workshop: Workshop;
}

export function WorkshopCard({ workshop }: WorkshopCardProps) {
  const isRegistered = useStudioStore((s) => s.isRegistered(workshop.id));
  const spotsLeft = workshop.spotsTotal - workshop.spotsTaken;
  const isFull = spotsLeft <= 0;

  const dateStr = new Date(workshop.date).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-charcoal">{workshop.name}</h3>
          <span className="text-xs text-gray-warm">{techniqueLabels[workshop.technique]}</span>
        </div>
        <Badge variant={workshop.level as Level}>{levelLabels[workshop.level]}</Badge>
      </div>
      <p className="text-sm text-gray-warm mb-4">{workshop.description}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-warm mb-4">
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{dateStr}</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{workshop.time} | {workshop.duration} דקות</span>
        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{workshop.instructor}</span>
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{spotsLeft} מקומות פנויים</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-navy">{workshop.price} &#8362;</span>
        {isRegistered ? (
          <span className="text-sm font-medium text-level-beginner">&#10003; רשום/ה</span>
        ) : isFull ? (
          <span className="text-sm font-medium text-gray-warm">מלא</span>
        ) : (
          <Link href={`/register?workshopId=${workshop.id}`}>
            <Button size="sm" variant="clay">הירשמו</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
