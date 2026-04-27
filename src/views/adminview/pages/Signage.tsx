import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { recordAuditLog } from '../../../shared/utils/audit';

interface SignageDisplay {
  id: string;
  display_id: string;
  location: string;
  header_text: string;
  marquee_message: string;
  theme_color: string;
  status: 'OPEN' | 'NEARLY FULL' | 'FULL' | 'CLOSED';
  linked_zone?: string;
  total_spaces: number;
  available_spaces: number;
  is_emergency: boolean;
  updated_at: string;
}

const MOCK_SIGNAGE: SignageDisplay[] = [
  { id: '1', display_id: 'LED-01', location: 'Main Entrance', linked_zone: '', header_text: 'WELCOME TO HCMUT', marquee_message: 'PLEASE DRIVE SLOWLY • OBSERVE PARKING RULES • CONTACT SECURITY FOR ASSISTANCE', theme_color: 'orange', status: 'OPEN', total_spaces: 500, available_spaces: 248, is_emergency: false, updated_at: new Date().toISOString() },
  { id: '2', display_id: 'LED-02', location: 'East Wing', linked_zone: 'Zone A', header_text: 'ZONE A PARKING', marquee_message: 'PARKING IS ALMOST FULL • PROCEED TO ZONE B FOR MORE SPACES', theme_color: 'orange', status: 'NEARLY FULL', total_spaces: 100, available_spaces: 15, is_emergency: false, updated_at: new Date().toISOString() },
  { id: '3', display_id: 'LED-03', location: 'Basement', linked_zone: 'Zone C', header_text: 'UNDERGROUND ZONE C', marquee_message: 'ZONE FULL • REDIRECT TO MAIN CAMPUS PARKING', theme_color: 'rose', status: 'FULL', total_spaces: 150, available_spaces: 0, is_emergency: false, updated_at: new Date().toISOString() },
  { id: '4', display_id: 'LED-04', location: 'West Wing', linked_zone: 'Zone B', header_text: 'ZONE B PARKING', marquee_message: 'WELCOME TO ZONE B • OPEN PARKING AVAILABLE', theme_color: 'emerald', status: 'OPEN', total_spaces: 100, available_spaces: 48, is_emergency: false, updated_at: new Date().toISOString() }
];

export const Signage: React.FC = () => {
  const [displays, setDisplays] = useState<SignageDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDisplayId, setActiveDisplayId] = useState<string>('LED-01');
  const [formState, setFormState] = useState<Partial<SignageDisplay>>({
    header_text: '',
    marquee_message: '',
    theme_color: 'orange'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  const activeDisplay = displays.find(d => d.display_id === activeDisplayId) || displays[0] || MOCK_SIGNAGE[0];

  const fetchSignage = async () => {
    setIsLoading(true);
    try {
      const { data: signsData, error: signsErr } = await supabase.from('signage_displays').select('*').order('display_id');
      const { data: slotsData, error: slotsErr } = await supabase.from('parking_slots').select('*');

      if (signsErr || !signsData || signsData.length === 0) {
        setDisplays(MOCK_SIGNAGE);
      } else {
        const hydratedSigns = signsData.map(sign => {
          let total_spaces = 0;
          let available_spaces = 0;
          let status = sign.status;

          if (sign.linked_zone && slotsData && !slotsErr) {
            const zoneSlots = slotsData.filter(slot => slot.zone === sign.linked_zone);
            if (zoneSlots.length > 0) {
              total_spaces = zoneSlots.length;
              available_spaces = zoneSlots.filter(s => !s.is_occupied).length;

              // Smart real-time status update based on slots
              if (available_spaces === 0) status = 'FULL';
              else if (available_spaces <= total_spaces * 0.15) status = 'NEARLY FULL';
              else status = 'OPEN';
            }
          } else {
            // Fallback for screens with no linked physical zone (Main Gate)
            total_spaces = MOCK_SIGNAGE.find(m => m.display_id === sign.display_id)?.total_spaces || 100;
            available_spaces = MOCK_SIGNAGE.find(m => m.display_id === sign.display_id)?.available_spaces || 100;
          }

          return {
            ...sign,
            total_spaces,
            available_spaces,
            status: sign.is_emergency ? 'CLOSED' : status
          };
        });
        setDisplays(hydratedSigns as SignageDisplay[]);
      }
    } catch {
      setDisplays(MOCK_SIGNAGE);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSignage();
    // Simulate auto-refresh mechanism locally (every 5 seconds)
    const interval = setInterval(fetchSignage, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync form state when active display changes
  useEffect(() => {
    setFormState({
      header_text: activeDisplay?.header_text || '',
      marquee_message: activeDisplay?.marquee_message || '',
      theme_color: activeDisplay?.theme_color || 'orange',
    });
  }, [activeDisplay?.id]);

  const handlePushUpdate = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('signage_displays')
        .update({
          header_text: formState.header_text,
          marquee_message: formState.marquee_message,
          theme_color: formState.theme_color,
          updated_at: new Date().toISOString(),
          is_emergency: false
        })
        .eq('id', activeDisplay.id);

      if (error) throw error;
      fetchSignage();
      alert('Signage Content Updated Live!');
    } catch (e) {
      console.warn('DB update failed, using mock state: ', e);
      // Mock local update simulation
      setDisplays(prev => prev.map(d => d.id === activeDisplay.id ? { ...d, ...formState, is_emergency: false } as SignageDisplay : d));
    } finally {
      setIsSaving(false);
    }
  };

  const fireEmergencyOverride = async () => {
    const isConfirmed = window.confirm("Are you sure you want to trigger EMERGENCY OVERRIDE on all displays?");
    if (!isConfirmed) return;

    const emergencyMsg = "🚨 EMERGENCY EVACUATION 🚨 PROCEED IMMEDIATELY TO NEAREST EXIT ROUTES 🚨 DO NOT USE ELEVATORS 🚨";

    try {
      await supabase.from('signage_displays').update({
        header_text: 'EMERGENCY EVACUATION',
        marquee_message: emergencyMsg,
        theme_color: 'rose',
        status: 'CLOSED',
        is_emergency: true,
        updated_at: new Date().toISOString()
      }).neq('id', '0'); // update all
      fetchSignage();
    } catch {
      setDisplays(prev => prev.map(d => ({
        ...d,
        header_text: 'EMERGENCY EVACUATION',
        marquee_message: emergencyMsg,
        theme_color: 'rose',
        status: 'CLOSED',
        is_emergency: true
      })));
    }
  };

  const handleDeleteDisplay = async (id: string, display_id: string) => {
    if (!window.confirm(`Are you sure you want to decommission and delete ${display_id}? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase.from('signage_displays').delete().eq('id', id);
      if (error) throw error;

      recordAuditLog({
        action: 'DELETE_SIGNAGE',
        entityType: 'SIGNAGE',
        entityId: display_id,
        severity: 'MEDIUM',
        metadata: { display_id }
      });

      fetchSignage();
    } catch (e) {
      console.error('Failed to delete display:', e);
      alert('Delete failed. Check console for details.');
    }
  };

  const getThemeTextClass = (color: string) => {
    if (color === 'orange') return 'text-orange-500';
    if (color === 'emerald') return 'text-emerald-500';
    if (color === 'rose') return 'text-rose-500';
    if (color === 'amber') return 'text-amber-500';
    if (color === 'blue') return 'text-blue-500';
    return 'text-orange-500';
  };

  const getThemeHex = (color: string) => {
    if (color === 'emerald') return '#10b981';
    if (color === 'rose') return '#e11d48';
    if (color === 'amber') return '#f59e0b';
    if (color === 'blue') return '#3b82f6';
    return '#f97316'; // orange default
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Signage Control</h2>
          <p className="text-slate-500 mt-1 font-medium">Manage LED displays and real-time guidance signage across the campus.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm">
            Broadcast Message
          </button>
          <button onClick={() => fetchSignage()} className="px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2">
            Update All Displays
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-50/50 z-[10] flex items-center justify-center backdrop-blur-sm rounded-2xl">
            <span className="w-8 h-8 rounded-full border-4 border-[#ea580c] border-t-transparent animate-spin"></span>
          </div>
        )}

        {/* Left Side: LED Preview Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                {activeDisplay?.location} Display ({activeDisplay?.display_id})
              </h3>
              <button onClick={() => setIsFullscreenPreview(true)} className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md text-[10px] font-bold tracking-widest uppercase hover:bg-emerald-100 transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">fullscreen</span> Live Preview
              </button>
            </div>

            {/* LED Screen Physical Simulation */}
            <div className="w-full bg-[#0a0f18] rounded-xl border-[12px] border-[#151b2b] shadow-2xl overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
              {/* Grille overlay pattern for LED look */}
              <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>

              {activeDisplay?.is_emergency && (
                <div className="absolute inset-0 bg-rose-600/20 animate-pulse pointer-events-none z-10"></div>
              )}

              <div className="relative z-[5] w-full h-full flex flex-col items-center justify-between py-12 px-8 font-mono tracking-tighter">
                {/* Header Row */}
                <h1 className={`text-4xl md:text-5xl lg:text-6xl px-4 font-black text-center w-full uppercase leading-[1.1] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] ${getThemeTextClass(formState.theme_color || 'orange')} break-words`} style={{ textShadow: `0 0 20px ${getThemeHex(formState.theme_color || 'orange')}80` }}>
                  {formState.header_text || 'WELCOME'}
                </h1>

                {/* Spaces & Status Row */}
                <div className="flex w-full justify-around items-end mt-4">
                  <div className="flex flex-col items-center">
                    <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest mb-2">Available Spaces</p>
                    <p className={`text-6xl md:text-8xl font-black leading-none drop-shadow-2xl flex items-baseline gap-2 ${activeDisplay?.available_spaces > 0 && !activeDisplay?.is_emergency ? 'text-[#10b981]' : 'text-rose-600'}`} style={{ textShadow: `0 0 30px ${activeDisplay?.available_spaces > 0 && !activeDisplay?.is_emergency ? '#10b981' : '#e11d48'}aa` }}>
                      <span>{activeDisplay?.is_emergency ? '00' : String(activeDisplay?.available_spaces).padStart(3, '0')}</span>
                      <span className="text-3xl text-slate-500 font-bold opacity-80">/ {activeDisplay?.total_spaces}</span>
                    </p>
                  </div>
                  <div className="w-px h-32 bg-slate-800/50"></div>
                  <div className="flex flex-col items-center">
                    <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest mb-2">Status</p>
                    <p className={`text-6xl md:text-8xl font-black leading-none drop-shadow-2xl ${activeDisplay?.status === 'OPEN' && !activeDisplay.is_emergency ? 'text-[#ea580c]' : 'text-rose-600'}`} style={{ textShadow: `0 0 30px ${activeDisplay?.status === 'OPEN' && !activeDisplay.is_emergency ? '#ea580c' : '#e11d48'}aa` }}>
                      {activeDisplay?.is_emergency ? 'EVAC' : activeDisplay?.status}
                    </p>
                  </div>
                </div>

                {/* Marquee Foot (Scrolling LED text) */}
                <div className="w-full mt-auto mb-2 overflow-hidden whitespace-nowrap border-t border-slate-800/50 pt-4">
                  <p className={`text-sm md:text-xl font-bold uppercase tracking-[0.2em] inline-block animate-marquee ${getThemeTextClass(formState.theme_color || 'orange')}`}>
                    {formState.marquee_message} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {formState.marquee_message}
                  </p>
                </div>
              </div>
            </div>

            {/* Hardware settings slider (decorative) */}
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Brightness</label>
                <input type="range" className="w-full mt-2 accent-[#ea580c]" defaultValue="80" />
              </div>
              <div>
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1">Refresh Rate</label>
                <select className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-bold w-full rounded outline-none">
                  <option>Real-time (1s)</option>
                  <option>Delayed (3s)</option>
                  <option>Battery Saver (60s)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-1">Power Mode</label>
                <div className="flex bg-slate-100 rounded p-1">
                  <button className="flex-1 py-1 text-xs font-bold bg-[#ea580c] text-white rounded shadow-sm">AUTO</button>
                  <button className="flex-1 py-1 text-xs font-bold text-slate-500 hover:text-slate-800">ECO</button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Nodes Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto">
            <h3 className="font-bold text-lg text-slate-900 mb-6">Active Signage Nodes</h3>
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Display ID</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status / Spaces</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displays.map(row => (
                  <tr key={row.id} className={`hover:bg-slate-50/50 transition-colors ${activeDisplayId === row.display_id ? 'bg-orange-50/30 font-semibold' : ''}`} onClick={() => setActiveDisplayId(row.display_id)}>
                    <td className="px-4 py-4 text-sm font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span> {row.display_id}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{row.location}</td>
                    <td className="px-4 py-4 text-xs font-bold">
                      <span className={`px-2 py-1 rounded border uppercase ${row.status === 'FULL' || row.status === 'CLOSED' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                        {row.status} ({row.available_spaces}/{row.total_spaces})
                      </span>
                      {row.is_emergency && <span className="ml-2 text-[10px] text-rose-600 animate-pulse font-black">EMERGENCY</span>}
                    </td>
                    <td className="px-4 py-4 text-right flex justify-end gap-2">
                      <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-colors">Edit Content</button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDisplay(row.id, row.display_id);
                        }}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition-colors"
                        title="Delete Display"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Quick Content Editor */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 block">
            <h3 className="font-bold text-lg text-slate-900 mb-6">Quick Content Editor</h3>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">Header Text</label>
                <input
                  value={formState.header_text || ''}
                  onChange={e => setFormState({ ...formState, header_text: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-[#ea580c] transition-colors uppercase"
                />
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase flex justify-between items-center">
                  <span>Marquee Message</span>
                  <button
                    onClick={() => {
                      const bestAlternative = displays.filter(d => d.id !== activeDisplay.id && d.available_spaces > 20).sort((a, b) => b.available_spaces - a.available_spaces)[0];
                      if (bestAlternative) {
                        setFormState({ ...formState, marquee_message: `PROCEED TO ${bestAlternative.location} - ${bestAlternative.available_spaces} SPACES OPEN` });
                      } else {
                        setFormState({ ...formState, marquee_message: `ALL ZONES NEARLY FULL - EXPECT DELAYS` });
                      }
                    }}
                    className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] hover:bg-[#ea580c] hover:text-white transition-colors border border-slate-200"
                  >
                    Auto Suggest Route
                  </button>
                </label>
                <textarea
                  value={formState.marquee_message || ''}
                  onChange={e => setFormState({ ...formState, marquee_message: e.target.value.toUpperCase() })}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#ea580c] transition-colors uppercase font-mono resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block">Theme Color</label>
                <div className="flex gap-3">
                  <button onClick={() => setFormState({ ...formState, theme_color: 'orange' })} className={`w-8 h-8 rounded-full bg-[#ea580c] border-2 transition-all ${formState.theme_color === 'orange' ? 'border-[#ea580c] ring-2 ring-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}></button>
                  <button onClick={() => setFormState({ ...formState, theme_color: 'emerald' })} className={`w-8 h-8 rounded-full bg-[#10b981] border-2 transition-all ${formState.theme_color === 'emerald' ? 'border-[#10b981] ring-2 ring-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}></button>
                  <button onClick={() => setFormState({ ...formState, theme_color: 'amber' })} className={`w-8 h-8 rounded-full bg-[#f59e0b] border-2 transition-all ${formState.theme_color === 'amber' ? 'border-[#f59e0b] ring-2 ring-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}></button>
                  <button onClick={() => setFormState({ ...formState, theme_color: 'rose' })} className={`w-8 h-8 rounded-full bg-[#e11d48] border-2 transition-all ${formState.theme_color === 'rose' ? 'border-[#e11d48] ring-2 ring-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}></button>
                  <button onClick={() => setFormState({ ...formState, theme_color: 'blue' })} className={`w-8 h-8 rounded-full bg-[#3b82f6] border-2 transition-all ${formState.theme_color === 'blue' ? 'border-[#3b82f6] ring-2 ring-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}></button>
                </div>
              </div>

              <div className="pt-6 mt-2 border-t border-slate-100">
                <button
                  onClick={handlePushUpdate}
                  disabled={isSaving}
                  className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-xl shadow-lg shadow-orange-600/30 text-sm font-black transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span> : 'Push to Display'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-rose-50 rounded-2xl border border-rose-100 shadow-sm p-6 block">
            <h3 className="font-bold text-base text-rose-800 mb-2">Emergency Override</h3>
            <p className="text-xs text-rose-600/80 mb-6 leading-relaxed">
              In case of emergency, use the global override to display evacuation routes on all campus signage instantly.
            </p>
            <button onClick={fireEmergencyOverride} className="w-full py-3 bg-[#e11d48] hover:bg-[#be123c] text-white rounded-xl shadow-lg shadow-rose-600/30 text-sm font-black tracking-wide transition-colors">
              ACTIVATE EMERGENCY MODE
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN PREVIEW MODAL */}
      <AnimatePresence>
        {isFullscreenPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-none"
            onClick={() => setIsFullscreenPreview(false)}
          >
            {/* Simulated physical screen overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 2px, transparent 2px)', backgroundSize: '6px 6px' }}></div>

            {activeDisplay?.is_emergency && (
              <div className="absolute inset-0 bg-rose-600/10 animate-pulse pointer-events-none z-10"></div>
            )}

            <div className="relative z-10 w-full h-[90vh] flex flex-col items-center justify-between py-24 px-12 font-mono tracking-tighter">
              <h1 className={`text-6xl md:text-7xl xl:text-8xl px-10 font-black text-center w-full uppercase leading-[1.1] drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] ${getThemeTextClass(formState.theme_color || 'orange')} break-words`} style={{ textShadow: `0 0 40px ${getThemeHex(formState.theme_color || 'orange')}90` }}>
                {formState.header_text || 'WELCOME TO HCMUT'}
              </h1>

              <div className="flex w-[80%] justify-around items-end mt-12">
                <div className="flex flex-col items-center flex-1">
                  <p className="text-xl md:text-2xl text-slate-400 font-bold uppercase tracking-[0.3em] mb-4">Available Spaces</p>
                  <p className={`text-[6rem] md:text-[8rem] xl:text-[10rem] font-black leading-none drop-shadow-2xl flex items-baseline gap-4 whitespace-nowrap ${activeDisplay?.available_spaces > 0 && !activeDisplay?.is_emergency ? 'text-[#10b981]' : 'text-rose-600'}`} style={{ textShadow: `0 0 50px ${activeDisplay?.available_spaces > 0 && !activeDisplay?.is_emergency ? '#10b981' : '#e11d48'}cc` }}>
                    <span>{activeDisplay?.is_emergency ? '00' : String(activeDisplay?.available_spaces).padStart(3, '0')}</span>
                    <span className="text-[3rem] md:text-[4rem] xl:text-[5rem] text-slate-500 font-bold opacity-80">/&nbsp;{activeDisplay?.total_spaces}</span>
                  </p>
                </div>
                <div className="flex flex-col items-center flex-1 text-center">
                  <p className="text-xl md:text-2xl text-slate-400 font-bold uppercase tracking-[0.3em] mb-4">Status</p>
                  <p className={`text-[6rem] md:text-[8rem] xl:text-[10rem] font-black leading-none drop-shadow-2xl whitespace-nowrap ${activeDisplay?.status === 'OPEN' && !activeDisplay?.is_emergency ? 'text-[#ea580c]' : 'text-rose-600'}`} style={{ textShadow: `0 0 50px ${activeDisplay?.status === 'OPEN' && !activeDisplay?.is_emergency ? '#ea580c' : '#e11d48'}cc` }}>
                    {activeDisplay?.is_emergency ? 'EVAC' : activeDisplay?.status}
                  </p>
                </div>
              </div>

              {/* Infinite Marquee in fullscreen */}
              <div className="w-[120vw] absolute bottom-12 overflow-hidden whitespace-nowrap pt-8 border-t border-slate-800">
                <p className={`text-4xl md:text-5xl font-bold uppercase tracking-[0.3em] inline-block animate-marquee-fast ${getThemeTextClass(formState.theme_color || 'orange')} whitespace-nowrap`}>
                  {formState.marquee_message} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {formState.marquee_message} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {formState.marquee_message}
                </p>
              </div>
            </div>

            <p className="fixed bottom-4 left-4 text-xs font-mono text-slate-500 z-50 mix-blend-difference">Press Anywhere to Exit Preview</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
