"use client";

import { PanelLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function ProjectDrawerToggle() {
  const toggle = useAppStore((s) => s.toggleProjectDrawer);

  return (
    <button
      onClick={toggle}
      className="no-drag rounded-md border-2 border-dummy-black bg-dummy-white p-1.5 text-dummy-black transition-colors hover:bg-dummy-black hover:text-dummy-yellow"
      aria-label="Toggle project panel"
    >
      <PanelLeft className="size-4" />
    </button>
  );
}
