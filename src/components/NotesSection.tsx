import { useState, useEffect } from "react";
import { PenLine, Trash2, Loader2, X, Send, Heart } from "lucide-react";
import { addNote, fetchNotes, deleteNote } from "@/lib/firebase";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function NotesSection() {
  const [notes, setNotes] = useState<
    Array<{ id: string; text: string; createdAt: any }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ref = useScrollReveal();

  const load = async () => {
    setLoading(true);
    try {
      setNotes(await fetchNotes());
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!text.trim()) return;

    setSaving(true);

    try {
      await addNote(text.trim());
      setText("");
      setModalOpen(false);
      load();
    } catch {
      alert("Failed to save note.");
    }

    setSaving(false);
  };

  // Open delete confirmation popup
  const requestDelete = (id: string) => {
    setNoteToDelete(id);
    setDeleteModalOpen(true);
  };

  // Actually delete the note after confirmation
  const handleDelete = async () => {
    if (!noteToDelete) return;

    setDeleting(true);

    try {
      await deleteNote(noteToDelete);

      setNotes((p) => p.filter((n) => n.id !== noteToDelete));

      setDeleteModalOpen(false);
      setNoteToDelete(null);
    } catch {
      alert("Failed to delete note.");
    }

    setDeleting(false);
  };

  return (
    <section
      id="notes"
      ref={ref}
      className="py-24 px-4 opacity-0"
    >
      <div className="container max-w-4xl">
        <h2
          className="font-script text-4xl sm:text-5xl text-center text-romantic-deep mb-3"
          style={{ lineHeight: 1.15 }}
        >
          Love Notes
        </h2>

        <p className="text-center text-muted-foreground mb-10">
          Words from the heart
        </p>

        <div className="flex justify-center mb-10">
          <button
            onClick={() => setModalOpen(true)}
            className="px-8 py-3 rounded-full bg-romantic-rose text-primary-foreground font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <PenLine className="w-5 h-5" />
            Write a Note
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-romantic-rose" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            No notes yet. Write your first love note!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {notes.map((n, i) => (
              <div
                key={n.id}
                className="glass rounded-2xl p-6 group relative hover:shadow-xl transition-all duration-500"
                style={{
                  animation: `reveal-up 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 80
                    }ms forwards`,
                  opacity: 0,
                }}
              >
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap mb-4">
                  {n.text}
                </p>

                <p className="text-xs text-muted-foreground">
                  {n.createdAt?.toDate?.()
                    ? new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(n.createdAt.toDate())
                    : "Just now"}
                </p>

                <button
                  onClick={() => requestDelete(n.id)}
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
          onClick={() => setModalOpen(false)}
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
            {/* Heart icon */}
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