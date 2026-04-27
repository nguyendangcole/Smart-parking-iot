import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Navigation, ExternalLink, Loader2 } from 'lucide-react';

interface LiveMapModalProps {
  open: boolean;
  onClose: () => void;
}

// HCMUT main campus address. Kept as a single source of truth so the embed,
// directions, and "open in maps" links can never drift out of sync.
const HCMUT_ADDRESS =
  '268 Ly Thuong Kiet Street, Ward 14, District 10, Ho Chi Minh City, Vietnam';
const HCMUT_ADDRESS_QUERY = encodeURIComponent(HCMUT_ADDRESS);

const EMBED_URL = `https://www.google.com/maps?q=${HCMUT_ADDRESS_QUERY}&z=17&output=embed`;
const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${HCMUT_ADDRESS_QUERY}`;
const OPEN_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${HCMUT_ADDRESS_QUERY}`;

export default function LiveMapModal({ open, onClose }: LiveMapModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Lock body scroll + wire up ESC-to-close while the modal is open. We reset
  // iframeLoaded on close so a re-open shows the loader instead of flashing the
  // previous map (browsers cache the iframe but the loader UX is more honest).
  useEffect(() => {
    if (!open) {
      setIframeLoaded(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-map-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-start justify-between gap-4 px-6 md:px-8 py-5 border-b border-slate-200/70 bg-gradient-to-br from-white to-slate-50">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[11px] font-bold tracking-widest uppercase mb-2">
                  <MapPin size={12} className="fill-current" />
                  HCMUT Smart Campus
                </div>
                <h2
                  id="live-map-title"
                  className="text-2xl md:text-3xl font-headline font-extrabold tracking-tight"
                >
                  <span className="text-gradient">Live Campus Map</span>
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant flex items-center gap-1.5 truncate">
                  <MapPin size={14} className="text-primary shrink-0" />
                  <span className="truncate">{HCMUT_ADDRESS}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors active:scale-95"
                aria-label="Close map"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative flex-1 bg-slate-100 h-[60vh] min-h-[420px] md:min-h-[560px]">
              <iframe
                title="HCMUT Live Campus Map"
                src={EMBED_URL}
                onLoad={() => setIframeLoaded(true)}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-100 pointer-events-none">
                  <Loader2 size={32} className="text-primary animate-spin" />
                  <p className="text-sm font-semibold text-on-surface-variant">
                    Loading live map…
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 px-6 md:px-8 py-4 border-t border-slate-200/70 bg-white">
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <Navigation size={18} />
                Get Directions
              </a>
              <a
                href={OPEN_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-surface-container-highest text-on-surface rounded-xl font-bold border border-slate-200 hover:bg-surface-container-high hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <ExternalLink size={18} />
                Open in Google Maps
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
