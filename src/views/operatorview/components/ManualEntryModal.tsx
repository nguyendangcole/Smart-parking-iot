import React, { useState } from 'react';
import { X, LogIn, AlertTriangle } from 'lucide-react';

type ManualActionType = 'entry' | 'exit' | null;

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAction?: 'entry' | 'exit';
}

export default function ManualEntryModal({
  isOpen,
  onClose,
  defaultAction = 'entry'
}: ManualEntryModalProps) {
  const [action, setAction] = useState<ManualActionType>(defaultAction);
  const [plate, setPlate] = useState('');
  const [zone, setZone] = useState('A');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for manual record');
      return;
    }

    setIsSubmitting(true);
    // TODO: Call API to create manual entry/exit record
    // const { data, error } = await supabase.rpc('manual_entry', { plate, zone, timestamp, reason, operator_id })
    setTimeout(() => {
      console.log('Manual record:', { action, plate, zone, timestamp, reason });
      setIsSubmitting(false);
      setPlate('');
      setReason('');
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogIn size={24} />
            <h2 className="text-xl font-bold">
              Manual {action === 'entry' ? 'Entry' : 'Exit'} Record
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning */}
          <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertTriangle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-sm text-blue-900">Gateway/Sensor Issue</p>
              <p className="text-xs text-blue-700 mt-1">Use only when automatic detection fails</p>
            </div>
          </div>

          {/* Action Selection */}
          {!defaultAction && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Action Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAction('entry')}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                    action === 'entry'
                      ? 'bg-blue-500 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Entry
                </button>
                <button
                  type="button"
                  onClick={() => setAction('exit')}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                    action === 'exit'
                      ? 'bg-blue-500 text-white'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Exit
                </button>
              </div>
            </div>
          )}

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
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
              required
            />
          </div>

          {/* Zone (Entry only) */}
          {action === 'entry' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Parking Zone <span className="text-red-500">*</span>
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="A">Zone A</option>
                <option value="B">Zone B</option>
                <option value="C">Zone C</option>
                <option value="D">Zone D</option>
              </select>
            </div>
          )}

          {/* Timestamp */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Timestamp <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Set to current time if just detected</p>
          </div>

          {/* Reason (Mandatory) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason for Manual Record <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Sensor malfunction at Gate A, customer bypass, connectivity issue..."
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-20"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Detailed note required for audit trail</p>
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
              disabled={isSubmitting || !plate.trim() || !reason.trim() || !action}
              className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Recording...' : 'Record Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
