import React, { useState } from 'react';
import { RefreshCw, LogIn, Lock } from 'lucide-react';

interface GateStatusPanelProps {
  onRefresh?: () => void;
  onOverride?: (gateId: string, gateName: string) => void;
}

interface Gate {
  id: string;
  name: string;
  description: string;
  status: 'open' | 'closed' | 'locked' | 'offline';
  lastUpdate: string;
}

export default function GateStatusPanel({ onRefresh, onOverride }: GateStatusPanelProps) {
  // Gate status is now stateful - can be updated
  const [gates, setGates] = useState<Gate[]>([
    {
      id: 'gate-1',
      name: 'Gate Entry',
      description: 'Main entrance',
      status: 'open',
      lastUpdate: '2 min ago'
    },
    {
      id: 'gate-2',
      name: 'Gate Exit',
      description: 'Main exit',
      status: 'open',
      lastUpdate: '1 min ago'
    },
  ]);

  const handleOverrideClick = (gateId: string, gateName: string) => {
    // Pass gate info to modal
    onOverride?.(gateId, gateName);
  };

  const handleUnlock = (gateId: string) => {
    // Directly unlock gate without modal
    const gate = gates.find(g => g.id === gateId);
    if (gate && gate.status === 'locked') {
      updateGateStatus(gateId, 'open');
      console.log(`✓ Gate "${gate.name}" has been UNLOCKED`);
    }
  };

  // Function to update gate status (called after override is confirmed)
  const updateGateStatus = (gateId: string, newStatus: Gate['status']) => {
    setGates(gates.map(gate =>
      gate.id === gateId
        ? { ...gate, status: newStatus, lastUpdate: 'just now' }
        : gate
    ));
  };

  // Expose this function via window for modal to call (or use context API in real app)
  React.useEffect(() => {
    (window as any).updateGateStatus = updateGateStatus;
  }, [gates]);

  const getStatusColor = (status: Gate['status']) => {
    switch (status) {
      case 'open':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700' };
      case 'closed':
        return { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-50 text-orange-700' };
      case 'locked':
        return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-50 text-red-700' };
      case 'offline':
        return { bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-50 text-slate-700' };
    }
  };

  const getStatusLabel = (status: Gate['status']) => {
    const labels = {
      open: 'Open',
      closed: 'Closed',
      locked: 'Locked',
      offline: 'Offline'
    };
    return labels[status];
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Gate Status</h2>
        <button
          onClick={onRefresh}
          className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="space-y-3">
        {gates.map((gate) => {
          const colors = getStatusColor(gate.status);
          return (
            <div
              key={gate.id}
              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${colors.bg} border-slate-200`}
            >
              <div className="flex items-center gap-3">
                {gate.name.includes('Entry') ? (
                  <LogIn className="text-blue-500" size={20} />
                ) : (
                  <LogIn className="text-blue-500 rotate-180" size={20} />
                )}
                <div>
                  <p className="font-semibold text-sm text-slate-900">{gate.name}</p>
                  <p className="text-xs text-slate-500">{gate.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${colors.badge}`}>
                    {getStatusLabel(gate.status)}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">{gate.lastUpdate}</p>
                </div>
                {gate.status === 'locked' ? (
                  <button
                    onClick={() => handleUnlock(gate.id)}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
                    title="Unlock gate"
                  >
                    <Lock size={16} className="text-red-600" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleOverrideClick(gate.id, gate.name)}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
                    title="Override gate manually"
                  >
                    <Lock size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
