import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Plus,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

import {
  uploadMusicToCloudinary,
  saveMusicToFirestore,
  subscribeToMusic,
  deleteMusic,
  MusicTrack,
} from "@/lib/firebase";

import { auth } from "@/lib/firebase";

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [expanded, setExpanded] = useState(false);

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  // ======================================================
  // THEMED NOTIFICATION
  // ======================================================

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }

    setNotification({ message, type });

    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentTrack = tracks[currentIndex];

  // ======================================================
  // REAL-TIME MUSIC LIBRARY
  // ======================================================

  useEffect(() => {
    const unsubscribe = subscribeToMusic((data) => {
      setTracks(data);
    });

    return () => unsubscribe();
  }, []);

  // ======================================================
  // CURRENT TRACK
  // ======================================================

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentTrack) return;

    audio.src = currentTrack.url;
    audio.volume = volume;
    audio.muted = muted;

    if (playing) {
      audio.play().catch(() => {
        setPlaying(false);
      });
    }
  }, [currentTrack]);

  // ======================================================
  // VOLUME
  // ======================================================

  const changeVolume = (value: number) => {
    setVolume(value);

    if (audioRef.current) {
      audioRef.current.volume = value;
    }

    setMuted(value === 0);
  };

  // ======================================================
  // PLAY / PAUSE
  // ======================================================

  const toggle = async () => {
    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      setShowLibrary(true);
      return;
    }

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        await audio.play();
        setPlaying(true);
      } catch (error) {
        console.error("Playback error:", error);
      }
    }
  };

  // ======================================================
  // NEXT
  // ======================================================

  const nextTrack = () => {
    if (tracks.length === 0) return;

    let nextIndex;

    if (shuffle && tracks.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex =
        currentIndex === tracks.length - 1
          ? 0
          : currentIndex + 1;
    }

    setCurrentIndex(nextIndex);
    setPlaying(true);
  };

  // ======================================================
  // PREVIOUS
  // ======================================================

  const previousTrack = () => {
    if (tracks.length === 0) return;

    const audio = audioRef.current;

    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    const previousIndex =
      currentIndex === 0
        ? tracks.length - 1
        : currentIndex - 1;

    setCurrentIndex(previousIndex);
    setPlaying(true);
  };

  // ======================================================
  // WHEN SONG ENDS
  // ======================================================

  const handleEnded = () => {
    if (repeat) {
      const audio = audioRef.current;

      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => { });
      }

      return;
    }

    nextTrack();
  };

  // ======================================================
  // UPLOAD MUSIC
  // ======================================================

  const handleMusicUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      showNotification("Please select an audio file.", "error");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const result = await uploadMusicToCloudinary(file);

      const title = file.name.replace(/\.[^/.]+$/, "");

      await saveMusicToFirestore(
        title,
        result.url,
        result.publicId,
        result.duration
      );

      showNotification("Music added successfully.", "success");

      setShowLibrary(true);
    } catch (error: any) {
      console.error("Music upload error:", error);

      showNotification(
        error?.message ||
        "Music upload failed. Please try again.",
        "error"
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // ======================================================
  // DELETE MUSIC
  // ======================================================

  const handleDelete = async (track: MusicTrack) => {
    if (!auth.currentUser) {
      showNotification("You must be logged in.", "error");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${track.title}" from the music library?`
    );

    if (!confirmed) return;

    try {
      await deleteMusic(track.id);

      if (currentIndex >= tracks.length - 1) {
        setCurrentIndex(
          Math.max(0, tracks.length - 2)
        );
      }

      showNotification("Music removed from the library.", "success");
    } catch (error: any) {
      console.error("Delete music error:", error);

      showNotification(
        error?.message ||
        "Could not delete the music.",
        "error"
      );
    }
  };

  // ======================================================
  // FORMAT DURATION
  // ======================================================

  const formatDuration = (seconds?: number) => {
    if (!seconds || !Number.isFinite(seconds)) {
      return "";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3 flex-col">

      {/* ==================================================
          THEMED NOTIFICATION
      ================================================== */}

      {notification && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100vw-2rem)] max-w-sm glass-strong rounded-2xl px-5 py-3 shadow-xl border animate-reveal-up ${notification.type === "success"
            ? "border-romantic-rose/30"
            : notification.type === "error"
              ? "border-destructive/30"
              : "border-romantic-pink/40"
            }`}
        >
          <div className="flex items-center gap-3">

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notification.type === "success"
                ? "bg-romantic-pink/50 text-romantic-rose"
                : notification.type === "error"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-romantic-pink/40 text-romantic-rose"
                }`}
            >
              {notification.type === "success" ? (
                <HeartIcon />
              ) : notification.type === "error" ? (
                <X className="w-4 h-4" />
              ) : (
                <Music className="w-4 h-4" />
              )}
            </div>

            <p className="text-sm font-medium text-romantic-deep flex-1">
              {notification.message}
            </p>

            <button
              onClick={() => setNotification(null)}
              className="p-1 rounded-full text-muted-foreground hover:text-romantic-rose hover:bg-romantic-pink/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        </div>
      )}

      {/* ==================================================
          PLAYER PANEL
      ================================================== */}

      {expanded && (
        <div className="glass-strong rounded-2xl p-4 w-[calc(100vw-2rem)] sm:w-[360px] max-w-[360px] shadow-xl animate-reveal-up">

          {/* Current Song */}

          <div className="flex items-center gap-3 mb-4">

            <div className="w-10 h-10 rounded-full bg-romantic-pink/40 flex items-center justify-center shrink-0">
              <Music className="w-5 h-5 text-romantic-rose" />
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-xs text-muted-foreground">
                Now Playing
              </p>

              <p className="font-semibold text-romantic-deep truncate">
                {currentTrack
                  ? currentTrack.title
                  : "No music added"}
              </p>

              {currentTrack && (
                <p className="text-[11px] text-muted-foreground truncate">
                  Added by {currentTrack.addedBy}
                </p>
              )}

            </div>

          </div>

          {/* Main Controls */}

          <div className="flex items-center justify-center gap-2 mb-4">

            <button
              onClick={() => setShuffle(!shuffle)}
              className={`p-2 rounded-full transition-all ${shuffle
                ? "bg-romantic-pink text-romantic-rose"
                : "text-muted-foreground hover:text-romantic-rose"
                }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={previousTrack}
              disabled={!tracks.length}
              className="p-2 rounded-full text-romantic-deep hover:bg-romantic-pink/30 disabled:opacity-40 transition-all"
              title="Previous"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={toggle}
              className="p-3 rounded-full bg-romantic-rose text-primary-foreground shadow-md hover:shadow-lg transition-all active:scale-90"
              title={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              disabled={!tracks.length}
              className="p-2 rounded-full text-romantic-deep hover:bg-romantic-pink/30 disabled:opacity-40 transition-all"
              title="Next"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={() => setRepeat(!repeat)}
              className={`p-2 rounded-full transition-all ${repeat
                ? "bg-romantic-pink text-romantic-rose"
                : "text-muted-foreground hover:text-romantic-rose"
                }`}
              title="Repeat"
            >
              <Repeat className="w-4 h-4" />
            </button>

          </div>

          {/* Volume */}

          <div className="flex items-center gap-3 mb-4">

            <button
              onClick={() => {
                const newMuted = !muted;

                setMuted(newMuted);

                if (audioRef.current) {
                  audioRef.current.muted = newMuted;
                }
              }}
              className="text-muted-foreground hover:text-romantic-rose transition-colors"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) =>
                changeVolume(Number(e.target.value))
              }
              className="flex-1 h-1.5 accent-romantic-rose cursor-pointer"
            />

          </div>

          {/* Library Toggle */}

          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className="w-full py-2 rounded-xl glass hover:bg-romantic-pink/30 transition-all text-sm font-medium text-romantic-deep"
          >
            {showLibrary
              ? "Hide Music Library"
              : `Music Library (${tracks.length})`}
          </button>

          {/* ==================================================
              MUSIC LIBRARY
          ================================================== */}

          {showLibrary && (
            <div className="mt-4">

              {/* Add Music */}

              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full mb-3 py-2.5 rounded-xl bg-romantic-rose text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Music
                  </>
                )}
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg"
                className="hidden"
                onChange={handleMusicUpload}
              />

              {/* Track List */}

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">

                {tracks.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-5">
                    No music added yet.
                  </p>
                ) : (
                  tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className={`flex items-center gap-2 p-2 rounded-xl transition-all ${index === currentIndex
                        ? "bg-romantic-pink/30"
                        : "hover:bg-romantic-pink/15"
                        }`}
                    >

                      <button
                        onClick={() => {
                          setCurrentIndex(index);
                          setPlaying(true);
                        }}
                        className="w-8 h-8 rounded-full bg-romantic-rose text-primary-foreground flex items-center justify-center shrink-0"
                      >
                        {index === currentIndex && playing ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">

                        <p className="text-sm font-medium truncate text-romantic-deep">
                          {track.title}
                        </p>

                        <p className="text-[10px] text-muted-foreground truncate">
                          Added by {track.addedBy}

                          {track.duration
                            ? ` • ${formatDuration(track.duration)}`
                            : ""}
                        </p>

                      </div>

                      <button
                        onClick={() =>
                          handleDelete(track)
                        }
                        className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  ))
                )}

              </div>

            </div>
          )}

        </div>
      )}

      {/* ==================================================
          FLOATING MUSIC BUTTON
      ================================================== */}

      <button
        onClick={() => setExpanded(!expanded)}
        className="p-4 rounded-full bg-romantic-rose text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 animate-pulse-glow"
        title="Music"
      >
        {expanded ? (
          <X className="w-5 h-5" />
        ) : (
          <Music className="w-5 h-5" />
        )}
      </button>

      {/* ==================================================
          AUDIO ELEMENT
      ================================================== */}

      <audio
        ref={audioRef}
        loop={false}
        preload="auto"
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

    </div>
  );
}

// Small themed success icon
function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 fill-current"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}