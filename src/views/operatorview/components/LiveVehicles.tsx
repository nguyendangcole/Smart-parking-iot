import React, { useState } from 'react';
import { Clock, Zap, AlertCircle, MoreVertical, Eye, LogOut, CreditCard, DollarSign, X } from 'lucide-react';

interface Vehicle {
  id: string;
  plate: string;
  entryTime: string;
  zone: string;
  duration: string;
  status: 'active' | 'alert';
  ticketId?: string;
  cardId?: string;
}

interface LiveVehiclesProps {
  searchQuery: string;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onManualEntry?: () => void;
  onManualExit?: () => void;
  onLostCard?: () => void;
}

export default function LiveVehicles({
  searchQuery,
  onSelectVehicle,
  onManualEntry,
  onManualExit,
  onLostCard
}: LiveVehiclesProps) {  // Track which vehicle menu is open
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedVehicleForAction, setSelectedVehicleForAction] = useState<Vehicle | null>(null);
  // Mock data - replace with real API data later
  const [vehicles] = useState<Vehicle[]>([
    {
      id: '1',
      plate: 'AAA-0001',
      entryTime: '08:15 AM',
      zone: 'A',
      duration: '2h 45m',
      status: 'active',
      ticketId: 'TK-001234',
      cardId: 'CARD-567'
    },
    {
      id: '2',
      plate: 'BBB-0002',
      entryTime: '09:30 AM',
      zone: 'B',
      duration: '1h 30m',
      status: 'alert',
      ticketId: 'TK-001235',
      cardId: 'CARD-568'
    },
    {
      id: '3',
      plate: 'CCC-0003',
      entryTime: '10:00 AM',
      zone: 'C',
      duration: '1h',
      status: 'active',
      ticketId: 'TK-001236',
      cardId: 'CARD-569'
    },
    {
      id: '4',
      plate: 'DDD-0004',
      entryTime: '10:45 AM',
      zone: 'A',
      duration: '15m',
      status: 'active',
      ticketId: 'TK-001237',
      cardId: 'CARD-570'
    },
  ]);

  // Filter vehicles based on search query
  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.ticketId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.cardId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Live Vehicles In Lot</h2>
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
            {filteredVehicles.length} Active
          </span>
        </div>
        <p className="text-sm text-slate-500">
          {searchQuery
            ? `Found ${filteredVehicles.length} vehicle(s) matching "${searchQuery}"`
            : 'All active parking sessions. Search by plate (AAA-0001), ticket (TK-001234), or card ID (CARD-567)'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex gap-2 flex-wrap">
        <button
          onClick={onManualEntry}
          className="px-4 py-2 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Manual Entry
        </button>
        <button
          onClick={onManualExit}
          className="px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors"
        >
          + Manual Exit
        </button>
        <button
          onClick={onLostCard}
          className="px-4 py-2 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors"
        >
          Lost Card Handler
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">License Plate</th>
              <th className="px-6 py-4">Entry Time</th>
              <th className="px-6 py-4">Zone</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Ticket ID</th>
              <th className="px-6 py-4">Card ID</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                  onClick={() => onSelectVehicle?.(vehicle)}
                >
                  <td className="px-6 py-4 font-bold text-slate-800">{vehicle.plate}</td>
                  <td className="px-6 py-4 text-slate-600">{vehicle.entryTime}</td>
                  <td className="px-6 py-4 text-slate-600">Zone {vehicle.zone}</td>
                  <td className="px-6 py-4 flex items-center gap-1.5 text-slate-600">
                    <Clock size={14} /> {vehicle.duration}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{vehicle.ticketId}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{vehicle.cardId}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        vehicle.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {vehicle.status === 'alert' && <AlertCircle size={12} />}
                      {vehicle.status === 'active' ? 'Active' : 'Alert'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id);
                        setSelectedVehicleForAction(vehicle);
                      }}
                      className="text-slate-400 hover:text-primary transition-colors p-1 hover:bg-slate-100 rounded"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === vehicle.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVehicle?.(vehicle);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700"
                        >
                          <Eye size={16} /> View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onManualExit?.();
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-orange-600"
                        >
                          <LogOut size={16} /> Manual Exit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLostCard?.();
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-red-600"
                        >
                          <CreditCard size={16} /> Lost Card Handler
                        </button>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Payment Status for ${vehicle.plate}:\nTicket: ${vehicle.ticketId}\nAmount: Pending`);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-600"
                        >
                          <DollarSign size={16} /> Check Payment
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  {searchQuery ? `No vehicles match "${searchQuery}"` : 'No active vehicles'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
