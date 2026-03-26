import React, { useState } from 'react';
import { X, Search, QrCode, Clock, DollarSign, LogOut, AlertCircle } from 'lucide-react';

interface TicketScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VisitorTicket {
  id: string;
  plate: string;
  ticketNumber: string;
  entryTime: string;
  vehicleType: 'motorcycle' | 'car';
  status: 'active' | 'unpaid' | 'grace_period';
  fee: number;
  duration: string;
}

export default function TicketScannerModal({ isOpen, onClose }: TicketScannerModalProps) {
  const [searchInput, setSearchInput] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<VisitorTicket | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Mock visitor tickets - replace with real API call
  const mockTickets: VisitorTicket[] = [
    {
      id: '1',
      plate: 'AAA-1111',
      ticketNumber: 'VISIT-001',
      entryTime: '08:30 AM',
      vehicleType: 'car',
      status: 'active',
      fee: 20000,
      duration: '2h 15m'
    },
    {
      id: '2',
      plate: 'BBB-2222',
      ticketNumber: 'VISIT-002',
      entryTime: '09:45 AM',
      vehicleType: 'motorcycle',
      status: 'active',
      fee: 5000,
      duration: '1h 30m'
    },
    {
      id: '3',
      plate: 'CCC-3333',
      ticketNumber: 'VISIT-003',
      entryTime: '10:00 AM',
      vehicleType: 'car',
      status: 'grace_period',
      fee: 20000,
      duration: '1h 15m'
    },
  ];

  const handleSearch = async () => {
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      const found = mockTickets.find(
        t => t.ticketNumber.toLowerCase().includes(searchInput.toLowerCase()) ||
             t.plate.toLowerCase().includes(searchInput.toLowerCase())
      );
      if (found) {
        setSelectedTicket(found);
      } else {
        alert('Ticket not found');
      }
      setIsSearching(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusColor = (status: VisitorTicket['status']) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100' };
      case 'unpaid':
        return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100' };
      case 'grace_period':
        return { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100' };
    }
  };

  const getStatusLabel = (status: VisitorTicket['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'unpaid':
        return 'Unpaid';
      case 'grace_period':
        return 'Grace Period';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrCode size={24} />
            <h2 className="text-xl font-bold">Ticket Scanner</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedTicket ? (
            <div className="space-y-6">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ticket ID or License Plate
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., VISIT-001 or AAA-1111"
                    className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchInput.trim()}
                    className="px-4 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Search size={16} /> {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-700 flex gap-3">
                <QrCode size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Quick Search</p>
                  <p className="text-xs mt-1">Scan QR code or enter ticket ID to find visitor vehicle info</p>
                </div>
              </div>

              {/* Recent Tickets */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Recent Visitor Tickets</p>
                <div className="space-y-2">
                  {mockTickets.map((ticket) => {
                    const colors = getStatusColor(ticket.status);
                    return (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{ticket.ticketNumber} • {ticket.plate}</p>
                          <p className="text-xs text-slate-500">{ticket.entryTime} • {ticket.duration}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${colors.badge} ${colors.text}`}>
                          {getStatusLabel(ticket.status)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ticket Details */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Ticket Information</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{selectedTicket.ticketNumber}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedTicket.status).badge} ${getStatusColor(selectedTicket.status).text}`}>
                    {getStatusLabel(selectedTicket.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">License Plate</p>
                    <p className="text-lg font-bold text-slate-800 mt-1 font-mono">{selectedTicket.plate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Vehicle Type</p>
                    <p className="text-lg font-bold text-slate-800 mt-1 capitalize">{selectedTicket.vehicleType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Entry Time</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{selectedTicket.entryTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Duration</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{selectedTicket.duration}</p>
                  </div>
                </div>
              </div>

              {/* Fees and Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-amber-600" size={20} />
                    <div>
                      <p className="text-xs text-amber-600 uppercase font-bold">Current Fee</p>
                      <p className="text-2xl font-bold text-amber-700">{selectedTicket.fee.toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                  </div>
                </div>

                {selectedTicket.status === 'grace_period' && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="text-blue-600 flex-shrink-0" size={18} />
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Grace period active:</span> Vehicle can exit without payment for limited time.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    alert(`💳 Payment initiated for ${selectedTicket.ticketNumber}\nAmount: ${selectedTicket.fee.toLocaleString('vi-VN')} VNĐ\nRedirecting to payment gateway...`);
                    setSelectedTicket(null);
                    setSearchInput('');
                  }}
                  className="px-4 py-2.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <DollarSign size={18} /> Collect Payment
                </button>
                <button
                  onClick={() => {
                    alert(`✅ Exit confirmed for ${selectedTicket.ticketNumber}\nGate will open in 3 seconds...\nSession marked as completed`);
                    setSelectedTicket(null);
                    setSearchInput('');
                  }}
                  className="px-4 py-2.5 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> Confirm Exit
                </button>
              </div>

              {/* Back Button */}
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setSearchInput('');
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Back to Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
