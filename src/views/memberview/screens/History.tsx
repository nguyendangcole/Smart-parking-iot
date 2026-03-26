import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function History() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const sessions = [
    { date: 'Oct 24, 2023', time: '08:30 AM - 11:45 AM', vehicle: '51A-123.45', zone: 'Zone B1 - CS1', duration: '3h 15m', cost: '15,000 VND', status: 'Completed' },
    { date: 'Oct 24, 2023', time: '12:15 PM - Now', vehicle: '51B-987.65', zone: 'Zone A2 - CS2', duration: '1h 20m', cost: 'Pending', status: 'Ongoing' },
    { date: 'Oct 23, 2023', time: '02:00 PM - 02:05 PM', vehicle: '51A-123.45', zone: 'Zone C3 - CS1', duration: '5m', cost: '0 VND', status: 'Cancelled' },
    { date: 'Oct 22, 2023', time: '07:45 AM - 05:30 PM', vehicle: '51A-123.45', zone: 'Zone B1 - CS1', duration: '9h 45m', cost: '35,000 VND', status: 'Completed' },
    { date: 'Oct 21, 2023', time: '09:00 AM - 11:00 AM', vehicle: '51F-567.89', zone: 'Zone A1 - CS1', duration: '2h 0m', cost: '10,000 VND', status: 'Completed' },
    { date: 'Oct 20, 2023', time: '01:30 PM - 06:15 PM', vehicle: '51A-123.45', zone: 'Zone D4 - CS3', duration: '4h 45m', cost: '25,000 VND', status: 'Completed' },
    { date: 'Oct 19, 2023', time: '08:15 AM - 08:30 AM', vehicle: '51B-987.65', zone: 'Zone A2 - CS2', duration: '15m', cost: '0 VND', status: 'Cancelled' },
    { date: 'Oct 18, 2023', time: '10:00 AM - 02:00 PM', vehicle: '51C-111.22', zone: 'Zone B2 - CS1', duration: '4h 0m', cost: '20,000 VND', status: 'Completed' },
    { date: 'Oct 15, 2023', time: '07:00 AM - 11:30 AM', vehicle: '51A-123.45', zone: 'Zone B1 - CS1', duration: '4h 30m', cost: '25,000 VND', status: 'Completed' },
    { date: 'Oct 10, 2023', time: '03:00 PM - 07:45 PM', vehicle: '51F-567.89', zone: 'Zone C1 - CS2', duration: '4h 45m', cost: '25,000 VND', status: 'Completed' },
  ];

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.zone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || session.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / itemsPerPage));
  const currentSessions = filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-6xl mx-auto flex flex-col gap-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Parking History</h1>
          <p className="text-slate-500">Review your past parking sessions and manage receipts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
            <input 
              className="w-full pl-11 pr-4 py-2.5 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary text-sm shadow-sm" 
              placeholder="Search by plate or zone" 
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl text-sm font-medium border-none shadow-sm hover:bg-slate-50">
            <Calendar size={18} />
            <span>{new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl text-sm font-medium border-none shadow-sm hover:bg-slate-50">
              <Filter size={18} />
              <span>{filterStatus === 'All' ? 'Filters' : filterStatus}</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <div className="py-2">
                {['All', 'Completed', 'Ongoing', 'Cancelled'].map((status) => (
                  <button 
                    key={status}
                    onClick={() => {
                      setFilterStatus(status);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${filterStatus === status ? 'font-bold text-primary bg-primary/5' : 'text-slate-700'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vehicle</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Zone</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Duration</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Cost</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentSessions.map((session, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold">{session.date}</p>
                    <p className="text-xs text-slate-400">{session.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold bg-slate-100 px-2 py-1 rounded-lg">{session.vehicle}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{session.zone}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">{session.duration}</td>
                  <td className={`px-6 py-4 text-sm font-bold ${session.cost === 'Pending' ? 'text-primary' : ''}`}>{session.cost}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      session.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      session.status === 'Ongoing' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`size-1.5 rounded-full ${
                        session.status === 'Completed' ? 'bg-green-500' :
                        session.status === 'Ongoing' ? 'bg-blue-500' :
                        'bg-slate-400'
                      }`}></span>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      disabled={session.status !== 'Completed'}
                      className={`text-xs font-bold flex items-center gap-1 ${session.status === 'Completed' ? 'text-primary hover:underline' : 'text-slate-300 cursor-not-allowed'}`}
                    >
                      <Download size={14} />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-500 font-medium">
              Showing {filteredSessions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSessions.length)} of {filteredSessions.length} entries
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-primary focus:border-primary block px-2 py-1 outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`size-9 rounded-lg border border-slate-200 flex items-center justify-center transition-colors ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button 
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`size-9 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${page === currentPage ? 'bg-primary text-white' : 'border border-slate-200 hover:bg-slate-50'}`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`size-9 rounded-lg border border-slate-200 flex items-center justify-center transition-colors ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl">
          <p className="text-primary text-xs font-bold uppercase tracking-wider mb-1">Total Spent this Month</p>
          <h3 className="text-2xl font-extrabold text-primary">245,000 VND</h3>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-2xl">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Hours Parked</p>
          <h3 className="text-2xl font-extrabold">42h 15m</h3>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-2xl">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Most Visited Zone</p>
          <h3 className="text-2xl font-extrabold">Zone B1</h3>
        </div>
      </div>
    </motion.div>
  );
}
