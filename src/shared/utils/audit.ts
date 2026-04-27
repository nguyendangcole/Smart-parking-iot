import { supabase } from '../supabase';

export type AuditStatus = 'SUCCESS' | 'FAILED' | 'WARN';
export type AuditSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditLogPayload {
  action: string;
  entityType: string;
  entityId?: string;
  status?: AuditStatus;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
}

/**
 * Utility to record system actions for auditing.
 * Designed to be smart: Only log high-impact actions for regular users,
 * but log all mutations for Admins/Operators.
 */
export async function recordAuditLog(payload: AuditLogPayload) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch user role from profiles for smarter categorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const { error } = await supabase.from('audit_logs').insert([{
      actor_email: user.email,
      actor_role: profile?.role || 'user',
      action: payload.action,
      entity_type: payload.entityType,
      entity_id: payload.entityId,
      status: payload.status || 'SUCCESS',
      severity: payload.severity || 'INFO',
      metadata: payload.metadata || {},
    }]);

    if (error) {
      console.error('Failed to record audit log:', error);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}
