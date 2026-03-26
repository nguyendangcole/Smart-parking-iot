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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Incidents & Alerts</h2>
          <p className="text-xs text-slate-500 mt-1">Auto-detected issues: duplicate entries, unpaid exits, sensor mismatches</p>
        </div>
        <button
          onClick={onRefresh}
          className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {incidents.length > 0 ? (
          incidents.map((incident) => {
            const styles = getSeverityStyles(incident.severity);
            return (
              <div
                key={incident.id}
                className={`flex items-start gap-3 p-3 border rounded-lg ${styles.bg} ${styles.border} transition-opacity ${
                  incident.resolved ? 'opacity-50' : ''
                }`}
              >
                <AlertCircle className={`${styles.icon} flex-shrink-0 mt-0.5`} size={18} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${styles.text}`}>{incident.title}</p>
                  <p className={`text-xs mt-1 ${styles.text} opacity-75`}>{incident.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{incident.timestamp}</p>
                </div>
                {!incident.resolved && (
                  <button className="text-xs font-semibold px-2 py-1 rounded hover:opacity-80 transition-opacity whitespace-nowrap">
                    Resolve
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Zap size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No active incidents</p>
          </div>
        )}
      </div>
    </div>
  );
}
