import { Heart, ChevronDown } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center romantic-gradient overflow-hidden"
    >
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <Heart className="mx-auto mb-6 w-12 h-12 text-romantic-rose fill-romantic-rose animate-pulse-glow rounded-full" />

        <h1
          className="font-script text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-tight text-romantic-deep mb-6"
          style={{ lineHeight: 1.1 }}
        >
          Our Story, Written in Moments
        </h1>

        <p className="text-lg sm:text-xl text-romantic-deep/70 font-light mb-10 max-w-xl mx-auto text-balance">
          Every heartbeat, every whisper, every shared smile — collected here, for us alone.
        </p>

        {/* Arabic Prayer */}
        <div className="mb-10">
          <p
            dir="rtl"
            lang="ar"
            className="text-2xl sm:text-3xl md:text-4xl text-romantic-deep font-medium leading-relaxed"
          >
            اللَّهُمَّ لَا تَفَرَّقُ بَيْنَنَا
          </p>

          <p className="mt-3 text-sm sm:text-base text-romantic-deep/60 italic font-light">
            O Allah, do not separate us
          </p>
        </div>

        <a
          href="#gallery"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-romantic-rose text-primary-foreground font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-[0.97]"
        >
          Enter Our World
          <Heart className="w-5 h-5 fill-current" />
        </a>
      </div>

      <a
        href="#gallery"
        className="absolute bottom-10 z-10 animate-float"
      >
        <ChevronDown className="w-8 h-8 text-romantic-deep/40" />
      </a>
    </section>
  );
}
