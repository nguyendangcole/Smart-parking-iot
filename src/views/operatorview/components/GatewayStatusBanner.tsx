import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Unlock, Lock, DoorClosed } from 'lucide-react';

interface Gate {
  id: string;
  name: string;
  zone: string;
  status: 'Online' | 'Alert' | 'Offline';
  img: string;
  recTime?: string;
  alert?: string;
  lockState: 'open' | 'closed' | 'locked';
}

interface GatewayStatusBannerProps {
  gates?: Gate[];
}

export default function GatewayStatusBanner({ gates }: GatewayStatusBannerProps) {
  const [showDetails, setShowDetails] = useState(false);

  const allGatesOperational = !gates || gates.length === 0 || gates.every(g => g.status !== 'Offline');

  return (
    <div className={`rounded-xl border px-4 py-3 transition-all ${
      allGatesOperational
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-center justify-between">
        {/* Left: Status Info */}
        <div className="flex items-center gap-3 min-w-0">
          {allGatesOperational ? (
            <div className="flex items-center gap-2">
              <Unlock className="text-emerald-600 flex-shrink-0" size={18} />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">System Status</p>
                <p className="text-sm font-bold text-emerald-900">All Gates Operational</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-600 flex-shrink-0 animate-pulse" size={18} />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">System Alert</p>
                <p className="text-sm font-bold text-amber-900">Gate Offline Detected</p>
              </div>
            </div>
          )}
        </div>

        {/* Middle: Details */}
        <div className="hidden sm:flex items-center gap-4 text-xs ml-4">
          <div className="flex items-center gap-1.5 text-slate-600">
            <CheckCircle size={14} className="text-emerald-600" />
            <span className="font-medium">
              Last checked: just now
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
              allGatesOperational
                ? 'text-emerald-700 hover:bg-emerald-100'
                : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {/* Detailed System Details (Gates Only) */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Gate Lock States</p>
          
          <div className="space-y-2">
            {/* Gates - if provided */}
            {gates && gates.length > 0 ? gates.map(gate => {
              const lockIcon = gate.lockState === 'open' ? Unlock : gate.lockState === 'locked' ? Lock : DoorClosed;
              const LockIcon = lockIcon;
              const lockColor = gate.lockState === 'open' ? 'text-emerald-600' : gate.lockState === 'locked' ? 'text-red-600' : 'text-slate-600';
              const lockBg = gate.lockState === 'open' ? 'bg-emerald-100 text-emerald-700' : gate.lockState === 'locked' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700';
              
              return (
                <div
                  key={gate.id}
                  className="flex items-center justify-between p-2 bg-white rounded border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <LockIcon className={`${lockColor} flex-shrink-0`} size={16} />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{gate.name}</p>
                      <p className="text-slate-500">{gate.zone}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`inline-block px-2 py-1 rounded font-bold ${lockBg}`}>
                      {gate.lockState.toUpperCase()}
                    </div>
                    <p className="text-slate-500 mt-1">
                      {gate.status === 'Online' ? 'Connected' : gate.status === 'Offline' ? 'Offline' : 'Alert'}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-xs text-slate-500">No gates available</p>
            )}
          </div>

          <p className="text-xs text-slate-500 pt-2">
            Real-time gate lock status across all parking zones.
          </p>
        </div>
      )}
    </div>
  );
}
