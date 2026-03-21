import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, X, CalendarHeart } from "lucide-react";
import { addTimelineEvent, fetchTimeline, deleteTimelineEvent } from "@/lib/firebase";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function TimelineSection() {
  const [events, setEvents] = useState<Array<{ id: string; title: string; description: string; date: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useScrollReveal();

  const load = async () => {
    setLoading(true);
    try { setEvents(await fetchTimeline()); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!title.trim() || !date) return;
    setSaving(true);
    try {
      await addTimelineEvent(title.trim(), desc.trim(), date);
      setTitle(""); setDesc(""); setDate("");
      setFormOpen(false);
      load();
    } catch { alert("Failed to save event."); }
    setSaving(false);
  };

  return (
    <section id="timeline" ref={ref} className="py-24 px-4 opacity-0">
      <div className="container max-w-3xl">
        <h2 className="font-script text-4xl sm:text-5xl text-center text-romantic-deep mb-3" style={{ lineHeight: 1.15 }}>
          Our Timeline
        </h2>
        <p className="text-center text-muted-foreground mb-10">Milestones of our journey</p>

        <div className="flex justify-center mb-10">
          <button onClick={() => setFormOpen(true)} className="px-8 py-3 rounded-full bg-romantic-rose text-primary-foreground font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
            <Plus className="w-5 h-5" /> Add Milestone
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-romantic-rose" /></div>
        ) : events.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">No milestones yet. Add your first moment!</p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-romantic-rose/20 -translate-x-1/2" />
            {events.map((ev, i) => (
              <div
                key={ev.id}
                className={`relative flex items-start mb-12 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}
                style={{ animation: `reveal-up 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms forwards`, opacity: 0 }}
              >
                {/* Dot */}
                <div className="absolute left-6 sm:left-1/2 w-4 h-4 rounded-full bg-romantic-rose border-4 border-background -translate-x-1/2 z-10 mt-6" />
                {/* Card */}
                <div className={`ml-14 sm:ml-0 sm:w-[45%] ${i % 2 === 0 ? "sm:pr-12" : "sm:pl-12"} group`}>
                  <div className="glass rounded-2xl p-6 hover:shadow-xl transition-all duration-500 relative">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarHeart className="w-4 h-4 text-romantic-rose" />
                      <span className="text-xs font-semibold text-romantic-rose">{ev.date}</span>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">{ev.title}</h3>
                    {ev.description && <p className="text-sm text-muted-foreground leading-relaxed">{ev.description}</p>}
                    <button
                      onClick={() => { deleteTimelineEvent(ev.id); setEvents((p) => p.filter((e) => e.id !== ev.id)); }}
                      className="absolute top-4 right-4 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-[100] bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFormOpen(false)}>
          <div className="glass-strong rounded-3xl p-8 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-script text-2xl text-romantic-deep">New Milestone</h3>
              <button onClick={() => setFormOpen(false)} className="p-2 rounded-full hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-romantic-rose/40" />
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" rows={3} className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-romantic-rose/40 resize-none" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-romantic-rose/40" />
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={handleSave} disabled={saving || !title.trim() || !date} className="px-6 py-2.5 rounded-full bg-romantic-rose text-primary-foreground font-semibold flex items-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? "Saving..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
