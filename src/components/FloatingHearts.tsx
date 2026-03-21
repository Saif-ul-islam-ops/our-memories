import { useMemo } from "react";
import { Heart } from "lucide-react";

export default function FloatingHearts({ count = 12 }: { count?: number }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 8 + Math.random() * 10,
        size: 10 + Math.random() * 16,
        opacity: 0.15 + Math.random() * 0.2,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {hearts.map((h) => (
        <Heart
          key={h.id}
          className="absolute text-romantic-rose fill-romantic-rose"
          style={{
            left: `${h.left}%`,
            width: h.size,
            height: h.size,
            opacity: h.opacity,
            animation: `drift ${h.duration}s linear ${h.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
