-- 1. Create the Audit Logs Table
-- This table stores all important system events, focused on Admins/Operators actions
-- and critical financial/security actions for regular Users.
DROP TABLE IF EXISTS public.audit_logs;

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    actor_email TEXT NOT NULL,
    actor_role TEXT, -- admin, operator, member, visitor
    action TEXT NOT NULL, -- e.g., 'UPDATE_PRICING', 'MANUAL_GATE_OPEN', 'PAYMENT_SUCCESS'
    entity_type TEXT, -- e.g., 'PRICING', 'AUTH', 'USER', 'GATE'
    entity_id TEXT,
    status TEXT CHECK (status IN ('SUCCESS', 'FAILED', 'WARN')) DEFAULT 'SUCCESS',
    severity TEXT CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'INFO',
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Security Policies
-- Admins can view ALL logs for monitoring and integrity checks
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Every authenticated user (including operators and members) can INSERT logs
-- This allows the app to record their high-impact actions.
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Enable Realtime (Dashboard will update instantly when a new log is inserted)
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

-- 5. Helper Function for Cleanup (Optional)
-- You can run 'SELECT delete_old_audit_logs();' to clear logs older than 90 days.
CREATE OR REPLACE FUNCTION delete_old_audit_logs() RETURNS void AS $$
BEGIN
    DELETE FROM public.audit_logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
