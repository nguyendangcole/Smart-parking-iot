import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface GatewayStatus {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync: string;
  pendingSync: number;
  uptime: number;
}

export default function GatewayStatusBanner() {
  const [gateways, setGateways] = useState<GatewayStatus[]>([
    {
      id: 'gw-1',
      name: 'Gateway A',
      status: 'connected',
      lastSync: '45s ago',
      pendingSync: 0,
      uptime: 99.8
    },
    {
      id: 'gw-2',
      name: 'Gateway B',
      status: 'connected',
      lastSync: '2m ago',
      pendingSync: 0,
      uptime: 99.9
    },
  ]);
  
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Simulate gateway status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGateways(prev =>
        prev.map(gw => ({
          ...gw,
          lastSync: Math.random() > 0.8 ? '1m ago' : '30s ago'
        }))
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRetrySync = async () => {
    setIsRetrying(true);
    // Simulate sync retry
    setTimeout(() => {
      setGateways(prev =>
        prev.map(gw => ({
          ...gw,
          status: 'connected',
          lastSync: 'just now',
          pendingSync: 0
        }))
      );
      setIsRetrying(false);
    }, 1500);
  };

  const allConnected = gateways.every(gw => gw.status === 'connected');
  const totalPending = gateways.reduce((sum, gw) => sum + gw.pendingSync, 0);

  return (
    <div className={`rounded-xl border px-4 py-3 transition-all ${
      allConnected
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-center justify-between">
        {/* Left: Status Info */}
        <div className="flex items-center gap-3 min-w-0">
          {allConnected ? (
            <div className="flex items-center gap-2">
              <Wifi className="text-emerald-600 flex-shrink-0" size={18} />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">System Status</p>
                <p className="text-sm font-bold text-emerald-900">All Gateways Connected</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <WifiOff className="text-amber-600 flex-shrink-0 animate-pulse" size={18} />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">System Alert</p>
                <p className="text-sm font-bold text-amber-900">Gateway Sync Delayed</p>
              </div>
            </div>
          )}
        </div>

        {/* Middle: Details */}
        <div className="hidden sm:flex items-center gap-4 text-xs ml-4">
          {totalPending > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 rounded-full">
              <Clock size={14} className="text-amber-700" />
              <span className="font-bold text-amber-700">{totalPending} pending</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-slate-600">
            <CheckCircle size={14} className="text-emerald-600" />
            <span className="font-medium">
              Last sync: {gateways[0]?.lastSync || 'N/A'}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
              allConnected
                ? 'text-emerald-700 hover:bg-emerald-100'
                : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
          <button
            onClick={handleRetrySync}
            disabled={isRetrying || allConnected}
            className={`px-3 py-1 text-xs font-semibold rounded flex items-center gap-1 transition-colors ${
              isRetrying || allConnected
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <RefreshCw size={12} className={isRetrying ? 'animate-spin' : ''} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>

      {/* Detailed Gateway Status */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gateway Details</p>
          <div className="space-y-2">
            {gateways.map(gw => (
              <div
                key={gw.id}
                className="flex items-center justify-between p-2 bg-white rounded border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {gw.status === 'connected' ? (
                    <Wifi className="text-emerald-600 flex-shrink-0" size={16} />
                  ) : (
                    <WifiOff className="text-red-600 flex-shrink-0 animate-pulse" size={16} />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{gw.name}</p>
                    <p className="text-slate-500">
                      Uptime: <span className="font-semibold">{gw.uptime}%</span>
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className={`inline-block px-2 py-1 rounded font-bold ${
                    gw.status === 'connected'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {gw.status === 'connected' ? 'Online' : 'Offline'}
                  </div>
                  <p className="text-slate-500 mt-1">
                    {gw.status === 'connected' ? `Synced ${gw.lastSync}` : 'Attempting reconnect'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 pt-2">
            💡 If gateway remains offline &gt; 5 minutes, system will enter fallback mode and queue updates for sync upon reconnection.
          </p>
        </div>
      )}
    </div>
  );
}
