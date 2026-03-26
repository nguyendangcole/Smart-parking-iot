import React, { useState } from 'react';
import { X, AlertTriangle, Lock, DoorOpen, DoorClosed } from 'lucide-react';

interface GateActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateName: string;
  gateId: string;
  actionType: 'open' | 'close' | 'emergency_lock';
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export default function GateActionModal({
  isOpen,
  onClose,
  gateName,
  gateId,
  actionType,
  onConfirm,
  isSubmitting = false
}: GateActionModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.length < 5) {
      alert('Please provide a reason (at least 5 characters)');
      return;
    }
    onConfirm(reason);
    setReason('');
  };

  const actionConfig = {
    open: {
      icon: DoorOpen,
      title: 'Open Gate',
      color: 'blue',
      bgColor: 'blue',
      buttonText: 'Confirm Open',
      description: 'This will unlock and open the gate',
      warningLevel: 'normal'
    },
    close: {
      icon: DoorClosed,
      title: 'Close Gate',
      color: 'slate',
      bgColor: 'slate',
      buttonText: 'Confirm Close',
      description: 'This will close the gate mechanism',
      warningLevel: 'normal'
    },
    emergency_lock: {
      icon: Lock,
      title: 'Emergency Lock Gate',
      color: 'red',
      bgColor: 'red',
      buttonText: 'Confirm Emergency Lock',
      description: 'This is a critical action - gate will be immediately locked',
      warningLevel: 'critical'
    }
  };

  const config = actionConfig[actionType];
  const Icon = config.icon;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r from-${config.bgColor}-500 to-${config.bgColor}-600 text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <Icon size={24} />
            <h2 className="text-xl font-bold">{config.title}</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 hover:bg-${config.bgColor}-700 rounded-lg transition-colors`}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning Banner */}
          {config.warningLevel === 'critical' && (
            <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-sm text-red-900">Critical Action</p>
                <p className="text-xs text-red-700 mt-1">
                  This action will be logged and audited. Proceed only if necessary.
                </p>
              </div>
            </div>
          )}

          {/* Gate Information */}
          <div className={`bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2`}>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Gate</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{gateName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Gate ID</p>
              <p className="text-sm font-mono text-slate-600">{gateId}</p>
            </div>
          </div>

          {/* Action Description */}
          <div className={`p-3 rounded-lg border ${
            config.warningLevel === 'critical'
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-sm ${
              config.warningLevel === 'critical'
                ? 'text-red-700'
                : 'text-blue-700'
            }`}>
              {config.description}
            </p>
          </div>

          {/* Reason Field */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason for Action <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Vehicle stuck, emergency access required, vehicle obstruction..."
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-20"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {reason.length}/100 characters • minimum 5 required
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || reason.trim().length < 5}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                config.warningLevel === 'critical'
                  ? `bg-red-500 hover:bg-red-600 disabled:bg-slate-300`
                  : `bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300`
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <Icon size={18} />
                  {config.buttonText}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
