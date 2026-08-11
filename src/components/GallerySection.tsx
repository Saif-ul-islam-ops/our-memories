import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, X, Trash2, ImagePlus, Loader2 } from "lucide-react";
import { Download } from "lucide-react";
import {
  uploadToCloudinary,
  saveImageToFirestore,
  fetchGalleryImages,
  deleteGalleryImage,
} from "@/lib/firebase";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const TABS: Array<{ key: string; label: string; special?: boolean }> = [
  { key: "saif", label: "Saif" },
  { key: "areeba", label: "Areeba" },
  { key: "us", label: "Us", special: true },
];

type Tab = string;

export default function GallerySection() {
  const [tab, setTab] = useState<Tab>("us");
  const [images, setImages] = useState<Array<{ id: string; imageUrl: string; section: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const sectionRef = useScrollReveal();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGalleryImages(tab);
      setImages(data);
    } catch {
      /* silent */
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPreviewFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!previewFile) return;

    setUploading(true);

    try {
      const url = await uploadToCloudinary(previewFile);
      await saveImageToFirestore(tab, url);

      setPreview(null);
      setPreviewFile(null);

      load();
    } catch {
      alert("Upload failed. Please try again.");
    }

    setUploading(false);
  };

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "image.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  // Opens the custom confirmation popup
  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  // Actually deletes the image after confirmation
  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);

    try {
      await deleteGalleryImage(deleteConfirm);

      setImages((p) =>
        p.filter((i) => i.id !== deleteConfirm)
      );

      setDeleteConfirm(null);
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeleting(false);
    }
  };

  const isUs = tab === "us";

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="py-24 px-4 opacity-0"
    >
      <div className="container max-w-6xl">

        <h2
          className="font-script text-4xl sm:text-5xl text-center text-romantic-deep mb-3"
          style={{ lineHeight: 1.15 }}
        >
          Our Gallery
        </h2>

        <p className="text-center text-muted-foreground mb-10">
          Moments frozen in time
        </p>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${tab === t.key
                ? t.special
                  ? "bg-romantic-rose text-primary-foreground shadow-lg scale-105"
                  : "bg-romantic-deep text-primary-foreground shadow-lg"
                : "glass hover:bg-romantic-pink/40"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Upload Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);

            const f = e.dataTransfer.files[0];

            if (f) handleFile(f);
          }}
          className={`glass rounded-2xl p-8 mb-10 text-center border-2 border-dashed transition-all duration-300 ${dragging
            ? "border-romantic-rose bg-romantic-pink/20 scale-[1.01]"
            : "border-border"
            }`}
        >
          {preview ? (
            <div className="flex flex-col items-center gap-4">

              <img
                src={preview}
                alt="Preview"
                className="max-h-48 rounded-xl object-cover shadow-md"
              />

              <div className="flex gap-3">

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-full bg-romantic-rose text-primary-foreground font-semibold flex items-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}

                  {uploading ? "Uploading..." : "Upload"}
                </button>

                <button
                  onClick={() => {
                    setPreview(null);
                    setPreviewFile(null);
                  }}
                  className="px-4 py-2.5 rounded-full glass hover:bg-destructive/10 transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>

              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer py-6 flex flex-col items-center gap-3"
            >
              <ImagePlus className="w-10 h-10 text-romantic-rose/50" />

              <p className="text-muted-foreground">
                Drag & drop an image or{" "}
                <span className="text-romantic-rose font-semibold">
                  browse
                </span>
              </p>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];

              if (f) handleFile(f);

              e.target.value = "";
            }}
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-romantic-rose" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            No memories yet. Upload your first one!
          </p>
        ) : (
          <div
            className={`grid gap-4 ${isUs
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
              }`}
          >
            {images.map((img, i) => (
              <div
                key={img.id}
                className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 cursor-pointer"
                style={{
                  animationDelay: `${i * 80}ms`,
                  animation:
                    "reveal-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
                }}
                onClick={() => setLightbox(img.imageUrl)}
              >

                <img
                  src={img.imageUrl}
                  alt="Memory"
                  loading="lazy"
                  className={`w-full object-cover object-top transition-transform duration-700 group-hover:scale-105 ${isUs
                    ? "h-80 sm:h-96"
                    : "h-48 sm:h-56"
                    }`}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-romantic-deep/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(img.id);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-destructive/80 text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-destructive active:scale-90"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Download */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(img.imageUrl);
                  }}
                  className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black active:scale-90"
                >
                  <Download className="w-4 h-4" />
                </button>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Full"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
          />

          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/40 transition-all"
          >
            <X className="w-6 h-6 text-primary-foreground" />
          </button>
        </div>
      )}

      {/* =====================================================
          CUSTOM DELETE CONFIRMATION MODAL
          ===================================================== */}

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-[200] bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            if (!deleting) {
              setDeleteConfirm(null);
            }
          }}
        >
          <div
            className="glass-strong rounded-3xl p-7 w-full max-w-sm text-center shadow-2xl border border-romantic-pink/40 animate-reveal-up"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Icon */}
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-romantic-pink/40 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-romantic-rose" />
            </div>

            <h3 className="font-script text-3xl text-romantic-deep mb-2">
              Delete Memory?
            </h3>

            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to remove this photo from your gallery?
            </p>

            <div className="flex gap-3 justify-center">

              {/* Cancel */}
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-5 py-2.5 rounded-xl glass text-romantic-deep font-semibold hover:bg-romantic-pink/30 transition-all active:scale-95 disabled:opacity-50"
              >
                Keep It
              </button>

              {/* Delete */}
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-5 py-2.5 rounded-xl bg-romantic-rose text-primary-foreground font-semibold hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
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
