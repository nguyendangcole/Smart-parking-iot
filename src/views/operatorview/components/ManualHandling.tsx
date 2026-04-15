import React, { useState, useEffect } from 'react';
import { 
  Search, 
  PlusCircle, 
  Bike, 
  Car, 
  CheckCircle, 
  AlertTriangle, 
  CreditCard,
  Timer,
  Ban,
  ArrowRightLeft,
  Wallet,
  ExternalLink,
  Mail,
  Zap,
  HelpCircle,
  X,
  BookOpen,
  FileText,
  Phone,
  Users,
  LogIn,
  LogOut
} from 'lucide-react';
import LostCardModal from './LostCardModal';
import ManualEntryModal from './ManualEntryModal';
import OverrideGateModal from './OverrideGateModal';

export default function ManualHandling({ 
  pendingAction,
  clearPendingAction,
  onReturnToDashboard
}: {
  pendingAction?: { type: 'lost_card' | 'manual_entry' | 'manual_exit' | 'override_gate' | 'manual_handling' | null; data?: any };
  clearPendingAction?: () => void;
  onReturnToDashboard?: () => void;
}) {
  // Form State
  const [searchQuery, setSearchQuery] = useState('');
  const [plate, setPlate] = useState('');
  const [studentId, setStudentId] = useState('');
  const [reason, setReason] = useState('Lost RFID Card');
  const [supervisorCode, setSupervisorCode] = useState('');

  // Modal States
  const [showManualHandlingModal, setShowManualHandlingModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'lost_card' | 'manual_entry' | 'manual_exit' | 'override_gate'>('lost_card');
  const [showHelpDocs, setShowHelpDocs] = useState(false);
  const [manualActionType, setManualActionType] = useState<'entry' | 'exit'>('entry');

  // Activity Logging
  const [logs, setLogs] = useState([
    { action: 'Manual Exit approved for 59X3-122.90', sub: 'Resolved by Operator 10293 • 5 mins ago', icon: CheckCircle, color: 'emerald' },
    { action: 'Temporary Pass issued for 2012903 (Staff)', sub: 'Loss of card reported • 14 mins ago', icon: CreditCard, color: 'slate' },
    { action: 'Emergency Gate Override triggered at Gate A1', sub: 'Fire Alarm test signal • 32 mins ago', icon: AlertTriangle, color: 'amber' },
  ]);

  const [sessions, setSessions] = useState([
    { vehicle: '59P1-998.23', id: '2010884', time: '08:45 AM', gate: 'Gate A1', status: 'LOST CARD', type: 'bike' },
    { vehicle: '51H-123.45', id: 'Guest', time: '09:12 AM', gate: 'Gate B2', status: 'MANUAL REQ', type: 'car' },
  ]);

  const [stats, setStats] = useState({
    lostCards: 12,
    manualExits: 45,
    lostFeeTotal: '600k VND',
    avgResolveTime: '2.4m'
  });

  // Handle pending actions from Dashboard
  useEffect(() => {
    if (pendingAction?.type) {
      setShowManualHandlingModal(true);
      switch (pendingAction.type) {
        case 'lost_card':
          setActiveModalTab('lost_card');
          break;
        case 'manual_entry':
          setActiveModalTab('manual_entry');
          setManualActionType('entry');
          break;
        case 'manual_exit':
          setActiveModalTab('manual_exit');
          setManualActionType('exit');
          if (pendingAction.data?.slot) {
            setPlate(`Slot: ${pendingAction.data.slot}`);
          }
          break;
        case 'override_gate':
          setActiveModalTab('override_gate');
          break;
        case 'manual_handling':
          // Open modal with Lost Card tab as default
          setActiveModalTab('lost_card');
          break;
      }
      // Clear the pending action after opening the modal
      if (clearPendingAction) clearPendingAction();
    }
  }, [pendingAction, clearPendingAction]);

  // Handler Functions
  const handleIssuePass = () => {
    if (!plate.trim()) {
      alert('Please enter a vehicle license plate');
      return;
    }
    if (!supervisorCode.trim()) {
      alert('Please enter supervisor override code');
      return;
    }
    
    // Add new log entry
    const newLog = {
      action: `Temporary Pass issued for ${plate}`,
      sub: `Reason: ${reason} • Just now`,
      icon: CreditCard,
      color: 'slate'
    };
    setLogs([newLog, ...logs]);

    // Update stats
    setStats(prev => ({
      ...prev,
      manualExits: prev.manualExits + 1
    }));

    // Reset form
    setPlate('');
    setStudentId('');
    setSupervisorCode('');
    alert(`✓ Temporary pass issued for ${plate}`);
  };

  const handleManualExit = () => {
    if (!plate.trim()) {
      alert('Please enter a vehicle license plate');
      return;
    }
    setShowManualEntryModal(true);
  };

  const handleReleaseGate = (vehicle: string, id: string) => {
    setSessions(sessions.filter(s => s.vehicle !== vehicle));
    
    const newLog = {
      action: `Manual Exit approved for ${vehicle}`,
      sub: `Resolved by Operator • Just now`,
      icon: CheckCircle,
      color: 'emerald'
    };
    setLogs([newLog, ...logs]);
    
    setStats(prev => ({
      ...prev,
      manualExits: prev.manualExits + 1
    }));
    
    alert(`✓ Gate released for ${vehicle}`);
  };

  const handleEmergencyOpen = () => {
    const newLog = {
      action: 'Emergency Override triggered - All gates',
      sub: 'Critical incident response • Just now',
      icon: Zap,
      color: 'amber'
    };
    setLogs([newLog, ...logs]);
    alert('⚠️ EMERGENCY OVERRIDE: All gates activated\nThis action has been logged for audit trail.');
  };

  const filteredSessions = sessions.filter(s =>
    s.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Help Docs Modal */}
      {showHelpDocs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="sticky top-0 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen size={24} />
                <h2 className="text-xl font-bold">Manual Handling Guide</h2>
              </div>
              <button
                onClick={() => setShowHelpDocs(false)}
                className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Lost Card Handling */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="text-red-600" size={20} />
                  <h3 className="text-lg font-bold">Lost Card Handler</h3>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-800">When a vehicle's RFID card is lost:</p>
                  <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
                    <li>Enter the vehicle license plate</li>
                    <li>Verify the vehicle exists in the system</li>
                    <li>Confirm lost card claim (fee: 20,000 VND will be charged)</li>
                    <li>System creates temporary ticket for exit</li>
                    <li>Action is logged in audit trail</li>
                  </ol>
                </div>
              </section>

              {/* Manual Entry/Exit */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="text-blue-600" size={20} />
                  <h3 className="text-lg font-bold">Manual Entry & Exit</h3>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-800">For plate recognition failures or guest access:</p>
                  <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                    <li>Issue temporary pass to allow manual entry</li>
                    <li>Create manual exit record when vehicle leaves</li>
                    <li>Always provide a supervisor code</li>
                    <li>Document reason for manual action</li>
                  </ul>
                </div>
              </section>

              {/* Override Gate */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-amber-600" size={20} />
                  <h3 className="text-lg font-bold">Gate Override</h3>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-800">For emergency situations:</p>
                  <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                    <li>Only use when gate mechanism fails</li>
                    <li>Sensor malfunctions, obstruction detection errors</li>
                    <li>Document the override reason for audit</li>
                    <li>Notify maintenance team after override</li>
                  </ul>
                </div>
              </section>

              {/* Quick Tips */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="text-emerald-600" size={20} />
                  <h3 className="text-lg font-bold">Quick Tips</h3>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
                  <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                    <li>Always require supervisor override code</li>
                    <li>Search by plate, student ID, or card ID</li>
                    <li>Review pending sessions for any anomalies</li>
                    <li>Monitor activity logs for audit compliance</li>
                  </ul>
                </div>
              </section>

              {/* Contact Support */}
              <section className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="text-slate-600" size={20} />
                  <h3 className="text-lg font-bold">Need Help?</h3>
                </div>
                <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-700">
                  <p>📧 <strong>Email:</strong> support@hcmut-parking.edu.vn</p>
                  <p className="mt-2">📱 <strong>Hotline:</strong> +84 (0)28 1234 5678</p>
                  <p className="mt-2">⏰ <strong>Support Hours:</strong> 7:00 AM - 10:00 PM (Monday - Sunday)</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <LostCardModal isOpen={false} onClose={() => {}} />
      <ManualEntryModal isOpen={false} onClose={() => {}} defaultAction={manualActionType} />
      <OverrideGateModal isOpen={false} onClose={() => {}} />

      {/* Tabbed Manual Handling Modal */}
      {showManualHandlingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap size={24} />
                <h2 className="text-xl font-bold">Manual Handling Operations</h2>
              </div>
              <button
                onClick={() => setShowManualHandlingModal(false)}
                className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
              <button
                onClick={() => setActiveModalTab('lost_card')}
                className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-all ${
                  activeModalTab === 'lost_card'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <CreditCard className="inline mr-2" size={16} /> Lost Card
              </button>
              <button
                onClick={() => setActiveModalTab('manual_entry')}
                className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-all ${
                  activeModalTab === 'manual_entry'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <LogIn className="inline mr-2" size={16} /> Manual Entry
              </button>
              <button
                onClick={() => setActiveModalTab('manual_exit')}
                className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-all ${
                  activeModalTab === 'manual_exit'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <LogOut className="inline mr-2" size={16} /> Manual Exit
              </button>
              <button
                onClick={() => setActiveModalTab('override_gate')}
                className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-all ${
                  activeModalTab === 'override_gate'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Zap className="inline mr-2" size={16} /> Override Gate
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Lost Card Tab */}
              {activeModalTab === 'lost_card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Vehicle License Plate</label>
                    <input
                      type="text"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                      placeholder="e.g., ABC-1234"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Student ID</label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g., 2012345"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Reason</label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option>Lost RFID Card</option>
                      <option>Damaged Card</option>
                      <option>Expired Card</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Supervisor Override Code</label>
                    <input
                      type="password"
                      value={supervisorCode}
                      onChange={(e) => setSupervisorCode(e.target.value)}
                      placeholder="Required for authorization"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Manual Entry Tab */}
              {activeModalTab === 'manual_entry' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Vehicle License Plate</label>
                    <input
                      type="text"
                      placeholder="e.g., ABC-1234"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Entry Gate</label>
                    <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>Gate A1 (Main Entrance)</option>
                      <option>Gate A2 (Secondary)</option>
                      <option>Gate B1 (Staff)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Reason for Manual Entry</label>
                    <textarea
                      placeholder="Explain why manual entry is needed..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-24"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Supervisor Override Code</label>
                    <input
                      type="password"
                      placeholder="Required for authorization"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Manual Exit Tab */}
              {activeModalTab === 'manual_exit' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Vehicle License Plate</label>
                    <input
                      type="text"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                      placeholder="e.g., ABC-1234"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Exit Gate</label>
                    <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>Gate B2 (Main Exit)</option>
                      <option>Gate B3 (Secondary Exit)</option>
                      <option>Gate A1 (Entrance - Two-way)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Reason for Manual Exit</label>
                    <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>Card Reader Malfunction</option>
                      <option>Lost Card</option>
                      <option>System Error</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Supervisor Override Code</label>
                    <input
                      type="password"
                      placeholder="Required for authorization"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Override Gate Tab */}
              {activeModalTab === 'override_gate' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-800 font-semibold">⚠️ Use only in emergency situations</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Gate to Override</label>
                    <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>Gate A1 (Main Entrance)</option>
                      <option>Gate A2 (Secondary)</option>
                      <option>Gate B1 (Staff)</option>
                      <option>Gate B2 (Main Exit)</option>
                      <option>All Gates</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Override Type</label>
                    <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>Emergency Open</option>
                      <option>Force Close</option>
                      <option>Manual Control</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Emergency Reason</label>
                    <textarea
                      placeholder="Describe the emergency situation..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-24"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Supervisor Override Code</label>
                    <input
                      type="password"
                      placeholder="Required for authorization"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-between">
              <button
                onClick={() => {
                  setShowManualHandlingModal(false);
                }}
                className="px-4 py-2 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                ✕ Close
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    alert(`✓ ${activeModalTab.replace('_', ' ').toUpperCase()} operation submitted successfully`);
                    // Reset form and close
                    setPlate('');
                    setStudentId('');
                    setSupervisorCode('');
                    setActiveModalTab('lost_card');
                    setShowManualHandlingModal(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  ✓ Submit & Close
                </button>
                <button
                  onClick={() => {
                    alert(`✓ ${activeModalTab.replace('_', ' ').toUpperCase()} operation submitted successfully`);
                    setShowManualHandlingModal(false);
                    if (onReturnToDashboard) onReturnToDashboard();
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  ✓ Submit & Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Manual Handling</h2>
          <p className="text-slate-500 mt-1">Resolve lost card issues and manual gate overrides for exceptions.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowHelpDocs(true)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <HelpCircle size={18} />
            Help Docs
          </button>
          <button 
            onClick={handleEmergencyOpen}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-shadow shadow-md shadow-red-600/20"
          >
            Emergency Open
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Search & Forms */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Search Section */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Search className="text-primary" size={20} /> Find Active Session
            </h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="License Plate or Student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
          </section>

          {/* Issue Pass Form */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="text-primary" size={20} /> Manual Entry / Override
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Vehicle License Plate</label>
                <input 
                  type="text" 
                  placeholder="e.g. 59P1-12345"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  maxLength={12}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Student/Staff ID (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 2010123"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Reason for Manual Handling</label>
                <select 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  <option>Lost RFID Card</option>
                  <option>Damaged RFID Card</option>
                  <option>Plate Recognition Failure</option>
                  <option>Guest / VIP Entry</option>
                  <option>Emergency Service</option>
                  <option>Maintenance Access</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Supervisor Override Code</label>
                <input 
                  type="password" 
                  placeholder="••••••"
                  value={supervisorCode}
                  onChange={(e) => setSupervisorCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="pt-2 grid grid-cols-2 gap-3">
                <button 
                  onClick={handleIssuePass}
                  className="w-full py-3.5 rounded-xl border border-primary text-primary font-bold hover:bg-primary/5 transition-all"
                >
                  Issue Temp Pass
                </button>
                <button 
                  onClick={handleManualExit}
                  className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-shadow shadow-sm shadow-primary/20"
                >
                  Manual Exit
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Active Sessions & Logs */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* Active Exception Sessions */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold">Unresolved Entry Sessions</h3>
              <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-wider">
                {filteredSessions.length} PENDING
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vehicle</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Entry Time</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.length > 0 ? (
                    filteredSessions.map((session, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                              {session.type === 'bike' ? <Bike size={16} /> : <Car size={16} />}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{session.vehicle}</p>
                              <p className="text-xs text-slate-500">ID: {session.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium">{session.time}</p>
                          <p className="text-xs text-slate-400">{session.gate}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${
                            session.status === 'LOST CARD' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <span className={`size-1.5 rounded-full ${session.status === 'LOST CARD' ? 'bg-red-600' : 'bg-blue-600'}`}></span>
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleReleaseGate(session.vehicle, session.id)}
                            className="text-primary font-bold text-sm hover:underline"
                          >
                            {session.status === 'LOST CARD' ? 'Release Gate' : 'Mark Paid'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        <p>No sessions found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Activity Log */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold mb-6">Recent Activity Logs</h3>
            <div className="space-y-6">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className={`mt-1 size-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      log.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                      log.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      <log.icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {log.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{log.sub}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-4">No activity logs yet</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Footer Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="size-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <Ban size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lost Cards (Today)</p>
            <p className="text-xl font-bold">{stats.lostCards}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <ArrowRightLeft size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Manual Exits</p>
            <p className="text-xl font-bold">{stats.manualExits}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lost Fee Total</p>
            <p className="text-xl font-bold">{stats.lostFeeTotal}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="size-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
            <Timer size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Avg Resolve Time</p>
            <p className="text-xl font-bold">{stats.avgResolveTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
