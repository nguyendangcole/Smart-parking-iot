import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Loader } from 'lucide-react';

type FeedbackType = 'success' | 'error' | 'loading';

interface ActionFeedbackProps {
  message: string;
  type: FeedbackType;
  gateName: string;
  action: string;
  timestamp: string;
  onDismiss: () => void;
}

export default function ActionFeedback({
  message,
  type,
  gateName,
  action,
  timestamp,
  onDismiss
}: ActionFeedbackProps) {
  useEffect(() => {
    if (type !== 'loading') {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, onDismiss]);

  const config = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      title: 'text-emerald-900',
      subtitle: 'text-emerald-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      title: 'text-red-900',
      subtitle: 'text-red-700'
    },
    loading: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Loader,
      iconColor: 'text-blue-600',
      title: 'text-blue-900',
      subtitle: 'text-blue-700'
    }
  };

  const cfg = config[type];
  const Icon = cfg.icon;

  return (
    <div className={`${cfg.bg} ${cfg.border} border rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300`}>
      <Icon className={`${cfg.iconColor} flex-shrink-0 mt-0.5 ${type === 'loading' ? 'animate-spin' : ''}`} size={20} />
      
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${cfg.title}`}>{action}</p>
        <p className={`text-xs mt-0.5 ${cfg.subtitle}`}>
          {gateName} {type === 'loading' ? '• Processing...' : `• ${timestamp}`}
        </p>
        <p className={`text-xs mt-1 ${cfg.subtitle}`}>{message}</p>
      </div>

      {type !== 'loading' && (
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 p-1 rounded hover:bg-white/50 transition-colors text-slate-500`}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
