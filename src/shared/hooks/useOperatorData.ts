import { useState, useEffect } from 'react';
import { useProfile } from './useProfile';
import { operatorService } from '../services/operatorService';

export function useOperatorData() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard KPIs
  const [kpis, setKpis] = useState({
    totalSlots: 0,
    occupiedSlots: 0,
    zones: [] as any[],
    activeIncidents: 0,
    todayActions: 0
  });

  // Gates
  const [gates, setGates] = useState<any[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);

  // Incidents
  const [incidents, setIncidents] = useState<any[]>([]);

  // Manual Handling Requests
  const [manualRequests, setManualRequests] = useState<any[]>([]);

  // Visitor Tickets
  const [visitorTickets, setVisitorTickets] = useState<any[]>([]);

  // Fetch all data
  const fetchAllData = async () => {
    if (!profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Parallel fetch all data
      const [
        kpisData,
        gatesData,
        notificationsData,
        incidentsData,
        manualRequestsData,
        visitorTicketsData
      ] = await Promise.all([
        operatorService.getDashboardKPIs(),
        operatorService.getGates(),
        operatorService.getNotifications(profile.id),
        operatorService.getIncidents(),
        operatorService.getManualHandlingRequests(),
        operatorService.getVisitorTickets()
      ]);

      setKpis(kpisData);
      setGates(gatesData.map(gate => ({
        id: gate.id,
        name: gate.gate_name,
        zone: gate.zone,
        status: gate.status.charAt(0).toUpperCase() + gate.status.slice(1),
        img: gate.camera_url || '/api/placeholder/400/300',
        recTime: gate.last_heartbeat ? new Date(gate.last_heartbeat).toLocaleTimeString() : undefined,
        alert: gate.status === 'alert' ? 'Connection unstable' : undefined,
        lockState: gate.lock_state
      })));
      setNotifications(notificationsData);
      setIncidents(incidentsData);
      setManualRequests(manualRequestsData);
      setVisitorTickets(visitorTicketsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch operator data');
      console.error('Error fetching operator data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh specific data
  const refreshKPIs = async () => {
    try {
      const kpisData = await operatorService.getDashboardKPIs();
      setKpis(kpisData);
    } catch (err) {
      console.error('Error refreshing KPIs:', err);
    }
  };

  const refreshGates = async () => {
    try {
      const gatesData = await operatorService.getGates();
      setGates(gatesData.map(gate => ({
        id: gate.id,
        name: gate.gate_name,
        zone: gate.zone,
        status: gate.status.charAt(0).toUpperCase() + gate.status.slice(1),
        img: gate.camera_url || '/api/placeholder/400/300',
        recTime: gate.last_heartbeat ? new Date(gate.last_heartbeat).toLocaleTimeString() : undefined,
        alert: gate.status === 'alert' ? 'Connection unstable' : undefined,
        lockState: gate.lock_state
      })));
    } catch (err) {
      console.error('Error refreshing gates:', err);
    }
  };

  const refreshNotifications = async () => {
    if (!profile?.id) return;
    try {
      const notificationsData = await operatorService.getNotifications(profile.id);
      setNotifications(notificationsData);
    } catch (err) {
      console.error('Error refreshing notifications:', err);
    }
  };

  // Gate actions
  const controlGate = async (gateId: string, action: 'open' | 'close' | 'lock' | 'unlock', reason?: string) => {
    if (!profile?.id) throw new Error('Operator not authenticated');

    try {
      const result = await operatorService.controlGate(gateId, action, profile.id, reason);
      
      // Refresh gates data after action
      await refreshGates();
      
      return result;
    } catch (err) {
      console.error('Error controlling gate:', err);
      throw err;
    }
  };

  // Notification actions
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await operatorService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await operatorService.dismissNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error dismissing notification:', err);
      throw err;
    }
  };

  // Manual handling
  const createManualRequest = async (request: any) => {
    if (!profile?.id) throw new Error('Operator not authenticated');

    try {
      const result = await operatorService.createManualHandlingRequest({
        ...request,
        operator_id: profile.id
      });
      
      // Refresh requests
      const manualRequestsData = await operatorService.getManualHandlingRequests();
      setManualRequests(manualRequestsData);
      
      return result;
    } catch (err) {
      console.error('Error creating manual request:', err);
      throw err;
    }
  };

  // Visitor tickets
  const searchVisitorTickets = async (search: string) => {
    try {
      const tickets = await operatorService.getVisitorTickets(undefined, search);
      setVisitorTickets(tickets);
      return tickets;
    } catch (err) {
      console.error('Error searching visitor tickets:', err);
      throw err;
    }
  };

  const processVisitorPayment = async (ticketId: string, paidAmount: number) => {
    try {
      const result = await operatorService.processVisitorPayment(ticketId, paidAmount);
      
      // Refresh tickets
      const visitorTicketsData = await operatorService.getVisitorTickets();
      setVisitorTickets(visitorTicketsData);
      
      return result;
    } catch (err) {
      console.error('Error processing visitor payment:', err);
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, [profile?.id]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshKPIs();
      refreshGates();
      refreshNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    // Data
    kpis,
    gates,
    notifications,
    incidents,
    manualRequests,
    visitorTickets,
    
    // State
    loading,
    error,
    
    // Actions
    fetchAllData,
    refreshKPIs,
    refreshGates,
    refreshNotifications,
    controlGate,
    markNotificationAsRead,
    dismissNotification,
    createManualRequest,
    searchVisitorTickets,
    processVisitorPayment
  };
}
