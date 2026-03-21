import FloatingHearts from "@/components/FloatingHearts";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import GallerySection from "@/components/GallerySection";
import NotesSection from "@/components/NotesSection";
import TimelineSection from "@/components/TimelineSection";
import TimeCounter from "@/components/TimeCounter";
import MusicPlayer from "@/components/MusicPlayer";
import { Heart } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <FloatingHearts />
      <Navbar />
      <HeroSection />
      <GallerySection />
      <NotesSection />
      <TimelineSection />
      <TimeCounter />

      {/* Footer */}
      <footer className="py-12 text-center border-t border-border">
        <Heart className="mx-auto w-5 h-5 text-romantic-rose fill-romantic-rose mb-3" />
        <p className="font-script text-xl text-romantic-deep">Saif & Areeba</p>
        <p className="text-xs text-muted-foreground mt-1">Made with love</p>
      </footer>

      <MusicPlayer />
    </div>
  );
};

export default Index;
