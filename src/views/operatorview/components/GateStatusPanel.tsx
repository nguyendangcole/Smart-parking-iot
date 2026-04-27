import React, { useState } from 'react';
import { RefreshCw, LogIn, Lock } from 'lucide-react';

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

interface GateStatusPanelProps {
  onRefresh?: () => void;
  gates?: Gate[];
  onGatesChange?: (gates: Gate[]) => void;
  onOverride?: (gateId: string, gateName: string) => void;
}

export default function GateStatusPanel({ onRefresh, gates: externalGates, onGatesChange, onOverride }: GateStatusPanelProps) {
  // Use external gates if provided (from parent), otherwise maintain local state (fallback)
  const [localGates, setLocalGates] = useState<Gate[]>([
    {
      id: 'A',
      name: 'Main Entrance',
      zone: 'North Campus',
      status: 'Online',
      img: '',
      lockState: 'open',
      recTime: '2 min ago'
    },
    {
      id: 'B',
      name: 'Staff Parking',
      zone: 'East Tower',
      status: 'Alert',
      img: '',
      alert: 'Obstruction Detected',
      lockState: 'closed',
      recTime: '1 min ago'
    },
    {
      id: 'C',
      name: 'Library Exit',
      zone: 'Central Hub',
      status: 'Offline',
      img: '',
      lockState: 'closed',
      recTime: 'Offline'
    },
    {
      id: 'D',
      name: 'Dormitory Entry',
      zone: 'Residential',
      status: 'Online',
      img: '',
      lockState: 'open',
      recTime: 'Just now'
    },
  ]);

  // Use external gates if provided, otherwise use local
  const gates = externalGates && externalGates.length > 0 ? externalGates : localGates;

  const handleOverrideClick = (gateId: string, gateName: string) => {
    // Pass gate info to modal
    onOverride?.(gateId, gateName);
  };

  const handleUnlock = (gateId: string) => {
    // Directly unlock gate without modal
    const gate = gates.find(g => g.id === gateId);
    if (gate && gate.lockState === 'locked') {
      updateGateStatus(gateId, 'open');
      console.log(`✓ Gate "${gate.name}" has been UNLOCKED`);
    }
  };

  // Function to update gate lock state (syncs to parent)
  const updateGateStatus = (gateId: string, newLockState: 'open' | 'closed' | 'locked') => {
    const updatedGates = gates.map(gate =>
      gate.id === gateId
        ? { ...gate, lockState: newLockState, recTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
        : gate
    );
    
    // Update parent if callback provided, otherwise update local state
    if (onGatesChange) {
      onGatesChange(updatedGates);
    } else {
      setLocalGates(updatedGates);
    }
  };

  const getStatusColor = (lockState: 'open' | 'closed' | 'locked') => {
    switch (lockState) {
      case 'open':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700' };
      case 'closed':
        return { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-50 text-orange-700' };
      case 'locked':
        return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-50 text-red-700' };
    }
  };

  const getStatusLabel = (lockState: 'open' | 'closed' | 'locked') => {
    const labels = {
      open: 'Open',
      closed: 'Closed',
      locked: 'Locked'
    };
    return labels[lockState];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">Gate status and control information</p>
        <button
          onClick={onRefresh}
          className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="space-y-3">
        {gates.map((gate) => {
          const colors = getStatusColor(gate.lockState);
          return (
            <div
              key={gate.id}
              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${colors.bg} border-slate-200`}
            >
              <div className="flex items-center gap-3">
                {gate.name.includes('Entry') || gate.name.includes('Entrance') ? (
                  <LogIn className="text-blue-500" size={20} />
                ) : (
                  <LogIn className="text-blue-500 rotate-180" size={20} />
                )}
                <div>
                  <p className="font-semibold text-sm text-slate-900">{gate.name}</p>
                  <p className="text-xs text-slate-500">{gate.zone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${colors.badge}`}>
                    {getStatusLabel(gate.lockState)}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">{gate.recTime || 'just now'}</p>
                </div>
                {gate.lockState === 'locked' ? (
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
