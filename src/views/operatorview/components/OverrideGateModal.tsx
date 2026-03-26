import React, { useState } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';

interface OverrideGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateName?: string;
  gateId?: string;
}

export default function OverrideGateModal({ isOpen, onClose, gateName = 'Gate Entry', gateId = 'gate-1' }: OverrideGateModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for override');
      return;
    }

    setIsSubmitting(true);
    // TODO: Call API to override gate
    // const { data, error } = await supabase.rpc('override_gate', { gate_id, reason, operator_id })
    
    setTimeout(() => {
      console.log('Gate override:', { gateId, gateName, reason });
      
      // Update gate status in GateStatusPanel (via window function)
      if ((window as any).updateGateStatus) {
        (window as any).updateGateStatus(gateId, 'locked');
      }
      
      setIsSubmitting(false);
      setReason('');
      onClose();
      
      // Show success feedback
      alert(`✓ Gate "${gateName}" has been LOCKED\nReason logged: ${reason}`);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock size={24} />
            <h2 className="text-xl font-bold">Override Gate</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning */}
          <div className="flex gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-sm text-orange-900">Sensitive Action</p>
              <p className="text-xs text-orange-700 mt-1">This action will be logged in audit trail</p>
            </div>
          </div>

          {/* Gate Info */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Gate</p>
            <p className="text-lg font-bold text-slate-800 mt-1">{gateName}</p>
          </div>

          {/* Reason Field */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason for Override <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Sensor malfunction detected, manual verification required..."
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none h-24"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Min. 10 characters required</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || reason.trim().length < 10}
              className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Overriding...' : 'Override Gate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
