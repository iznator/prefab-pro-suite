import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface LightboxImage {
  url: string;
  name?: string;
  author?: string;
  date?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, open, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, next, prev, onClose]);

  // Preload neighbors
  useEffect(() => {
    if (!open || images.length === 0) return;
    [index + 1, index - 1].forEach(i => {
      const target = images[(i + images.length) % images.length];
      if (target) {
        const img = new Image();
        img.src = target.url;
      }
    });
  }, [open, index, images]);

  if (!open || images.length === 0) return null;
  const current = images[index];
  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="text-xs">
            {current.author && <p className="font-semibold">{current.author}</p>}
            {current.date && <p className="opacity-60">{current.date}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">{index + 1} / {images.length}</span>
            <a
              href={current.url}
              download={current.name}
              onClick={e => e.stopPropagation()}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prev */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Image */}
        <motion.img
          key={current.url}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          src={current.url}
          alt={current.name || ""}
          onClick={e => e.stopPropagation()}
          className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg"
        />

        {/* Next */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
