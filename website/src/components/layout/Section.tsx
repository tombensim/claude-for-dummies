import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  surface?: boolean;
}

export default function Section({
  id,
  children,
  className,
  surface = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "section-padding py-20 md:py-28",
        surface && "bg-bg-surface",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}
