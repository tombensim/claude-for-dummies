import Image from "next/image";

interface MascotImageProps {
  pose: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export default function MascotImage({
  pose,
  alt,
  width = 300,
  height = 300,
  className,
  priority = false,
}: MascotImageProps) {
  return (
    <Image
      src={`/mascot/${pose}.png`}
      alt={alt}
      width={width}
      height={height}
      className={`drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] ${className ?? ""}`}
      priority={priority}
      unoptimized
    />
  );
}
