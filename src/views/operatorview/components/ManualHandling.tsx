import React, { useState } from 'react';
import { 
  AlertTriangle,
  HelpCircle,
  X,
  Bike,
  Car,
  CheckCircle,
  MoreVertical,
  Search,
  PlusCircle,
  CreditCard,
  Timer,
  Ban,
  ArrowRightLeft,
  Wallet,
  Zap,
  LogIn,
  LogOut
} from 'lucide-react';
import { useProfile } from '../../../shared/hooks/useProfile';
import { operatorService } from '../../../shared/services/operatorService';
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
  const { profile } = useProfile();
  
  // Form State
  const [searchQuery, setSearchQuery] = useState('');
  const [plate, setPlate] = useState('');
  const [studentId, setStudentId] = useState('');
  const [reason, setReason] = useState('Lost RFID Card');
  const [supervisorCode, setSupervisorCode] = useState('');
  
  // Data State
  const [manualRequests, setManualRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [showManualHandlingModal, setShowManualHandlingModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'lost_card' | 'manual_entry' | 'manual_exit' | 'override_gate'>('lost_card');
  const [showHelpDocs, setShowHelpDocs] = useState(false);
  const [manualActionType, setManualActionType] = useState<'entry' | 'exit'>('entry');
  const [showLostCardModal, setShowLostCardModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Fetch manual requests
  useEffect(() => {
    const fetchManualRequests = async () => {
      if (!profile?.id) return;
      
      try {
        const requests = await operatorService.getManualHandlingRequests(profile.id);
        setManualRequests(requests);
      } catch (error) {
        console.error('Error fetching manual requests:', error);
      }
    };

    fetchManualRequests();
  }, [profile?.id]);

  // Handler functions
  const handleCreateLostCardRequest = async () => {
    if (!profile?.id || !plate || !studentId) return;
    
    setLoading(true);
    try {
      await operatorService.createManualHandlingRequest({
        operator_id: profile.id,
        request_type: 'lost_card',
        vehicle_plate: plate,
        student_id: studentId,
        reason: reason,
        supervisor_code: supervisorCode
      });
      
      // Refresh requests
      const requests = await operatorService.getManualHandlingRequests(profile.id);
      setManualRequests(requests);
      
      // Reset form
      setPlate('');
      setStudentId('');
      setSupervisorCode('');
      setShowLostCardModal(false);
      
    } catch (error) {
      console.error('Error creating lost card request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManualEntryRequest = async () => {
    if (!profile?.id || !plate) return;
    
    setLoading(true);
    try {
      await operatorService.createManualHandlingRequest({
        operator_id: profile.id,
        request_type: manualActionType === 'entry' ? 'manual_entry' : 'manual_exit',
        vehicle_plate: plate,
        student_id: studentId,
        reason: reason,
        supervisor_code: supervisorCode
      });
      
      // Refresh requests
      const requests = await operatorService.getManualHandlingRequests(profile.id);
      setManualRequests(requests);
      
      // Reset form
      setPlate('');
      setStudentId('');
      setSupervisorCode('');
      setShowManualEntryModal(false);
      
    } catch (error) {
      console.error('Error creating manual entry request:', error);
    } finally {
      setLoading(false);
    }
  };

  // Activity Logging
  const [logs, setLogs] = useState([
    { action: 'Manual Exit approved for 59X3-122.90', sub: 'Resolved by Operator 10293 • 5 mins ago', icon: CheckCircle, color: 'emerald' as const },
    { action: 'Temporary Pass issued for 2012903 (Staff)', sub: 'Loss of card reported • 14 mins ago', icon: CreditCard, color: 'slate' as const },
    { action: 'Emergency Gate Override triggered at Gate A1', sub: 'Fire Alarm test signal • 32 mins ago', icon: AlertTriangle, color: 'amber' as const },
  ]);

  const [stats, setStats] = useState({
    lostCards: 12,
    manualExits: 45,
    lostFeeTotal: '600k VND',
    avgResolveTime: '2.4m'
  });

  // Handler Functions

  const handleReleaseGate = (vehicle: string, id: string) => {
    setSessions(sessions.filter(s => s.vehicle !== vehicle));
    
    const newLog = {
      action: `Manual Exit approved for ${vehicle}`,
      sub: `Resolved by Operator • Just now`,
      icon: CheckCircle,
      color: 'emerald' as const
    };
    setLogs([newLog, ...logs]);
    
    setStats(prev => ({
      ...prev,
      manualExits: prev.manualExits + 1
    }));
    
    alert(`Gate released for ${vehicle}`);
  };



  const filteredSessions = sessions.filter(s =>
    s.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight">Pending Cases & Operations</h2>
        <p className="text-slate-500 mt-2">Monitor pending cases and review all manual operations in real-time.</p>
      </header>

      {/* Search Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="text-primary" size={20} />
          <h3 className="text-lg font-bold">Find Active Session</h3>
        </div>
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

      <div className="space-y-6">
          {/* Quick Reference Tips */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-200 p-5">
            <div className="flex gap-3">
              <HelpCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-blue-900 mb-2">Handling Pending Cases</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Lost Card:</strong> Driver has lost parking card. Release gate or issue temporary pass after fee collection.
                  <strong className="block mt-1">Scan Failed:</strong> Card reader error. Verify vehicle info and collect payment before release.
                </p>
              </div>
            </div>
          </section>

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
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Wait / Status</th>
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
                              <p className="text-xs text-slate-500">ID: {session.studentId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium">{session.entryTime}</p>
                          <p className="text-xs text-slate-400">{session.gate}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1.5">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${
                              session.status === 'LOST_CARD' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              <span className={`size-1.5 rounded-full ${session.status === 'LOST_CARD' ? 'bg-red-600' : 'bg-blue-600'}`}></span>
                              {session.status === 'LOST_CARD' ? 'LOST CARD' : 'SCAN FAILED'}
                            </div>
                            <p className={`text-xs font-bold ${session.priority === 'high' ? 'text-orange-600' : 'text-slate-500'}`}>
                              Wait: {session.waitTime}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleReleaseGate(session.vehicle, session.id)}
                            className="text-primary font-bold text-sm hover:underline hover:text-primary/80 transition-colors"
                          >
                            {session.status === 'LOST_CARD' ? 'Release Gate' : 'Mark Paid'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle size={32} className="text-emerald-300" />
                          <p className="text-slate-500 font-medium">No pending cases</p>
                          <p className="text-xs text-slate-400">All vehicles have exited or paid</p>
                        </div>
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

      {/* Operations Log Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <OperationsLog />
      </section>

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
