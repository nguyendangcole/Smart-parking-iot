-- 1. Create the Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    ip_address TEXT,
    status TEXT CHECK (status IN ('SUCCESS', 'FAILED', 'WARN')) DEFAULT 'SUCCESS',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Only Admins can view logs
-- Note: Assumes you have a 'profiles' table with a 'role' column
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 4. Allow application to insert logs
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Enable Realtime (for the dashboard to update automatically)
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
