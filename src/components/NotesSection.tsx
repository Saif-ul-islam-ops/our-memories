import { useEffect, useRef, useState } from "react";
import {
  PenLine,
  Trash2,
  Loader2,
  X,
  Send,
  Heart,
  Mic,
  Square,
  RotateCcw,
  Play,
  Pause,
  MicOff,
} from "lucide-react";

import {
  addNote,
  addVoiceNote,
  deleteNote,
  fetchNotes,
  uploadVoiceNoteToCloudinary,
  type LoveNote,
} from "@/lib/firebase";

import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function NotesSection() {
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [loading, setLoading] = useState(true);

  // ======================================================
  // TEXT NOTE STATE
  // ======================================================

  const [modalOpen, setModalOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  // ======================================================
  // VOICE NOTE STATE
  // ======================================================

  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(
    null
  );

  const [voiceSaving, setVoiceSaving] = useState(false);

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // ======================================================
  // DELETE STATE
  // ======================================================

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ref = useScrollReveal();

  // ======================================================
  // LOAD NOTES
  // ======================================================

  const load = async () => {
    setLoading(true);

    try {
      setNotes(await fetchNotes());
    } catch (error) {
      console.error("Failed to load notes:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // ======================================================
  // TEXT NOTE
  // ======================================================

  const handleSave = async () => {
    if (!text.trim()) return;

    setSaving(true);

    try {
      await addNote(text.trim());

      setText("");
      setModalOpen(false);

      await load();
    } catch (error) {
      console.error(error);
      alert("Failed to save note.");
    }

    setSaving(false);
  };

  // ======================================================
  // VOICE RECORDING SUPPORT
  // ======================================================

  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "";
  };

  // ======================================================
  // START RECORDING
  // ======================================================

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert(
          "Voice recording is not supported by this browser."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      mediaStreamRef.current = stream;

      const mimeType = getSupportedMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const actualMimeType =
          recorder.mimeType || mimeType || "audio/webm";

        const blob = new Blob(audioChunksRef.current, {
          type: actualMimeType,
        });

        setAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);

        setIsRecording(false);

        if (mediaStreamRef.current) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());

          mediaStreamRef.current = null;
        }
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);

        setIsRecording(false);

        if (mediaStreamRef.current) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());

          mediaStreamRef.current = null;
        }

        alert("Something went wrong while recording.");
      };

      recorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime((previous) => {
          const next = previous + 1;

          // Maximum recording length: 5 minutes
          if (next >= 300) {
            stopRecording();
          }

          return next;
        });
      }, 1000);
    } catch (error) {
      console.error("Microphone error:", error);

      alert(
        "Microphone access was denied or could not be started."
      );
    }
  };

  // ======================================================
  // STOP RECORDING
  // ======================================================

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
  };

  // ======================================================
  // FORMAT RECORDING TIME
  // ======================================================

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // ======================================================
  // RESET VOICE RECORDING
  // ======================================================

  const resetVoiceRecording = () => {
    if (isRecording) {
      stopRecording();
    }

    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }

    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setRecordingTime(0);
    setIsPreviewPlaying(false);

    audioChunksRef.current = [];
  };

  // ======================================================
  // CLOSE VOICE MODAL
  // ======================================================

  const closeVoiceModal = () => {
    if (voiceSaving) return;

    resetVoiceRecording();
    setVoiceModalOpen(false);
  };

  // ======================================================
  // SAVE VOICE NOTE
  // ======================================================

  const handleSaveVoiceNote = async () => {
    if (!audioBlob || voiceSaving) return;

    setVoiceSaving(true);

    try {
      let extension = "webm";

      if (audioBlob.type.includes("mp4")) {
        extension = "m4a";
      } else if (audioBlob.type.includes("ogg")) {
        extension = "ogg";
      }

      const voiceFile = new File(
        [audioBlob],
        `voice-note-${Date.now()}.${extension}`,
        {
          type: audioBlob.type,
        }
      );

      // Upload audio to Cloudinary
      const uploaded =
        await uploadVoiceNoteToCloudinary(voiceFile);

      // Save metadata in Firestore
      await addVoiceNote(
        uploaded.url,
        uploaded.publicId,
        uploaded.duration || recordingTime
      );

      resetVoiceRecording();
      setVoiceModalOpen(false);

      await load();
    } catch (error) {
      console.error("Voice note save error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save voice note."
      );
    }

    setVoiceSaving(false);
  };

  // ======================================================
  // PREVIEW PLAY / PAUSE
  // ======================================================

  const togglePreview = async () => {
    if (!previewAudioRef.current) return;

    try {
      if (previewAudioRef.current.paused) {
        await previewAudioRef.current.play();
      } else {
        previewAudioRef.current.pause();
      }
    } catch (error) {
      console.error("Preview playback error:", error);
    }
  };

  // ======================================================
  // CLEANUP
  // ======================================================

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current !== null) {
        window.clearInterval(recordingTimerRef.current);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  // ======================================================
  // DELETE
  // ======================================================

  const requestDelete = (id: string) => {
    setNoteToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;

    setDeleting(true);

    try {
      await deleteNote(noteToDelete);

      setNotes((previous) =>
        previous.filter(
          (note) => note.id !== noteToDelete
        )
      );

      setDeleteModalOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error(error);
      alert("Failed to delete note.");
    }

    setDeleting(false);
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <section
      id="notes"
      ref={ref}
      className="py-24 px-4 opacity-0"
    >
      <div className="container max-w-4xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <h2
          className="font-script text-4xl sm:text-5xl text-center text-romantic-deep mb-3"
          style={{ lineHeight: 1.15 }}
        >
          Love Notes
        </h2>

        <p className="text-center text-muted-foreground mb-10">
          Words from the heart
        </p>

        {/* ==================================================
            CREATE BUTTONS
        ================================================== */}

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-10">

          <button
            onClick={() => setModalOpen(true)}
            className="px-8 py-3 rounded-full bg-romantic-rose text-primary-foreground font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <PenLine className="w-5 h-5" />
            Write a Note
          </button>

          <button
            onClick={() => setVoiceModalOpen(true)}
            className="px-8 py-3 rounded-full glass border border-romantic-pink/40 text-romantic-deep font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <Mic className="w-5 h-5" />
            Voice Note
          </button>

        </div>

        {/* ==================================================
            NOTES
        ================================================== */}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-romantic-rose" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            No notes yet. Write or record your first love note!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">

            {notes.map((note, i) => (

              <div
                key={note.id}
                className="glass rounded-2xl p-6 group relative hover:shadow-xl transition-all duration-500"
                style={{
                  animation: `reveal-up 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 80
                    }ms forwards`,
                  opacity: 0,
                }}
              >

                {/* ==================================================
                    TEXT NOTE
                ================================================== */}

                {note.type === "text" ? (
                  <>
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap mb-4 pr-5">
                      {note.text}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {note.createdAt?.toDate?.()
                        ? new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(note.createdAt.toDate())
                        : "Just now"}
                    </p>
                  </>
                ) : (

                  /* ==================================================
                     VOICE NOTE
                  ================================================== */

                  <div className="pr-5">

                    <div className="flex items-center gap-3 mb-4">

                      <div className="w-11 h-11 rounded-full bg-romantic-pink/40 flex items-center justify-center shrink-0">
                        <Mic className="w-5 h-5 text-romantic-rose" />
                      </div>

                      <div>
                        <p className="font-semibold text-romantic-deep">
                          Voice Note
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {note.duration
                            ? formatTime(
                              Math.round(note.duration)
                            )
                            : "Voice message"}
                        </p>
                      </div>

                    </div>

                    <audio
                      controls
                      preload="metadata"
                      src={note.audioUrl}
                      className="w-full h-10"
                    />

                    <p className="text-xs text-muted-foreground mt-3">
                      {note.createdAt?.toDate?.()
                        ? new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(note.createdAt.toDate())
                        : "Just now"}
                    </p>

                  </div>
                )}

                {/* ==================================================
                    DELETE BUTTON
                ================================================== */}

                <button
                  onClick={() => requestDelete(note.id)}
                  className="absolute top-4 right-4 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all active:scale-90"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

              </div>

            ))}

          </div>
        )}
      </div>

      {/* ==================================================
          WRITE NOTE MODAL
      ================================================== */}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            if (!saving) {
              setModalOpen(false);
            }
          }}
        >

          <div
            className="glass-strong rounded-3xl p-8 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between mb-6">

              <h3 className="font-script text-2xl text-romantic-deep">
                Write a Note
              </h3>

              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pour your heart out..."
              rows={5}
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-romantic-rose/40 resize-none"
            />

            <div className="flex justify-end mt-4">

              <button
                onClick={handleSave}
                disabled={saving || !text.trim()}
                className="px-6 py-2.5 rounded-full bg-romantic-rose text-primary-foreground font-semibold flex items-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >

                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}

                {saving ? "Saving..." : "Save"}

              </button>

            </div>

          </div>

        </div>
      )}

      {/* ==================================================
          VOICE NOTE MODAL
      ================================================== */}

      {voiceModalOpen && (
        <div
          className="fixed inset-0 z-[105] bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            if (!voiceSaving) {
              closeVoiceModal();
            }
          }}
        >

          <div
            className="glass-strong rounded-3xl p-7 sm:p-8 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* HEADER */}

            <div className="flex items-center justify-between mb-7">

              <div>
                <h3 className="font-script text-3xl text-romantic-deep">
                  Voice Note
                </h3>

                <p className="text-sm text-muted-foreground mt-1">
                  Say what your heart cannot write
                </p>
              </div>

              <button
                onClick={closeVoiceModal}
                disabled={voiceSaving}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {/* ==================================================
                RECORDING STATE
            ================================================== */}

            {!audioBlob ? (

              <div className="flex flex-col items-center">

                {/* Microphone circle */}

                <div
                  className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 transition-all ${isRecording
                      ? "bg-romantic-rose/20 scale-110"
                      : "bg-romantic-pink/40"
                    }`}
                >

                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center ${isRecording
                        ? "bg-romantic-rose"
                        : "bg-romantic-pink/60"
                      }`}
                  >

                    {isRecording ? (
                      <Mic className="w-9 h-9 text-primary-foreground" />
                    ) : (
                      <Mic className="w-9 h-9 text-romantic-rose" />
                    )}

                  </div>

                </div>

                {/* Timer */}

                <div className="text-3xl font-mono font-semibold text-romantic-deep mb-2">
                  {formatTime(recordingTime)}
                </div>

                {/* Recording status */}

                {isRecording ? (
                  <div className="flex items-center gap-2 text-sm text-romantic-rose mb-6">

                    <span className="w-2.5 h-2.5 rounded-full bg-romantic-rose animate-pulse" />

                    Recording...

                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-6">
                    Maximum recording time: 5 minutes
                  </p>
                )}

                {/* Record button */}

                {isRecording ? (

                  <button
                    onClick={stopRecording}
                    className="px-8 py-3 rounded-full bg-romantic-rose text-primary-foreground font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    Stop Recording
                  </button>

                ) : (

                  <button
                    onClick={startRecording}
                    className="px-8 py-3 rounded-full bg-romantic-rose text-primary-foreground font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                  >
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </button>

                )}

              </div>

            ) : (

              /* ==================================================
                 RECORDED AUDIO PREVIEW
              ================================================== */

              <div>

                <div className="rounded-2xl bg-romantic-pink/20 p-5 mb-6">

                  <div className="flex items-center gap-4 mb-4">

                    <div className="w-12 h-12 rounded-full bg-romantic-rose flex items-center justify-center shrink-0">

                      <Mic className="w-5 h-5 text-primary-foreground" />

                    </div>

                    <div className="min-w-0">

                      <p className="font-semibold text-romantic-deep">
                        Your Voice Note
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {formatTime(recordingTime)}
                      </p>

                    </div>

                  </div>

                  <audio
                    ref={previewAudioRef}
                    src={audioPreviewUrl || undefined}
                    controls
                    className="w-full"
                    onPlay={() => setIsPreviewPlaying(true)}
                    onPause={() => setIsPreviewPlaying(false)}
                    onEnded={() => setIsPreviewPlaying(false)}
                  />

                </div>

                {/* Preview status */}

                <div className="text-center text-sm text-muted-foreground mb-6">

                  {isPreviewPlaying
                    ? "Playing your recording..."
                    : "Listen to your recording before saving it."}

                </div>

                {/* Buttons */}

                <div className="grid grid-cols-2 gap-3 mb-3">

                  <button
                    onClick={togglePreview}
                    disabled={!audioPreviewUrl}
                    className="px-5 py-3 rounded-full glass border border-romantic-pink/30 text-romantic-deep font-semibold flex items-center justify-center gap-2 hover:bg-romantic-pink/30 transition-all active:scale-95"
                  >

                    {isPreviewPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Play
                      </>
                    )}

                  </button>

                  <button
                    onClick={resetVoiceRecording}
                    disabled={voiceSaving}
                    className="px-5 py-3 rounded-full glass border border-romantic-pink/30 text-romantic-deep font-semibold flex items-center justify-center gap-2 hover:bg-romantic-pink/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Re-record
                  </button>

                </div>

                {/* Save */}

                <button
                  onClick={handleSaveVoiceNote}
                  disabled={voiceSaving}
                  className="w-full px-6 py-3 rounded-full bg-romantic-rose text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.01] transition-all active:scale-95 disabled:opacity-60"
                >

                  {voiceSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving Voice Note...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 fill-current" />
                      Save Voice Note
                    </>
                  )}

                </button>

              </div>

            )}

          </div>

        </div>
      )}

      {/* ==================================================
          DELETE CONFIRMATION MODAL
      ================================================== */}

      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-[110] bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            if (!deleting) {
              setDeleteModalOpen(false);
              setNoteToDelete(null);
            }
          }}
        >

          <div
            className="glass-strong rounded-3xl p-7 w-full max-w-sm text-center shadow-2xl border border-romantic-pink/40"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-romantic-pink/40 flex items-center justify-center">
              <Heart className="w-7 h-7 text-romantic-rose fill-romantic-rose" />
            </div>

            <h3 className="font-script text-3xl text-romantic-deep mb-2">
              Delete this note?
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              This little memory will be removed from your love notes.
            </p>

            <div className="flex gap-3 justify-center">

              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setNoteToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-5 py-2.5 rounded-full glass border border-romantic-pink/30 text-romantic-deep font-semibold hover:bg-romantic-pink/30 transition-all active:scale-95 disabled:opacity-50"
              >
                Keep It
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-5 py-2.5 rounded-full bg-romantic-rose text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-60"
              >

                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}
    </section>
  );
}