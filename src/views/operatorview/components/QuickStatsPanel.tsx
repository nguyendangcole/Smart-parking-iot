import React, { useState, useEffect } from 'react';
import { AlertCircle, Ban, DollarSign, TrendingDown } from 'lucide-react';

interface QuickStats {
  pendingExceptions: number;
  blockedVehicles: number;
  paymentPending: number;
  overparkedCount: number;
}

export default function QuickStatsPanel() {
  const [stats, setStats] = useState<QuickStats>({
    pendingExceptions: 3,
    blockedVehicles: 1,
    paymentPending: 5,
    overparkedCount: 2
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update stats to simulate real data
      setStats(prev => ({
        pendingExceptions: Math.max(0, prev.pendingExceptions + (Math.random() > 0.5 ? 1 : -1)),
        blockedVehicles: Math.max(0, prev.blockedVehicles + (Math.random() > 0.7 ? 1 : 0)),
        paymentPending: Math.max(0, prev.paymentPending + (Math.random() > 0.6 ? 1 : -1)),
        overparkedCount: Math.max(0, prev.overparkedCount + (Math.random() > 0.8 ? 1 : 0))
      }));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const actionItems = [
    {
      label: 'Pending Exceptions',
      value: stats.pendingExceptions,
      icon: AlertCircle,
      color: 'red',
      description: 'Duplicate entries, sensor errors',
      action: 'Review'
    },
    {
      label: 'Blocked Vehicles',
      value: stats.blockedVehicles,
      icon: Ban,
      color: 'red',
      description: 'Banned or flagged',
      action: 'Check'
    },
    {
      label: 'Payment Pending',
      value: stats.paymentPending,
      icon: DollarSign,
      color: 'amber',
      description: 'Unpaid sessions',
      action: 'Collect'
    },
    {
      label: 'Overparked',
      value: stats.overparkedCount,
      icon: TrendingDown,
      color: 'orange',
      description: 'Over daily/monthly limit',
      action: 'Resolve'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600', badge: 'bg-red-100' };
      case 'amber':
        return { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600', badge: 'bg-amber-100' };
      case 'orange':
        return { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600', badge: 'bg-orange-100' };
      default:
        return { bg: 'bg-slate-50', text: 'text-slate-700', icon: 'text-slate-600', badge: 'bg-slate-100' };
    }
  };

  const hasUrgentItems = stats.pendingExceptions > 0 || stats.blockedVehicles > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Quick Action Items</h3>
          <p className="text-sm text-slate-500 mt-1">Pending tasks requiring operator attention</p>
        </div>
        {hasUrgentItems && (
          <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
            <AlertCircle size={14} /> {stats.pendingExceptions + stats.blockedVehicles} Urgent
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actionItems.map((item, idx) => {
          const colors = getColorClasses(item.color);
          const Icon = item.icon;
          const isUrgent = (item.color === 'red');

          return (
            <div
              key={idx}
              className={`rounded-xl border-2 p-4 transition-all hover:shadow-md cursor-pointer group ${
                isUrgent
                  ? 'border-red-200 bg-red-50 hover:border-red-300'
                  : item.color === 'amber'
                  ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                  : 'border-orange-200 bg-orange-50 hover:border-orange-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${colors.badge}`}>
                  <Icon className={colors.icon} size={20} />
                </div>
                {item.value > 0 && (
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${colors.badge} ${colors.text} ${
                    isUrgent ? 'animate-pulse' : ''
                  }`}>
                    {item.value} {item.value === 1 ? 'item' : 'items'}
                  </div>
                )}
              </div>

              <div className="mb-2">
                <p className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>{item.label}</p>
                <p className="text-sm text-slate-600 mt-1">{item.description}</p>
              </div>

              {item.value > 0 && (
                <button
                  onClick={() => alert(`🔍 Opening ${item.label.toLowerCase()} details...\n${item.action} action triggered`)}
                  className={`w-full mt-3 py-2 rounded font-semibold text-xs transition-colors ${
                    isUrgent
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : item.color === 'amber'
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {item.action} {item.value > 1 ? `(${item.value})` : ''}
                </button>
              )}

              {item.value === 0 && (
                <div className="w-full mt-3 py-2 rounded text-xs font-semibold text-slate-500 bg-white border border-slate-200 text-center">
                  All clear ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      {(stats.pendingExceptions > 0 || stats.blockedVehicles > 0) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-red-700">
            <p className="font-semibold">Action Required</p>
            <p className="text-xs mt-1">
              {stats.pendingExceptions > 0 && `${stats.pendingExceptions} exception${stats.pendingExceptions > 1 ? 's' : ''} need resolution`}
              {stats.pendingExceptions > 0 && stats.blockedVehicles > 0 && ' • '}
              {stats.blockedVehicles > 0 && `${stats.blockedVehicles} blocked vehicle${stats.blockedVehicles > 1 ? 's' : ''} in lot`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
