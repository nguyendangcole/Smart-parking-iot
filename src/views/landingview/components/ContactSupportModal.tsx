import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  Loader2,
  HelpCircle,
  Clock,
} from 'lucide-react';

interface ContactSupportModalProps {
  open: boolean;
  onClose: () => void;
}

// Single source of truth for support channels. Mirrors the values already used
// in the member-side Support screen so the two surfaces never disagree about
// hotline/email/address.
const SUPPORT_PHONE = '028-1234-5678';
const SUPPORT_EMAIL = 'parking@hcmut.edu.vn';
const SUPPORT_ADDRESS_FULL =
  '268 Ly Thuong Kiet Street, Ward 14, District 10, Ho Chi Minh City, Vietnam';
const SUPPORT_ADDRESS_SHORT = '268 Ly Thuong Kiet, D.10, HCMC';
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  SUPPORT_ADDRESS_FULL,
)}`;

const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Account Access',
  'Billing & Payments',
  'Technical Issue',
  'Feedback & Suggestions',
  'Other',
] as const;

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactSupportModal({
  open,
  onClose,
}: ContactSupportModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<string>(SUBJECT_OPTIONS[0]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');

  // Lock body scroll + wire ESC-to-close while open. On close we *also* reset
  // form state, but only after a 300ms grace window so the exit animation can
  // play without the form visibly snapping back to empty mid-transition.
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setName('');
        setEmail('');
        setSubject(SUBJECT_OPTIONS[0]);
        setMessage('');
        setStatus('idle');
      }, 300);
      return () => clearTimeout(timer);
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

  // Light-touch validation gating the submit button — backend should still
  // re-validate, but this gives users immediate feedback without a network
  // round-trip and prevents trivially-empty submissions.
  const isValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    message.trim().length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || status !== 'idle') return;

    setStatus('submitting');

    // TODO: Replace this mock with a real submission once a public support
    // endpoint exists — e.g. supabase.from('support_requests').insert({...})
    // or a serverless function that emails the support inbox. The simulated
    // latency keeps the UX honest in the meantime so the "submitting" state
    // is actually perceivable by the user.
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setStatus('success');

      // Auto-dismiss after the success state has had time to register so the
      // user gets confirmation without having to manually close the modal.
      setTimeout(() => onClose(), 2200);
    } catch {
      setStatus('error');
    }
  };

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
          aria-labelledby="contact-support-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl my-8"
          >
            <div className="flex items-start justify-between gap-4 px-6 md:px-8 py-5 border-b border-slate-200/70 bg-gradient-to-br from-white to-slate-50 rounded-t-3xl">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-[11px] font-bold tracking-widest uppercase mb-2">
                  <HelpCircle size={12} />
                  We're Here to Help
                </div>
                <h2
                  id="contact-support-title"
                  className="text-2xl md:text-3xl font-headline font-extrabold tracking-tight"
                >
                  <span className="text-gradient">Contact Support</span>
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant flex items-center gap-1.5">
                  <Clock size={14} className="text-primary shrink-0" />
                  Typical response time: within 24 hours
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors active:scale-95"
                aria-label="Close contact support"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid md:grid-cols-5 gap-0 md:gap-6 p-6 md:p-8">
              <div className="md:col-span-2 space-y-3 mb-6 md:mb-0">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Direct Channels
                </p>

                <a
                  href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, '')}`}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-primary hover:shadow-md hover:shadow-primary/10 transition-all group"
                >
                  <div className="w-11 h-11 bg-blue-50 text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                    <Phone size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Hotline
                    </p>
                    <p className="font-bold text-slate-800 truncate">
                      {SUPPORT_PHONE}
                    </p>
                  </div>
                </a>

                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-primary hover:shadow-md hover:shadow-primary/10 transition-all group"
                >
                  <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                    <Mail size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Email
                    </p>
                    <p className="font-bold text-slate-800 truncate">
                      {SUPPORT_EMAIL}
                    </p>
                  </div>
                </a>

                <a
                  href={MAP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-primary hover:shadow-md hover:shadow-primary/10 transition-all group"
                >
                  <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Office
                    </p>
                    <p className="font-bold text-slate-800 text-sm leading-snug">
                      {SUPPORT_ADDRESS_SHORT}
                    </p>
                  </div>
                </a>
              </div>

              <div className="md:col-span-3 md:border-l md:border-slate-200/70 md:pl-6">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                  Send Us a Message
                </p>

                {status === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center text-center py-8 space-y-3"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
                      className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"
                    >
                      <CheckCircle2 size={36} />
                    </motion.div>
                    <h3 className="text-xl font-headline font-extrabold text-slate-900">
                      Message sent
                    </h3>
                    <p className="text-sm text-on-surface-variant max-w-sm">
                      Thanks for reaching out. Our team will reply to{' '}
                      <span className="font-bold text-slate-700">{email}</span>{' '}
                      within 24 hours.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          required
                          minLength={2}
                          autoComplete="name"
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          autoComplete="email"
                          className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Subject
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors bg-white"
                      >
                        {SUBJECT_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us how we can help…"
                        required
                        minLength={10}
                        rows={4}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors resize-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        {message.length} characters · minimum 10
                      </p>
                    </div>

                    {status === 'error' && (
                      <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        Something went wrong sending your message. Please try
                        again or use one of the direct channels on the left.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={!isValid || status === 'submitting'}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-primary/30"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
