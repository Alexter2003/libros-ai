import { useEffect, useState } from 'react';

interface CoverProps {
  title: string;
  src: string | null;
  className?: string;
}

function hueFor(title: string): number {
  let hash = 0;
  for (const char of title) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

export function Cover({ title, src, className = '' }: CoverProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`Portada de ${title}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`aspect-[2/3] w-full rounded-lg border border-iron object-cover ${className}`}
      />
    );
  }

  const hue = hueFor(title);
  return (
    <div
      role="img"
      aria-label={`Portada generada de ${title}`}
      style={{ background: `linear-gradient(160deg, hsl(${hue} 35% 28%), hsl(${(hue + 40) % 360} 40% 14%))` }}
      className={`flex aspect-[2/3] w-full items-center justify-center rounded-lg border border-iron p-4 text-center ${className}`}
    >
      <span className="text-heading font-medium leading-tight text-bone">{title}</span>
    </div>
  );
}
