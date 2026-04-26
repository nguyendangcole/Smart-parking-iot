import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText } from 'lucide-react';

export interface LegalDocSection {
  heading: string;
  body: string;
}

interface LegalDocModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  lastUpdated: string;
  sections: LegalDocSection[];
}

/**
 * Reusable modal for legal documents (Privacy Policy, Terms of Service, etc.).
 * Content is passed entirely as props so a single component covers every
 * legal surface — the doc text lives next to the link that opens it instead
 * of being trapped inside a one-off modal component.
 */
export default function LegalDocModal({
  open,
  onClose,
  title,
  lastUpdated,
  sections,
}: LegalDocModalProps) {
  useEffect(() => {
    if (!open) return;
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
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-start md:items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-doc-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl my-8 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-start justify-between gap-4 px-6 md:px-8 py-5 border-b border-slate-200/70 bg-gradient-to-br from-white to-slate-50 rounded-t-3xl shrink-0">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[11px] font-bold tracking-widest uppercase mb-2">
                  <FileText size={12} />
                  Legal Document
                </div>
                <h2
                  id="legal-doc-title"
                  className="text-2xl md:text-3xl font-headline font-extrabold tracking-tight"
                >
                  <span className="text-gradient">{title}</span>
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Last updated: <span className="font-semibold text-slate-700">{lastUpdated}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors active:scale-95"
                aria-label={`Close ${title}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 md:px-8 py-6 space-y-6">
              {sections.map((section, i) => (
                <section key={i}>
                  <h3 className="text-base font-headline font-extrabold text-slate-900 mb-2 flex items-baseline gap-2">
                    <span className="text-primary tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {section.heading}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>

            <div className="px-6 md:px-8 py-4 border-t border-slate-200/70 bg-slate-50 rounded-b-3xl flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
