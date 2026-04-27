import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  CheckCircle, 
  CreditCard,
  AlertTriangle,
  Zap,
  Clock,
  MapPin,
  DollarSign,
  User,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../../shared/supabase';

interface Operation {
  id: string;
  type: 'lost_card' | 'manual_exit' | 'override_gate';
  plate: string;
  vehicle_type: 'motorbike' | 'car';
  fee?: number;
  timestamp: string;
  operator: string;
  reason: string;
  zone?: string;
  duration?: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function OperationsLog() {
  const [operations, setOperations] = useState<Operation[]>([
    {
      id: '1',
      type: 'manual_exit',
      plate: 'AAA-0001',
      vehicle_type: 'car',
      fee: 10000,
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      operator: 'Nguyễn Văn A',
      reason: 'Card reader timeout',
      zone: 'B',
      duration: '47 min',
      status: 'completed'
    },
    {
      id: '2',
      type: 'lost_card',
      plate: 'BBB-0002',
      vehicle_type: 'motorbike',
      fee: 5000,
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      operator: 'Trần Thị B',
      reason: 'Lost RFID card',
      zone: 'A',
      duration: '12 min',
      status: 'completed'
    },
    {
      id: '3',
      type: 'override_gate',
      plate: 'N/A',
      vehicle_type: 'car',
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      operator: 'Lê Văn C',
      reason: 'Sensor malfunction',
      zone: 'Entry Gate 1',
      duration: '2 min 45 sec',
      status: 'completed'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'lost_card' | 'manual_exit' | 'override_gate'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Subscribe to real-time operations (placeholder for future Supabase integration)
  useEffect(() => {
    // TODO: Connect to Supabase real-time
    // const channel = supabase
    //   .channel('manual-operations')
    //   .on(
    //     'postgres_changes',
    //     { event: 'INSERT', schema: 'public', table: 'manual_operations' },
    //     (payload) => {
    //       setOperations(prev => [payload.new, ...prev].slice(0, 50))
    //     }
    //   )
    //   .subscribe()
    // 
    // return () => supabase.removeChannel(channel)
  }, []);

  const filteredOperations = operations.filter(op => {
    const matchesSearch = 
      op.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || op.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    if (type === 'manual_exit') return <CheckCircle size={16} className="text-emerald-600" />;
    if (type === 'lost_card') return <CreditCard size={16} className="text-red-600" />;
    if (type === 'override_gate') return <AlertTriangle size={16} className="text-amber-600" />;
  };

  const getTypeLabel = (type: string) => {
    if (type === 'manual_exit') return 'Manual Exit';
    if (type === 'lost_card') return 'Lost Card';
    if (type === 'override_gate') return 'Gate Override';
  };

  const getTypeColor = (type: string) => {
    if (type === 'manual_exit') return 'emerald';
    if (type === 'lost_card') return 'red';
    if (type === 'override_gate') return 'amber';
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Real-Time Operations Log
          </h3>
          <p className="text-sm text-slate-500 mt-1">All manual interventions logged for audit trail</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
          {filteredOperations.length} operations
        </span>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by plate, operator, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium"
        >
          <option value="all">All Types</option>
          <option value="manual_exit">Manual Exit</option>
          <option value="lost_card">Lost Card</option>
          <option value="override_gate">Gate Override</option>
        </select>
      </div>

      {/* Operations List */}
      <div className="space-y-3">
        {filteredOperations.length > 0 ? (
          filteredOperations.map((op) => {
            const typeColor = getTypeColor(op.type);
            const isExpanded = expandedId === op.id;
            
            return (
              <div
                key={op.id}
                className={`border rounded-lg overflow-hidden transition-all ${
                  typeColor === 'emerald' ? 'border-emerald-200 bg-emerald-50' :
                  typeColor === 'red' ? 'border-red-200 bg-red-50' :
                  'border-amber-200 bg-amber-50'
                }`}
              >
                {/* Main Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : op.id)}
                  className="w-full p-4 flex items-start gap-4 hover:opacity-75 transition-opacity text-left"
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-lg ${
                    typeColor === 'emerald' ? 'bg-emerald-100' :
                    typeColor === 'red' ? 'bg-red-100' :
                    'bg-amber-100'
                  }`}>
                    {getTypeIcon(op.type)}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-bold text-sm ${
                        typeColor === 'emerald' ? 'text-emerald-900' :
                        typeColor === 'red' ? 'text-red-900' :
                        'text-amber-900'
                      }`}>
                        {getTypeLabel(op.type)}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                        typeColor === 'emerald' ? 'bg-emerald-200 text-emerald-800' :
                        typeColor === 'red' ? 'bg-red-200 text-red-800' :
                        'bg-amber-200 text-amber-800'
                      }`}>
                        {op.plate}
                      </span>
                    </div>
                    <p className={`text-xs ${
                      typeColor === 'emerald' ? 'text-emerald-700' :
                      typeColor === 'red' ? 'text-red-700' :
                      'text-amber-700'
                    }`}>
                      {op.reason}
                    </p>
                  </div>

                  {/* Right Info */}
                  <div className="flex-shrink-0 text-right">
                    <p className={`text-sm font-bold ${
                      typeColor === 'emerald' ? 'text-emerald-900' :
                      typeColor === 'red' ? 'text-red-900' :
                      'text-amber-900'
                    }`}>
                      {formatTime(op.timestamp)}
                    </p>
                    <p className={`text-xs ${
                      typeColor === 'emerald' ? 'text-emerald-700' :
                      typeColor === 'red' ? 'text-red-700' :
                      'text-amber-700'
                    }`}>
                      {op.duration}
                    </p>
                    <ChevronDown
                      size={16}
                      className={`mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className={`border-t ${
                    typeColor === 'emerald' ? 'border-emerald-200' :
                    typeColor === 'red' ? 'border-red-200' :
                    'border-amber-200'
                  } px-4 py-3 bg-white/50`}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {/* Operator */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Operator</p>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <p className="font-medium text-slate-800">{op.operator}</p>
                        </div>
                      </div>

                      {/* Zone/Location */}
                      {op.zone && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</p>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400" />
                            <p className="font-medium text-slate-800">{op.zone}</p>
                          </div>
                        </div>
                      )}

                      {/* Fee */}
                      {op.fee && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fee</p>
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-slate-400" />
                            <p className="font-bold text-slate-800">{op.fee.toLocaleString()} VND</p>
                          </div>
                        </div>
                      )}

                      {/* Vehicle Type */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vehicle</p>
                        <p className="font-medium text-slate-800">
                          {op.vehicle_type === 'car' ? 'Car' : 'Motorbike/E-bike'}
                        </p>
                      </div>

                      {/* Status */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                          op.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          op.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {op.status.charAt(0).toUpperCase() + op.status.slice(1)}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Time</p>
                        <p className="font-medium text-slate-800">
                          {new Date(op.timestamp).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400 bg-white rounded-lg border border-slate-200">
            <Clock size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No operations found</p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {filteredOperations.length > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {filteredOperations.filter(op => op.type === 'manual_exit').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Manual Exits</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {filteredOperations.filter(op => op.type === 'lost_card').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Lost Cards</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {filteredOperations.filter(op => op.type === 'override_gate').length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Gate Overrides</p>
          </div>
        </div>
      )}
    </div>
  );
}
