import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Music } from "lucide-react";


export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play().catch(() => {}); }
    setPlaying(!playing);
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    setMuted(v === 0);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3 flex-col">
      {expanded && (
        <div className="glass-strong rounded-2xl p-4 flex items-center gap-3 animate-reveal-up min-w-[200px]">
          <button onClick={toggle} className="p-2 rounded-full bg-romantic-rose text-primary-foreground hover:shadow-lg transition-all active:scale-90">
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="flex-1 h-1.5 accent-romantic-rose cursor-pointer"
          />
          <button onClick={() => { setMuted(!muted); if (audioRef.current) audioRef.current.muted = !muted; }} className="p-1 text-muted-foreground hover:text-romantic-rose transition-colors">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="p-4 rounded-full bg-romantic-rose text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 animate-pulse-glow"
      >
        <Music className="w-5 h-5" />
      </button>
      {/* Users can add their own audio src here */}
      <audio ref={audioRef} src="/music.mp3" loop preload="auto" />
    </div>
  );
}


