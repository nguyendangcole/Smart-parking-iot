import { supabase } from '../supabase';

export type AuditStatus = 'SUCCESS' | 'FAILED' | 'WARN';

export interface AuditLogPayload {
  action: string;
  entityType: string;
  entityId?: string;
  status?: AuditStatus;
  metadata?: Record<string, any>;
}

/**
 * Utility to record system actions for auditing.
 */
export async function recordAuditLog(payload: AuditLogPayload) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('audit_logs').insert([{
      actor_email: user?.email || 'System',
      action: payload.action,
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      status: payload.status || 'SUCCESS',
      metadata: payload.metadata || {},
      ip_address: null, // Subabase can capture this via a trigger/function if needed
    }]);

    if (error) {
      console.error('Failed to record audit log:', error);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}
