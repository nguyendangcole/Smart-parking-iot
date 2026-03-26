import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Calendar,
  TrendingUp,
  Wallet,
  Timer,
  Star,
  PlusCircle,
  Search,
  History,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useProfile } from '../../../shared/hooks/useProfile';
import { supabase } from '../../../shared/supabase';
import { Screen } from '../types';

interface DashboardProps {
  onNavigate?: (screen: Screen) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { profile, refreshProfile } = useProfile();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Data states
  const [activeSession, setActiveSession] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [rewards, setRewards] = useState({ total: 0, toNextTier: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activityPeriod, setActivityPeriod] = useState('7');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Session Ending Soon', message: 'Your parking session at B2 Building will end in 15 minutes.', time: '10 mins ago', unread: true },
    { id: 2, title: 'Payment Successful', message: 'Successfully topped up 50,000 VND to your wallet.', time: '2 hours ago', unread: false },
    { id: 3, title: 'New Reward Tier', message: 'Congratulations! You are only 260 points away from Gold tier.', time: '1 day ago', unread: false },
  ]);

  const notificationRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Simulate API fetch for dashboard data
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Replace with actual API calls
        setActiveSession({
          duration: '01:45:22',
          location: 'B2 Building - Slot #42',
          status: 'In Progress'
        });
        
        setRewards({ total: 1240, toNextTier: 260 });
        
        if (activityPeriod === '7') {
          setChartData([
            { day: 'Mon', height: '60%' },
            { day: 'Tue', height: '80%' },
            { day: 'Wed', height: '50%' },
            { day: 'Thu', height: '100%', active: true },
            { day: 'Fri', height: '75%' },
            { day: 'Sat', height: '30%' },
            { day: 'Sun', height: '40%' },
          ]);
        } else {
          // Generate 30 days dummy data
          const days = [];
          for (let i = 1; i <= 30; i++) {
            days.push({
              day: i % 5 === 0 ? i.toString() : '', // Show label every 5 days to avoid crowding
              height: `${Math.floor(Math.random() * 70) + 30}%`,
              active: i === 30, // Last day active
            });
          }
          setChartData(days);
        }

        setRecentSessions([
          { loc: 'A1 Building', time: 'Oct 23, 2023 • 08:30 AM', dur: '04h 12m', cost: '15,000 VND', status: 'Completed', color: 'indigo' },
          { loc: 'Central Library', time: 'Oct 22, 2023 • 01:15 PM', dur: '02h 45m', cost: '10,000 VND', status: 'Completed', color: 'violet' },
          { loc: 'H6 Building', time: 'Oct 21, 2023 • 09:00 AM', dur: '08h 00m', cost: '30,000 VND', status: 'Completed', color: 'blue' },
        ]);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedDate, activityPeriod]);

  const daysInMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1).getDay();

  const handleTopUp = async () => {
    if (!profile?.id) {
      alert("Please wait for your profile to load.");
      return;
    }

    const amountStr = prompt("Enter amount to top-up (VND):", "50000");
    if (!amountStr) return;
    
    const amount = parseInt(amountStr.replace(/,/g, ''), 10);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount entered. Please enter a valid number.");
      return;
    }

    // Since profile.balance is an any type if it isn't defined in the typing, we access it as record
    const currentBalance = (profile as any).balance || 0;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ balance: currentBalance + amount })
        .eq('id', profile.id);

      if (error) throw error;
      
      alert(`Top-up successful! Added ${amount.toLocaleString()} VND.`);
      if (refreshProfile) refreshProfile();
    } catch (err: any) {
      alert("Failed to top up: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day));
    setShowCalendar(false);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentViewDate(today);
    setShowCalendar(false);
  };

  const displayDate = selectedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Topbar */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Good morning, {profile?.full_name?.split(' ')[0] || 'Member'}! 👋
          </h2>
          <p className="text-slate-500 font-medium">Here's what's happening with your parking today.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="size-12 rounded-2xl glass flex items-center justify-center text-slate-600 hover:bg-white hover:text-primary transition-all border border-slate-200 relative"
            >
              <Bell size={20} />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-3 right-3 size-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 z-50 w-80">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                  <button 
                    onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded-xl border transition-colors ${notification.unread ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-100'}`}
                      onClick={() => setNotifications(notifications.map(n => n.id === notification.id ? { ...n, unread: false } : n))}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-bold ${notification.unread ? 'text-slate-900' : 'text-slate-700'}`}>{notification.title}</h4>
                        <span className="text-[10px] whitespace-nowrap text-slate-400 font-medium">{notification.time}</span>
                      </div>
                      <p className="text-xs text-slate-500">{notification.message}</p>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-slate-500 text-sm">No notifications</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={calendarRef}>
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <Calendar size={18} className="text-primary" />
              <span className="text-sm font-bold text-slate-700">{displayDate}</span>
            </button>

            {showCalendar && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 z-50 w-72">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={handlePrevMonth} className="text-slate-400 hover:text-primary p-1">&lt;</button>
                  <span className="font-bold text-sm text-slate-700">
                    {currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={handleNextMonth} className="text-slate-400 hover:text-primary p-1">&gt;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
                  <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-slate-700">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-1"></div>
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isSelected = 
                      selectedDate.getDate() === day &&
                      selectedDate.getMonth() === currentViewDate.getMonth() &&
                      selectedDate.getFullYear() === currentViewDate.getFullYear();
                    const isToday = 
                      new Date().getDate() === day &&
                      new Date().getMonth() === currentViewDate.getMonth() &&
                      new Date().getFullYear() === currentViewDate.getFullYear();

                    return (
                      <div 
                        key={day} 
                        onClick={() => handleDateSelect(day)}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-primary text-white font-bold shadow-sm' 
                            : isToday
                            ? 'bg-primary/10 text-primary font-bold hover:bg-slate-100'
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-center">
                  <button 
                    onClick={handleToday} 
                    className="text-xs font-bold text-primary hover:underline transition-all"
                  >
                    Today
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white shadow-xl shadow-primary/20">
          <div className="relative z-10">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Current Balance</p>
            <h3 className="text-3xl font-black mb-4">{profile?.balance?.toLocaleString() || '0'} <span className="text-lg font-medium">VND</span></h3>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md w-fit px-3 py-1 rounded-full text-xs font-bold">
              <TrendingUp size={14} />
              <span>+15% from last month</span>
            </div>
          </div>
          <Wallet className="absolute -right-4 -bottom-4 text-white/10 size-32" />
        </div>

        {/* Active Session Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Active Session</p>
              <h3 className="text-3xl font-black text-slate-900">{activeSession ? activeSession.duration : '--:--:--'}</h3>
            </div>
            <div className={`size-10 rounded-xl ${activeSession ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'} flex items-center justify-center`}>
              <Timer size={24} className={activeSession ? "animate-pulse" : ""} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <span className="text-sm font-bold">{activeSession ? activeSession.location : 'No active session'}</span>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${activeSession ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
              {activeSession ? activeSession.status : 'Inactive'}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button 
              disabled={!activeSession}
              className={`flex-1 py-3 rounded-xl font-bold transition-colors ${activeSession ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}
              onClick={() => {
                alert("Session ended. Balance deducted.");
                setActiveSession(null);
                refreshProfile();
              }}
            >
              End Session Early
            </button>
          </div>
        </div>

        {/* Points Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Rewards</p>
              <h3 className="text-3xl font-black text-slate-900">{rewards.total.toLocaleString()} <span className="text-lg font-medium">pts</span></h3>
            </div>
            <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star size={24} />
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full w-3/4"></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-bold">{rewards.toNextTier} pts to Gold Tier</p>
        </div>
      </div>

      {/* Quick Actions & Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          <h4 className="text-lg font-bold text-slate-800">Quick Actions</h4>
          <button 
            onClick={handleTopUp}
            disabled={isLoading}
            className={`w-full flex items-center gap-4 p-4 rounded-xl glass hover:bg-primary hover:text-white transition-all group border-slate-200 shadow-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="size-12 rounded-xl bg-primary/10 group-hover:bg-white/20 flex items-center justify-center text-primary group-hover:text-white transition-colors">
              <PlusCircle size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold">Top-up Balance</p>
              <p className="text-xs opacity-70">Add funds instantly</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-4 p-4 rounded-xl glass hover:bg-indigo-600 hover:text-white transition-all group border-slate-200 shadow-sm">
            <div className="size-12 rounded-xl bg-indigo-600/10 group-hover:bg-white/20 flex items-center justify-center text-indigo-600 group-hover:text-white transition-colors">
              <Search size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold">Find Slot</p>
              <p className="text-xs opacity-70">Locate available spots</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-4 p-4 rounded-xl glass hover:bg-slate-800 hover:text-white transition-all group border-slate-200 shadow-sm">
            <div className="size-12 rounded-xl bg-slate-800/10 group-hover:bg-white/20 flex items-center justify-center text-slate-800 group-hover:text-white transition-colors">
              <History size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold">Extend Session</p>
              <p className="text-xs opacity-70">Add more time remotely</p>
            </div>
          </button>
        </div>

        {/* Usage Chart Placeholder */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-slate-800">Parking Activity</h4>
            <select 
              value={activityPeriod}
              onChange={(e) => setActivityPeriod(e.target.value)}
              className="text-xs font-bold bg-slate-100 border-none rounded-lg px-3 py-1 focus:ring-primary/20"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>
          <div className="h-56 w-full flex items-end justify-between gap-2">
            {chartData.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-slate-100 rounded-t-lg relative group h-full">
                  <div
                    style={{ height: item.height }}
                    className={`absolute bottom-0 w-full transition-all rounded-t-lg ${item.active ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-primary/40 group-hover:bg-primary'}`}
                  ></div>
                </div>
                <span className={`text-[10px] font-bold ${item.active ? 'text-slate-800' : 'text-slate-400'}`}>{item.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h4 className="text-lg font-bold text-slate-800">Recent Parking Sessions</h4>
          <button 
            onClick={() => onNavigate && onNavigate('history')}
            className="text-primary text-xs font-bold hover:underline"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-slate-400">
              <tr>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSessions.length > 0 ? recentSessions.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded-lg bg-${row.color}-50 text-${row.color}-600 flex items-center justify-center`}>
                        <Building2 size={16} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{row.loc}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{row.time}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-bold">{row.dur}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-black">{row.cost}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                      {row.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">No recent sessions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
