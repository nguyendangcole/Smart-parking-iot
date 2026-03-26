import React, { useState } from 'react';
import { X, CreditCard, MessageSquare, Check } from 'lucide-react';

export default function LostCardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'verify' | 'confirm' | 'success'>('verify');
  const [plate, setPlate] = useState('');
  const [cardId, setCardId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Call API to verify vehicle exists
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('confirm');
    }, 500);
  };

  const handleConfirmLostCard = async () => {
    setIsSubmitting(true);
    // TODO: Call API to process lost card
    // - Charge fee: 20,000 VND
    // - Create temporary ticket
    // - Log audit
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success');
    }, 1000);
  };

  const handleClose = () => {
    setStep('verify');
    setPlate('');
    setCardId('');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard size={24} />
            <h2 className="text-xl font-bold">Lost Card Handler</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-red-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-6">
              <p className="text-sm text-slate-600">
                Verify vehicle identity before processing lost card claim.
              </p>

              {/* License Plate */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  License Plate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="e.g., AAA-0001"
                  maxLength={10}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  required
                />
              </div>

              {/* Card ID (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Card ID <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  placeholder="e.g., CARD-567"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">If known, helps identify the exact card</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !plate.trim()}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>
            </form>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Vehicle</p>
                  <p className="text-lg font-bold text-slate-800">{plate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Processing Fee</p>
                  <p className="text-lg font-bold text-red-600">20,000 VND</p>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm text-blue-700">
                <p className="font-semibold mb-1">Next Steps:</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li>Charge 20,000 VND lost card fee</li>
                  <li>Generate temporary exit ticket</li>
                  <li>Log incident in audit trail</li>
                  <li>Issue new card (if policy allows)</li>
                </ul>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Card left at gate, customer contacted via phone..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none h-20"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('verify')}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmLostCard}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm & Process'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center animate-pulse">
                  <Check className="text-emerald-600" size={32} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Lost Card Processed</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Vehicle {plate} has been issued a temporary ticket for exit.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-sm space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-600">Fee Charged:</span>
                  <span className="font-bold text-emerald-700">20,000 VND</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Temp Ticket:</span>
                  <span className="font-mono text-xs font-bold">TMP-020314-001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Valid Until:</span>
                  <span className="font-bold">11:59 PM Today</span>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={handleClose}
                className="w-full px-4 py-2.5 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
