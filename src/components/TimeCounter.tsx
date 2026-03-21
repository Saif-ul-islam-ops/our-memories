import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// हार्डcoded start date (edit this only in code)
const START_DATE = "2024-04-05T00:00:00";

export default function TimeCounter() {
  const [elapsed, setElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const ref = useScrollReveal();

  useEffect(() => {
    const start = new Date(START_DATE);

    if (isNaN(start.getTime())) return;

    const tick = () => {
      const diff = Date.now() - start.getTime();
      if (diff < 0) return;

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setElapsed({ days, hours, minutes, seconds });
    };

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, []);

  const blocks = [
    { label: "Days", value: elapsed.days },
    { label: "Hours", value: elapsed.hours },
    { label: "Minutes", value: elapsed.minutes },
    { label: "Seconds", value: elapsed.seconds },
  ];

  return (
    <section
      id="time-together"
      ref={ref}
      className="py-24 px-4 romantic-gradient opacity-0"
    >
      <div className="container max-w-3xl text-center">
        <Heart className="mx-auto w-8 h-8 text-romantic-rose fill-romantic-rose mb-4 animate-pulse-glow rounded-full" />

        <h2
          className="font-script text-4xl sm:text-5xl text-romantic-deep mb-3"
          style={{ lineHeight: 1.15 }}
        >
          Time Together
        </h2>

        <p className="text-muted-foreground mb-10">
          Every second counts
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {blocks.map((b) => (
            <div
              key={b.label}
              className="glass rounded-2xl p-6 animate-pulse-glow"
            >
              <span className="font-script text-4xl sm:text-5xl text-romantic-deep tabular-nums">
                {b.value}
              </span>
              <p className="text-sm text-muted-foreground mt-1 font-medium">
                {b.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}