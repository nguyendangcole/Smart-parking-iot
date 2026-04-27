import React from 'react';
import { AlertCircle, Zap } from 'lucide-react';

export type IncidentType = 'duplicate-entry' | 'unpaid-exit' | 'sensor-mismatch' | 'communication-loss' | 'override-used';

export interface Incident {
  id: string;
  type: IncidentType;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  resolved?: boolean;
}

interface IncidentAlertsProps {
  onRefresh?: () => void;
}

export default function IncidentAlerts({ onRefresh }: IncidentAlertsProps) {
  // Mock incidents - CONNECTED TO REAL DATA WHEN BACKEND READY
  // To connect real incidents, replace this with:
  // const [incidents, setIncidents] = useState<Incident[]>([]);
  // useEffect(() => {
  //   const { data } = await supabase.from('incidents').select('*').eq('resolved', false)
  //   setIncidents(data)
  // }, [])
  const [incidents] = React.useState<Incident[]>([
    {
      id: '1',
      type: 'duplicate-entry',
      title: 'Duplicate Entry Detected',
      description: 'Plate AAA-0001 at Gate Entry',
      severity: 'warning',
      timestamp: '2 min ago',
      resolved: false
    },
    {
      id: '2',
      type: 'unpaid-exit',
      title: 'Unpaid Exit Attempt',
      description: 'Plate BBB-0002 has pending balance',
      severity: 'critical',
      timestamp: '5 min ago',
      resolved: false
    },
  ]);

  const getSeverityStyles = (severity: Incident['severity']) => {
    switch (severity) {
      case 'critical':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600' };
      case 'warning':
        return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-600' };
      case 'info':
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' };
    }
  };

  return (
    <div>
      {/* Functional elements - Badge + Resolve Button (header handled by Dashboard) */}
      {incidents.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <p className="text-sm text-slate-500">Auto-detected issues: duplicate entries, unpaid exits, sensor mismatches</p>
          </div>
          <button
            onClick={() => alert('Resolving all incidents...')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors whitespace-nowrap ml-4"
          >
            Resolve All
          </button>
        </div>
      )}

      <div className="space-y-3">
        {incidents.length > 0 ? (
          incidents.map((incident) => {
            const styles = getSeverityStyles(incident.severity);
            return (
              <div
                key={incident.id}
                className={`flex items-start gap-4 p-4 border-2 rounded-xl ${styles.bg} ${styles.border} transition-opacity ${
                  incident.resolved ? 'opacity-50' : ''
                }`}
              >
                <AlertCircle className={`${styles.icon} flex-shrink-0 mt-1`} size={24} />
                <div className="flex-1">
                  <p className={`text-base font-bold ${styles.text}`}>{incident.title}</p>
                  <p className={`text-sm mt-1 ${styles.text} opacity-75`}>{incident.description}</p>
                  <p className="text-xs text-slate-500 mt-2">{incident.timestamp}</p>
                </div>
                {!incident.resolved && (
                  <button className={`text-sm font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    incident.severity === 'critical'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}>
                    Resolve
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Zap size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-base font-medium">No active incidents</p>
          </div>
        )}
      </div>
    </div>
  );
}
