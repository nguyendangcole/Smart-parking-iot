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

  const hasUrgentItems = stats.pendingExceptions > 0 || stats.blockedVehicles > 0;
  const totalUrgent = stats.pendingExceptions + stats.blockedVehicles;
  const totalPaymentIssues = stats.paymentPending + stats.overparkedCount;

  return (
    <div>
      {/* Header - Subtitle only (main header handled by Dashboard) */}
      <div className="mb-4">
        <p className="text-sm text-slate-500">Pending tasks requiring operator attention</p>
      </div>

      {/* Stats Grid - 2 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Card 1: Urgent Issues (RED) */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 hover:shadow-md transition-all hover:border-red-300 cursor-pointer group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded bg-red-100">
              <AlertCircle className="text-red-600" size={20} />
            </div>
            {totalUrgent > 0 && (
              <div className="px-2.5 py-0.5 rounded-full text-lg font-bold bg-red-600 text-white animate-pulse min-w-10 text-center">
                {totalUrgent}
              </div>
            )}
          </div>

          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-tight text-red-700 mb-0.5">Urgent Issues</p>
            <p className="text-xs text-red-600 font-semibold">Requires immediate action</p>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between p-2 bg-white rounded border border-red-100">
              <span className="text-xs font-semibold text-slate-700">Pending Exceptions</span>
              <span className="text-2xl font-bold text-red-600">{stats.pendingExceptions}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded border border-red-100">
              <span className="text-xs font-semibold text-slate-700">Blocked Vehicles</span>
              <span className="text-2xl font-bold text-red-600">{stats.blockedVehicles}</span>
            </div>
          </div>

          {totalUrgent > 0 && (
            <button
              onClick={() => alert(`🔍 Opening Urgent Issues...\nPending: ${stats.pendingExceptions} | Blocked: ${stats.blockedVehicles}`)}
              className="w-full py-2 rounded bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors"
            >
              Review All ({totalUrgent})
            </button>
          )}
          {totalUrgent === 0 && (
            <div className="w-full py-2 rounded bg-emerald-50 text-emerald-700 font-bold text-sm text-center">
              ✓ All Clear
            </div>
          )}
        </div>

        {/* Card 2: Payment Issues (AMBER/YELLOW) */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 hover:shadow-md transition-all hover:border-amber-300 cursor-pointer group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded bg-amber-100">
              <DollarSign className="text-amber-600" size={20} />
            </div>
            {totalPaymentIssues > 0 && (
              <div className="px-2.5 py-0.5 rounded-full text-lg font-bold bg-amber-600 text-white min-w-10 text-center">
                {totalPaymentIssues}
              </div>
            )}
          </div>

          <div className="mb-3">
            <p className="text-xs font-bold uppercase tracking-tight text-amber-700 mb-0.5">Payment Issues</p>
            <p className="text-xs text-amber-600 font-semibold">Collection & violations</p>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between p-2 bg-white rounded border border-amber-100">
              <span className="text-xs font-semibold text-slate-700">Payment Pending</span>
              <span className="text-2xl font-bold text-amber-600">{stats.paymentPending}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded border border-amber-100">
              <span className="text-xs font-semibold text-slate-700">Overparked</span>
              <span className="text-2xl font-bold text-amber-600">{stats.overparkedCount}</span>
            </div>
          </div>

          {totalPaymentIssues > 0 && (
            <button
              onClick={() => alert(`💰 Opening Payment Issues...\nPending: ${stats.paymentPending} | Overparked: ${stats.overparkedCount}`)}
              className="w-full py-2 rounded bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors"
            >
              Collect Payment ({totalPaymentIssues})
            </button>
          )}
          {totalPaymentIssues === 0 && (
            <div className="w-full py-2 rounded bg-emerald-50 text-emerald-700 font-bold text-sm text-center">
              ✓ All Paid
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
