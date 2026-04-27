import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  DoorOpen, 
  DoorClosed, 
  Lock, 
  AlertCircle,
  Video,
  Signal,
  History,
  ChevronRight,
  Mail,
  ExternalLink,
  Cpu,
  Unlock,
  X
} from 'lucide-react';
import GateActionModal from './GateActionModal';
import ActionFeedback from './ActionFeedback';

interface Gate {
  id: string;
  name: string;
  zone: string;
  laneType: 'two-wheel' | 'four-wheel';
  direction: 'entry' | 'exit';
  status: 'Online' | 'Alert' | 'Offline';
  img: string;
  recTime?: string;
  alert?: string;
  lockState: 'open' | 'closed' | 'locked';
}

interface HistoryEntry {
  action: string;
  user: string;
  time: string;
  type: 'open' | 'lock' | 'close';
  reason?: string;
}

interface Feedback {
  type: 'success' | 'error' | 'loading';
  message: string;
  action: string;
  gateName: string;
  timestamp: string;
}

interface GateControlProps {
  gates?: Gate[];
  onGatesChange?: (gates: Gate[]) => void;
}

export default function GateControl({ gates: externalGates, onGatesChange }: GateControlProps) {
  // Use external gates if provided (from parent), otherwise maintain local state (fallback)
  const [localGates, setLocalGates] = useState<Gate[]>([
    { 
      id: 'A', 
      name: 'Motorbike Entry Lane', 
      zone: 'Motorbike Lot', 
      laneType: 'two-wheel',
      direction: 'entry',
      status: 'Online', 
      img: 'https://picsum.photos/seed/gateA_live/600/400',
      recTime: '10:45:22',
      lockState: 'open'
    },
    { 
      id: 'B', 
      name: 'Motorbike Exit Lane', 
      zone: 'Motorbike Lot', 
      laneType: 'two-wheel',
      direction: 'exit',
      status: 'Alert', 
      img: 'https://picsum.photos/seed/gateB_live/600/400',
      alert: 'Obstruction Detected',
      lockState: 'closed'
    },
    { 
      id: 'C', 
      name: 'Car Entry Lane', 
      zone: 'Car Lot', 
      laneType: 'four-wheel',
      direction: 'entry',
      status: 'Offline', 
      img: '',
      lockState: 'closed'
    },
    { 
      id: 'D', 
      name: 'Car Exit Lane', 
      zone: 'Car Lot', 
      laneType: 'four-wheel',
      direction: 'exit',
      status: 'Online', 
      img: 'https://picsum.photos/seed/gateD_live/600/400',
      lockState: 'open'
    },
  ]);

  const gates = externalGates && externalGates.length > 0 ? externalGates : localGates;
  const setGates = onGatesChange || setLocalGates;

  const [history, setHistory] = useState<HistoryEntry[]>([
    { action: 'Gate A Opened Manually', user: 'By Operator Nguyen Van A', time: '10:42 AM', type: 'open', reason: 'Vehicle waiting' },
    { action: 'Gate B Emergency Locked', user: 'Auto-lock: Obstruction Sensor', time: '10:35 AM', type: 'lock', reason: 'Obstruction detected' },
    { action: 'Gate D Closed Manually', user: 'By Admin System', time: '10:15 AM', type: 'close' },
    { action: 'Gate A Opened Manually', user: 'By Operator Nguyen Van A', time: '09:58 AM', type: 'open' },
    { action: 'Gate A Closed Manually', user: 'By Operator Nguyen Van A', time: '09:55 AM', type: 'close' },
  ]);

  // Modal & Feedback State
  const [showModal, setShowModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);
  const [actionType, setActionType] = useState<'open' | 'close' | 'emergency_lock'>('open');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [pendingEmergency, setPendingEmergency] = useState<{ gate: Gate; reason: string } | null>(null);

  // Gate Type Filter
  const [gateFilter, setGateFilter] = useState<'all' | 'entrance' | 'exit'>('all');

  // Filter gates based on type
  const getFilteredGates = () => {
    if (gateFilter === 'all') return gates;
    if (gateFilter === 'entrance') {
      return gates.filter(g => g.direction === 'entry');
    }
    if (gateFilter === 'exit') {
      return gates.filter(g => g.direction === 'exit');
    }
    return gates;
  };

  const handleActionClick = (gate: Gate, type: 'open' | 'close' | 'emergency_lock') => {
    if (gate.status === 'Offline') {
      setFeedback({
        type: 'error',
        message: 'Gate is offline - cannot perform action',
        action: type,
        gateName: gate.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      return;
    }
    if (gate.status === 'Alert' && type === 'open') {
      setFeedback({
        type: 'error',
        message: 'Gate has an active alert - cannot open. Check obstruction first.',
        action: type,
        gateName: gate.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      return;
    }

    // Emergency lock requires explicit confirmation
    if (type === 'emergency_lock') {
      setShowEmergencyConfirm(true);
      setPendingEmergency({ gate, reason: '' });
      return;
    }

    setSelectedGate(gate);
    setActionType(type);
    setShowModal(true);
  };

  const handleConfirmAction = async (reason: string) => {
    if (!selectedGate) return;

    setIsSubmitting(true);
    setFeedback({
      type: 'loading',
      message: 'Processing gate action...',
      action: actionType,
      gateName: selectedGate.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Simulate API call
    setTimeout(() => {
      // Update gate state
      setGates(prev =>
        prev.map(g => {
          if (g.id === selectedGate.id) {
            let newLockState = g.lockState;
            if (actionType === 'open') newLockState = 'open';
            else if (actionType === 'close') newLockState = 'closed';
            else if (actionType === 'emergency_lock') newLockState = 'locked';
            return { ...g, lockState: newLockState };
          }
          return g;
        })
      );

      // Add to history
      const actionLabels = {
        open: 'Opened',
        close: 'Closed',
        emergency_lock: 'Emergency Locked'
      };

      const newHistoryEntry: HistoryEntry = {
        action: `Gate ${selectedGate.id} ${actionLabels[actionType]} Manually`,
        user: 'By Operator (You)',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: actionType === 'open' ? 'open' : actionType === 'emergency_lock' ? 'lock' : 'close',
        reason
      };

      setHistory([newHistoryEntry, ...history]);

      // Show success feedback
      setFeedback({
        type: 'success',
        message: `Gate has been successfully ${actionLabels[actionType].toLowerCase()}. Reason: ${reason}`,
        action: actionType,
        gateName: selectedGate.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      setIsSubmitting(false);
      setShowModal(false);
      setSelectedGate(null);
    }, 1500);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setShowClearConfirm(false);
    setFeedback({
      type: 'success',
      message: 'Manual override history has been cleared',
      action: 'clear',
      gateName: 'System',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  const getLockIcon = (state: 'open' | 'closed' | 'locked') => {
    switch (state) {
      case 'open':
        return { icon: Unlock, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'OPEN' };
      case 'closed':
        return { icon: DoorClosed, color: 'text-slate-600', bg: 'bg-slate-100', label: 'CLOSED' };
      case 'locked':
        return { icon: Lock, color: 'text-red-600', bg: 'bg-red-100', label: 'LOCKED' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-black tracking-tight">Gate Control Center</h2>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Live System</span>
          </div>
          <p className="text-slate-500 text-sm">Monitor and override gate mechanisms in real-time across the HCMUT campus.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button 
            onClick={() => setGateFilter('all')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              gateFilter === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-500 hover:text-primary'
            }`}
          >
            All Gates ({gates.length})
          </button>
          <button 
            onClick={() => setGateFilter('entrance')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              gateFilter === 'entrance'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-500 hover:text-primary'
            }`}
          >
            Entrance ({gates.filter(g => g.direction === 'entry').length})
          </button>
          <button 
            onClick={() => setGateFilter('exit')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              gateFilter === 'exit'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-500 hover:text-primary'
            }`}
          >
            Exit ({gates.filter(g => g.direction === 'exit').length})
          </button>
        </div>
      </header>

      {/* Action Feedback */}
      {feedback && (
        <div className="fixed bottom-6 right-6 max-w-md z-40">
          <ActionFeedback
            {...feedback}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Gate Panels Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {getFilteredGates().map((gate) => {
            const lockIcon = getLockIcon(gate.lockState);
            const LockIcon = lockIcon.icon;

            return (
              <div 
                key={gate.id} 
                className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all ${
                  gate.status === 'Alert' ? 'border-2 border-amber-400' : 'border-slate-200'
                } ${gate.status === 'Offline' ? 'opacity-60 grayscale-[0.5]' : ''}`}
              >
                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-sm">{gate.name} - Gate {gate.id}</h4>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {gate.zone} • {gate.laneType === 'two-wheel' ? '2-WHEEL' : '4-WHEEL'} • {gate.direction.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {/* Gate Connection Status */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      gate.status === 'Online' ? 'bg-emerald-100 text-emerald-700' :
                      gate.status === 'Alert' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {gate.status === 'Online' && <div className="size-2 rounded-full bg-emerald-500"></div>}
                      {gate.status === 'Alert' && <AlertCircle size={12} />}
                      {gate.status}
                    </div>
                    
                    {/* Gate Lock State */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${lockIcon.bg} ${lockIcon.color}`}>
                      <LockIcon size={14} />
                      {lockIcon.label}
                    </div>
                  </div>
                </div>

                <div className="relative aspect-video bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  {gate.status === 'Offline' ? (
                    <div className="text-center">
                      <Signal className="text-slate-400 mx-auto mb-2" size={48} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Connection Lost</p>
                    </div>
                  ) : (
                    <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-t from-black/40 via-transparent to-transparent">
                      <div className="text-center">
                        <Video className="text-white/60 mx-auto mb-3" size={48} />
                        <p className="text-white text-sm font-bold uppercase tracking-widest">Live CCTV Feed</p>
                        <p className="text-white/50 text-[10px] mt-1">Camera Not Connected</p>
                      </div>
                      {gate.recTime && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white font-mono">REC {gate.recTime}</div>
                      )}
                      {gate.alert && (
                        <div className="absolute inset-0 flex items-center justify-center border-4 border-amber-400 bg-black/30">
                          <div className="bg-amber-400 text-white px-3 py-1 rounded-full text-[10px] font-bold animate-pulse uppercase tracking-widest">
                            {gate.alert}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleActionClick(gate, 'open')}
                      disabled={gate.status === 'Offline' || gate.status === 'Alert' || isSubmitting}
                      className={`flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold text-sm transition-all ${
                        (gate.status === 'Offline' || gate.status === 'Alert' || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
                      }`}
                    >
                      <DoorOpen size={18} /> Open
                    </button>
                    <button 
                      onClick={() => handleActionClick(gate, 'close')}
                      disabled={gate.status === 'Offline' || isSubmitting}
                      className={`flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm transition-all ${
                        (gate.status === 'Offline' || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'
                      }`}
                    >
                      <DoorClosed size={18} /> Close
                    </button>
                    <button 
                      onClick={() => handleActionClick(gate, 'emergency_lock')}
                      disabled={gate.status === 'Offline' || isSubmitting}
                      className={`col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                        gate.status === 'Alert' 
                          ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      } ${(gate.status === 'Offline' || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Emergency lock - restricted operation with confirmation required"
                    >
                      <Lock size={18} /> Emergency Lock
                    </button>
                  </div>

                  {gate.status === 'Alert' && gate.alert && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs font-bold text-amber-700 mb-1">Alert: {gate.alert}</p>
                      <p className="text-[10px] text-amber-600">Check camera first. Clear obstruction before opening gate.</p>
                    </div>
                  )}
                  {gate.status === 'Offline' && (
                    <div className="mt-4 p-3 bg-slate-100 border border-slate-300 rounded-lg">
                      <p className="text-xs font-bold text-slate-700 mb-1">Connection Lost</p>
                      <p className="text-[10px] text-slate-600">Manual override requires emergency lock confirmation.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* History Sidebar Section */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <History size={16} className="text-primary" /> Manual Override History
              </h4>
              <button 
                onClick={() => setShowClearConfirm(true)}
                disabled={history.length === 0}
                className="text-[10px] font-bold text-primary hover:underline disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="p-4 flex-1 space-y-5 overflow-y-auto max-h-[600px]">
              {history.length > 0 ? (
                history.map((item, i) => (
                  <div key={i} className="flex gap-3 group">
                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      item.type === 'open' ? 'bg-primary/10 text-primary' :
                      item.type === 'lock' ? 'bg-red-100 text-red-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.type === 'open' ? <DoorOpen size={14} /> : 
                       item.type === 'lock' ? <Lock size={14} /> : 
                       <DoorClosed size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight group-hover:text-primary transition-colors truncate">{item.action}</p>
                      <p className="text-[10px] text-slate-500 truncate">{item.user}</p>
                      {item.reason && (
                        <p className="text-[10px] text-slate-400 italic truncate">Reason: {item.reason}</p>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 block mt-1">{item.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <History size={32} className="text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-500">No override history yet</p>
                  <p className="text-xs text-slate-400">Gate actions will appear here</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors">
                View Detailed Log Report
              </button>
            </div>
          </div>

          <div className="bg-primary p-6 rounded-2xl text-white shadow-lg shadow-primary/20">
            <h5 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Cpu size={16} /> System Snapshot
            </h5>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-80">Total Gates Active</span>
                <span className="font-bold">{gates.filter(g => g.status !== 'Offline').length}/{gates.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-80">Alerts Pending</span>
                <span className="font-bold bg-white text-primary px-2 py-0.5 rounded-full">
                  {gates.filter(g => g.status === 'Alert').length > 0 ? gates.filter(g => g.status === 'Alert').length.toString().padStart(2, '0') : '00'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="opacity-80">Manual Actions (Today)</span>
                <span className="font-bold">{history.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gate Action Modal */}
      {selectedGate && (
        <GateActionModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedGate(null);
          }}
          gateName={selectedGate.name}
          gateId={selectedGate.id}
          actionType={actionType}
          onConfirm={handleConfirmAction}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} />
                <h2 className="text-xl font-bold">Clear History</h2>
              </div>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="p-1 hover:bg-amber-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-sm text-amber-900">Permanent Action</p>
                  <p className="text-xs text-amber-700 mt-1">
                    This will permanently delete all {history.length} manual override record(s) from the history. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 font-mono">
                  Records to delete: <span className="font-bold text-slate-800">{history.length}</span>
                </p>
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearHistory}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                >
                  Clear All Records
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Lock Confirmation Modal */}
      {showEmergencyConfirm && pendingEmergency && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} />
                <h2 className="text-xl font-bold">Emergency Gate Lock</h2>
              </div>
              <button
                onClick={() => {
                  setShowEmergencyConfirm(false);
                  setPendingEmergency(null);
                }}
                className="p-1 hover:bg-red-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-bold text-red-800 mb-2">RESTRICTED OPERATION</p>
                <p className="text-sm text-red-700">Emergency gate lock should only be used in critical situations:</p>
                <ul className="text-xs text-red-600 mt-2 space-y-1 ml-4 list-disc">
                  <li>Fire alarm or evacuation emergency</li>
                  <li>Security threat or unauthorized access</li>
                  <li>Complete gate mechanism failure</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">Gate to Lock</label>
                <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-800">{pendingEmergency.gate.name}</p>
                  <p className="text-xs text-slate-500">Zone: {pendingEmergency.gate.zone}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">Emergency Reason</label>
                <textarea
                  value={pendingEmergency.reason}
                  onChange={(e) => setPendingEmergency({ ...pendingEmergency, reason: e.target.value })}
                  placeholder="Describe the emergency situation..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none h-24 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowEmergencyConfirm(false);
                    setPendingEmergency(null);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!pendingEmergency.reason.trim()) {
                      alert('Please describe the emergency reason');
                      return;
                    }
                    setSelectedGate(pendingEmergency.gate);
                    setActionType('emergency_lock');
                    setShowModal(true);
                    setShowEmergencyConfirm(false);
                    setPendingEmergency(null);
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Proceed with Lock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
