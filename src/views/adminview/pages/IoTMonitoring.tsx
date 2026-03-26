import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/supabase';
import { motion, AnimatePresence } from 'motion/react';

interface IoTDevice {
  id: string;
  name: string;
  type: string; // 'sensor' | 'camera' | 'barrier' | 'controller'
  zone: string;
  status: 'ACTIVE' | 'OFFLINE' | 'DELAYED' | 'MAINTENANCE' | 'ERROR';
  last_ping: string;
  battery_level: number;
  signal_strength: number;
}

interface IoTIncident {
  id: string;
  device_id: string;
  device_name?: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  status: 'OPEN' | 'RESOLVED' | 'IGNORED';
  created_at: string;
}

const MOCK_DEVICES: IoTDevice[] = [
  { id: '1', name: 'Node #1042', type: 'sensor', zone: 'Zone A', status: 'ACTIVE', last_ping: new Date().toISOString(), battery_level: 95, signal_strength: -60 },
  { id: '2', name: 'Node #1043', type: 'sensor', zone: 'Zone A', status: 'ACTIVE', last_ping: new Date().toISOString(), battery_level: 80, signal_strength: -65 },
  { id: '3', name: 'Node #1044', type: 'sensor', zone: 'Zone B', status: 'ERROR', last_ping: new Date(Date.now() - 300000).toISOString(), battery_level: 15, signal_strength: -84 },
  { id: '4', name: 'Barrier Gate #02', type: 'barrier', zone: 'Main Gate', status: 'ERROR', last_ping: new Date().toISOString(), battery_level: 100, signal_strength: -50 }
];

const MOCK_INCIDENTS: IoTIncident[] = [
  { id: 'inc1', device_id: '4', device_name: 'Barrier Gate #02', severity: 'CRITICAL', description: 'Motor failure detected. Manual override engaged.', status: 'OPEN', created_at: new Date().toISOString() },
  { id: 'inc2', device_id: '3', device_name: 'IoT Node #1044', severity: 'WARNING', description: 'Intermittent connectivity. Signal strength at -84dBm.', status: 'OPEN', created_at: new Date().toISOString() }
];

export const IoTMonitoring: React.FC = () => {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [incidents, setIncidents] = useState<IoTIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<IoTDevice | null>(null);

  // Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerForm, setRegisterForm] = useState({
    name: '',
    type: 'sensor',
    zone: 'Zone A',
    status: 'ACTIVE'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch devices
      const { data: devData, error: devErr } = await supabase.from('iot_devices').select('*');
      if (devErr || !devData || devData.length === 0) {
        setDevices(MOCK_DEVICES);
      } else {
        setDevices(devData as IoTDevice[]);
      }

      // Fetch incidents
      const { data: incData, error: incErr } = await supabase
        .from('iot_incidents')
        .select(`*, iot_devices (name)`)
        .eq('status', 'OPEN');

      if (incErr || !incData || incData.length === 0) {
        setIncidents(MOCK_INCIDENTS);
      } else {
        setIncidents(incData.map(inc => ({
          ...inc,
          device_name: inc.iot_devices?.name || 'Unknown Device'
        })) as IoTIncident[]);
      }
    } catch {
      setDevices(MOCK_DEVICES);
      setIncidents(MOCK_INCIDENTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Actions
  const handleAction = (incidentId: string, action: string) => {
    alert(`${action} triggered for incident ${incidentId}`);
  };

  const handleDeviceAction = (node: IoTDevice, action: string) => {
    alert(`${action} triggered for device ${node.name}`);
  };

  const handleRegisterDevice = async () => {
    if (!registerForm.name) {
      setRegisterError('Device Name is strictly required.');
      return;
    }
    setRegisterError('');
    setIsRegistering(true);

    const newDevice = {
      name: registerForm.name,
      type: registerForm.type,
      zone: registerForm.zone,
      status: registerForm.status,
      battery_level: 100,
      signal_strength: -50,
      last_ping: new Date().toISOString()
    };

    const { error } = await supabase.from('iot_devices').insert([newDevice]);

    setIsRegistering(false);
    if (error) {
      setRegisterError(error.message);
    } else {
      setRegisterForm({ name: '', type: 'sensor', zone: 'Zone A', status: 'ACTIVE' });
      setIsRegisterModalOpen(false);
      fetchData(); // Sync DB
    }
  };

  // Status mapping
  const getSeverityStyles = (severity: string) => {
    if (severity === 'CRITICAL') return 'text-rose-600 bg-rose-50';
    if (severity === 'WARNING') return 'text-amber-600 bg-amber-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getNodeColor = (status: string) => {
    if (status === 'ACTIVE') return 'bg-emerald-500';
    if (status === 'OFFLINE' || status === 'DELAYED') return 'bg-slate-400';
    return 'bg-rose-500';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">IoT Monitoring</h2>
          <p className="text-slate-500 mt-1 font-medium">Real-time health and connectivity status of all campus hardware nodes.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-sm">refresh</span> Refresh Nodes
          </button>
          <button onClick={() => { setRegisterError(''); setIsRegisterModalOpen(true); }} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-600/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Register New Device
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <span className="material-symbols-outlined">cell_tower</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded">98% ONLINE</span>
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">ACTIVE SENSORS</p>
            <p className="text-3xl font-black text-slate-900 mt-1">1,248</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <span className="material-symbols-outlined">videocam</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded">100% ONLINE</span>
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">IP CAMERAS</p>
            <p className="text-3xl font-black text-slate-900 mt-1">84</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <span className="material-symbols-outlined">door_front</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-600 rounded">2 ISSUES</span>
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">BARRIERS & GATES</p>
            <p className="text-3xl font-black text-slate-900 mt-1">16</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined">router</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded">STABLE</span>
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">GATE CONTROLLERS</p>
            <p className="text-3xl font-black text-slate-900 mt-1">32</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Main Map UI */}
        <div className="lg:col-span-2 xl:col-span-3 h-[600px] bg-slate-50 rounded-2xl border border-slate-200 flex flex-col overflow-hidden relative shadow-inner">
          <div className="p-5 flex justify-between items-center absolute w-full z-10 bg-gradient-to-b from-slate-50/80 to-transparent backdrop-blur-sm">
            <h3 className="font-bold text-lg text-slate-800">Campus Map Overview</h3>
            <div className="flex gap-2">
              <button className="w-8 h-8 flex items-center justify-center bg-white rounded border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-600">
                <span className="material-symbols-outlined text-sm">zoom_in</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center bg-white rounded border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-600">
                <span className="material-symbols-outlined text-sm">zoom_out</span>
              </button>
            </div>
          </div>

          {/* Dotted Background for Map Feel */}
          <div className="flex-1 w-full h-full relative" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

            {/* Visual Zones */}
            <div className="absolute top-[30%] left-[30%] w-64 h-48 border-2 border-orange-200 rounded-2xl flex items-center justify-center bg-orange-50/30">
              <span className="text-orange-300 font-bold tracking-widest text-sm">ZONE A</span>
            </div>

            <div className="absolute top-[50%] left-[50%] w-72 h-40 border-2 border-orange-200 rounded-2xl flex items-center justify-center bg-orange-50/30">
              <span className="text-orange-300 font-bold tracking-widest text-sm">ZONE B</span>
            </div>

            {/* Left side node list mimicking the screenshot */}
            <div className="absolute left-6 top-20 flex flex-col gap-3">
              {devices.filter(d => d.type === 'sensor').map(node => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`px-3 py-2 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center gap-2 transition-all hover:-translate-y-0.5 ${selectedNode?.id === node.id ? 'ring-2 ring-orange-500 border-orange-500' : ''}`}
                >
                  <span className={`w-2 h-2 rounded-full ${getNodeColor(node.status)}`}></span>
                  <span className="text-xs font-bold text-slate-700">{node.name}</span>
                </button>
              ))}
            </div>

            {/* Floating Selected Node card in the map */}
            {selectedNode && (
              <div className="absolute bottom-10 right-10 bg-white p-5 rounded-2xl shadow-2xl border border-slate-200 w-64 animate-in slide-in-from-bottom-4 zoom-in-95">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SELECTED NODE</p>
                <h4 className="font-black text-lg text-slate-900">{selectedNode.name}</h4>

                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Status</span>
                    <span className={`font-bold ${getNodeColor(selectedNode.status).replace('bg-', 'text-')}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Last Ping</span>
                    <span className="font-bold text-slate-800">{new Date(selectedNode.last_ping).toLocaleTimeString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeviceAction(selectedNode, 'Run Diagnostics')}
                  className="w-full mt-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Run Diagnostics
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Elements */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
            <h3 className="font-bold text-lg text-slate-900 mb-6">Hardware Malfunctions</h3>

            <div className="space-y-4">
              {incidents.map(inc => (
                <div key={inc.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getSeverityStyles(inc.severity)}`}>
                        <span className="material-symbols-outlined text-lg">
                          {inc.device_name?.includes('Gate') ? 'door_front' : 'sensors'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{inc.device_name}</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{inc.description}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase ${inc.severity === 'CRITICAL' ? 'text-rose-600 bg-rose-100' : 'text-amber-600 bg-amber-100'}`}>
                      {inc.severity}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3 ml-[52px]">
                    {inc.severity === 'CRITICAL' ? (
                      <>
                        <button onClick={() => handleAction(inc.id, 'Dispatch Tech')} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors shrink-0">Dispatch Tech</button>
                        <button onClick={() => handleAction(inc.id, 'Ignore Alarm')} className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors shrink-0">Ignore</button>
                      </>
                    ) : (
                      <button onClick={() => handleAction(inc.id, 'Reboot Node')} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20 shrink-0">Reboot Node</button>
                    )}
                  </div>
                </div>
              ))}

              {incidents.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">All systems functioning normally.</p>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
            <h3 className="font-bold text-lg mb-6 relative z-10">Connectivity Details</h3>

            <div className="space-y-6 relative z-10">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs text-slate-400 font-medium">Network Latency</span>
                  <span className="text-emerald-400 font-bold text-sm tracking-wide">12ms</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '20%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs text-slate-400 font-medium">Data Throughput</span>
                  <span className="text-white font-bold text-sm tracking-wide">1.2 GB/hr</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Register Device Modal */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden"
            >
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-600">dns</span> Register Node
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Provision a new hardware device to the campus network</p>
                </div>
                <button onClick={() => setIsRegisterModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-slate-500">close</span>
                </button>
              </div>

              <div className="p-6 space-y-5">
                {registerError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span> {registerError}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Device Name (ID)</label>
                    <input
                      type="text"
                      placeholder="e.g. Gateway Node #2088"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm font-semibold text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                      <select
                        value={registerForm.type}
                        onChange={(e) => setRegisterForm({ ...registerForm, type: e.target.value })}
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm font-semibold text-slate-700"
                      >
                        <option value="sensor">Sensor Node</option>
                        <option value="camera">IP Camera</option>
                        <option value="barrier">Gate Barrier</option>
                        <option value="controller">Controller Box</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zone Placement</label>
                      <select
                        value={registerForm.zone}
                        onChange={(e) => setRegisterForm({ ...registerForm, zone: e.target.value })}
                        className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-sm font-semibold text-slate-700"
                      >
                        <option value="Zone A">Zone A</option>
                        <option value="Zone B">Zone B</option>
                        <option value="Zone C">Zone C</option>
                        <option value="Main Gate">Main Gate</option>
                        <option value="Basement">Basement</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegisterDevice}
                  disabled={isRegistering}
                  className="flex-1 py-2.5 bg-orange-600 hover:brightness-110 text-white shadow-lg shadow-orange-600/30 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isRegistering ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> : 'Provision Device'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
