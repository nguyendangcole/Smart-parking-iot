import { supabase } from '../supabase';

// Types
export interface Gate {
  id: string;
  gate_name: string;
  zone: string;
  gate_type: 'entry' | 'exit';
  status: 'online' | 'offline' | 'alert' | 'maintenance';
  lock_state: 'open' | 'closed' | 'locked';
  ip_address?: string;
  last_heartbeat?: string;
  camera_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface GateAction {
  id: string;
  gate_id: string;
  operator_id?: string;
  action_type: 'gate_open' | 'gate_close' | 'gate_lock' | 'gate_unlock' | 'manual_entry' | 'manual_exit' | 'lost_card' | 'override_gate';
  action_data?: any;
  reason?: string;
  supervisor_id?: string;
  supervisor_code?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface OperatorNotification {
  id: string;
  operator_id: string;
  type: 'alert' | 'incident' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  is_dismissed: boolean;
  expires_at?: string;
  created_at: string;
}

export interface Incident {
  id: string;
  gate_id?: string;
  zone?: string;
  incident_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'active' | 'investigating' | 'resolved' | 'closed';
  operator_id?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ManualHandlingRequest {
  id: string;
  operator_id: string;
  request_type: 'gate_open' | 'gate_close' | 'gate_lock' | 'gate_unlock' | 'manual_entry' | 'manual_exit' | 'lost_card' | 'override_gate';
  vehicle_plate?: string;
  student_id?: string;
  reason?: string;
  supervisor_id?: string;
  supervisor_code?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  data?: any;
  created_at: string;
  processed_at?: string;
}

export interface LostCardRecord {
  id: string;
  operator_id: string;
  student_id?: string;
  vehicle_plate?: string;
  card_id?: string;
  reason?: string;
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  replacement_issued: boolean;
  replacement_card_id?: string;
  notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface VisitorTicket {
  id: string;
  ticket_number: string;
  vehicle_plate: string;
  vehicle_type: 'motorcycle' | 'car';
  entry_time: string;
  exit_time?: string;
  status: 'active' | 'unpaid' | 'grace_period' | 'completed' | 'cancelled';
  fee_amount: number;
  paid_amount: number;
  operator_id?: string;
  gate_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OperatorSession {
  id: string;
  operator_id: string;
  session_start: string;
  session_end?: string;
  zone_assignments: string[];
  active_gates: string[];
  status: 'active' | 'break' | 'ended';
  notes?: string;
  created_at: string;
}

// Service Class
class OperatorService {
  // Dashboard KPIs
  async getDashboardKPIs() {
    const [
      totalSlotsResult,
      occupiedSlotsResult,
      zonesResult,
      activeIncidentsResult,
      todayActionsResult
    ] = await Promise.all([
      supabase.from('parking_slots').select('*', { count: 'exact', head: true }),
      supabase.from('parking_slots').select('*', { count: 'exact', head: true }).eq('is_occupied', true),
      supabase.from('parking_slots').select('zone, is_occupied'),
      supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('gate_actions').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
    ]);

    return {
      totalSlots: totalSlotsResult.count || 0,
      occupiedSlots: occupiedSlotsResult.count || 0,
      zones: this.processZoneData(zonesResult.data || []),
      activeIncidents: activeIncidentsResult.count || 0,
      todayActions: todayActionsResult.count || 0
    };
  }

  private processZoneData(zones: any[]) {
    const zoneMap = new Map();
    zones.forEach(slot => {
      if (!zoneMap.has(slot.zone)) {
        zoneMap.set(slot.zone, { total: 0, occupied: 0 });
      }
      zoneMap.get(slot.zone).total++;
      if (slot.is_occupied) {
        zoneMap.get(slot.zone).occupied++;
      }
    });
    return Array.from(zoneMap.entries()).map(([zone, data]) => ({
      zone,
      ...data,
      occupancyRate: Math.round((data.occupied / data.total) * 100)
    }));
  }

  // Gates Management
  async getGates() {
    const { data, error } = await supabase
      .from('gates')
      .select('*')
      .order('gate_name');
    
    if (error) throw error;
    return data as Gate[];
  }

  async getGateById(id: string) {
    const { data, error } = await supabase
      .from('gates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Gate;
  }

  async updateGateStatus(gateId: string, status: Gate['status'], operatorId?: string) {
    const { data, error } = await supabase
      .from('gates')
      .update({ 
        status, 
        last_heartbeat: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', gateId)
      .select()
      .single();

    if (error) throw error;

    // Log the status change
    await this.createGateAction({
      gate_id: gateId,
      operator_id: operatorId,
      action_type: 'gate_open', // This will be updated based on the action
      reason: `Status updated to ${status}`
    });

    return data as Gate;
  }

  async controlGate(gateId: string, action: 'open' | 'close' | 'lock' | 'unlock', operatorId: string, reason?: string) {
    const actionType = `gate_${action}` as GateAction['action_type'];
    
    // Update gate state
    const { data, error } = await supabase
      .from('gates')
      .update({ 
        lock_state: action === 'lock' ? 'locked' : action === 'open' ? 'open' : 'closed',
        updated_at: new Date().toISOString()
      })
      .eq('id', gateId)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await this.createGateAction({
      gate_id: gateId,
      operator_id: operatorId,
      action_type: actionType,
      reason
    });

    return data as Gate;
  }

  async createGateAction(action: Omit<GateAction, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase
      .from('gate_actions')
      .insert({
        ...action,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as GateAction;
  }

  async getGateActionsHistory(gateId?: string, limit: number = 50) {
    let query = supabase
      .from('gate_actions')
      .select(`
        *,
        gates!inner(gate_name, zone),
        profiles!inner(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (gateId) {
      query = query.eq('gate_id', gateId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Notifications
  async getNotifications(operatorId: string) {
    const { data, error } = await supabase
      .from('operator_notifications')
      .select('*')
      .eq('operator_id', operatorId)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data as OperatorNotification[];
  }

  async markNotificationAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('operator_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data as OperatorNotification;
  }

  async dismissNotification(notificationId: string) {
    const { data, error } = await supabase
      .from('operator_notifications')
      .update({ is_dismissed: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data as OperatorNotification;
  }

  async createNotification(notification: Omit<OperatorNotification, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('operator_notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data as OperatorNotification;
  }

  // Incidents
  async getIncidents(status?: Incident['status']) {
    let query = supabase
      .from('incidents')
      .select(`
        *,
        gates!inner(gate_name, zone),
        profiles!inner(full_name)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createIncident(incident: Omit<Incident, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('incidents')
      .insert({
        ...incident,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as Incident;
  }

  async updateIncidentStatus(incidentId: string, status: Incident['status'], resolvedBy?: string) {
    const { data, error } = await supabase
      .from('incidents')
      .update({ 
        status,
        resolved_by: resolvedBy,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', incidentId)
      .select()
      .single();

    if (error) throw error;
    return data as Incident;
  }

  // Manual Handling
  async createManualHandlingRequest(request: Omit<ManualHandlingRequest, 'id' | 'created_at' | 'processed_at'>) {
    const { data, error } = await supabase
      .from('manual_handling_requests')
      .insert({
        ...request,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as ManualHandlingRequest;
  }

  async getManualHandlingRequests(operatorId?: string, status?: ManualHandlingRequest['status']) {
    let query = supabase
      .from('manual_handling_requests')
      .select(`
        *,
        profiles!inner(full_name)
      `)
      .order('created_at', { ascending: false });

    if (operatorId) {
      query = query.eq('operator_id', operatorId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async updateManualHandlingRequest(requestId: string, updates: Partial<ManualHandlingRequest>) {
    const { data, error } = await supabase
      .from('manual_handling_requests')
      .update({
        ...updates,
        processed_at: updates.status && ['approved', 'rejected', 'completed'].includes(updates.status) 
          ? new Date().toISOString() 
          : undefined
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data as ManualHandlingRequest;
  }

  // Lost Cards
  async createLostCardRecord(record: Omit<LostCardRecord, 'id' | 'created_at' | 'resolved_at'>) {
    const { data, error } = await supabase
      .from('lost_card_records')
      .insert({
        ...record,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as LostCardRecord;
  }

  async getLostCardRecords(status?: LostCardRecord['status']) {
    let query = supabase
      .from('lost_card_records')
      .select(`
        *,
        profiles!inner(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async updateLostCardRecord(recordId: string, updates: Partial<LostCardRecord>) {
    const { data, error } = await supabase
      .from('lost_card_records')
      .update({
        ...updates,
        resolved_at: updates.status && ['resolved', 'closed'].includes(updates.status) 
          ? new Date().toISOString() 
          : undefined
      })
      .eq('id', recordId)
      .select()
      .single();

    if (error) throw error;
    return data as LostCardRecord;
  }

  // Visitor Tickets
  async getVisitorTickets(status?: VisitorTicket['status'], search?: string) {
    let query = supabase
      .from('visitor_tickets')
      .select(`
        *,
        profiles!inner(full_name),
        gates!inner(gate_name)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`ticket_number.ilike.%${search}%,vehicle_plate.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createVisitorTicket(ticket: Omit<VisitorTicket, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('visitor_tickets')
      .insert({
        ...ticket,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as VisitorTicket;
  }

  async updateVisitorTicket(ticketId: string, updates: Partial<VisitorTicket>) {
    const { data, error } = await supabase
      .from('visitor_tickets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return data as VisitorTicket;
  }

  async processVisitorPayment(ticketId: string, paidAmount: number) {
    const { data, error } = await supabase
      .from('visitor_tickets')
      .update({
        paid_amount: paidAmount,
        status: 'completed',
        exit_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return data as VisitorTicket;
  }

  // Operator Sessions
  async startOperatorSession(operatorId: string, zoneAssignments: string[] = []) {
    const { data, error } = await supabase
      .from('operator_sessions')
      .insert({
        operator_id: operatorId,
        zone_assignments: zoneAssignments,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data as OperatorSession;
  }

  async endOperatorSession(sessionId: string) {
    const { data, error } = await supabase
      .from('operator_sessions')
      .update({
        session_end: new Date().toISOString(),
        status: 'ended'
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data as OperatorSession;
  }

  async getActiveOperatorSession(operatorId: string) {
    const { data, error } = await supabase
      .from('operator_sessions')
      .select('*')
      .eq('operator_id', operatorId)
      .eq('status', 'active')
      .order('session_start', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as OperatorSession | null;
  }

  // Utility Methods
  async generateTicketNumber(): Promise<string> {
    const prefix = 'VISIT';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${date}-${random}`;
  }

  async calculateParkingFee(entryTime: string, vehicleType: 'motorcycle' | 'car'): Promise<number> {
    const entry = new Date(entryTime);
    const now = new Date();
    const hours = Math.ceil((now.getTime() - entry.getTime()) / (1000 * 60 * 60));
    
    // Base rates (these should come from pricing policies)
    const baseRates = {
      motorcycle: 5000,  // 5,000 VND per hour
      car: 10000        // 10,000 VND per hour
    };
    
    return hours * baseRates[vehicleType];
  }
}

export const operatorService = new OperatorService();
