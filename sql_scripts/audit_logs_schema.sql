-- 1. Tạo bảng Audit Logs để lưu vết cấu hình hệ thống
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    old_values JSONB DEFAULT '{}'::jsonb,
    new_values JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    status TEXT DEFAULT 'SUCCESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Đảm bảo bảo mật RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Mọi người chèn được log (nếu action trigger bởi hook dưới backend)
-- Admin mới xem được lịch sử
DROP POLICY IF EXISTS "Admin Read Audit" ON public.audit_logs;
CREATE POLICY "Admin Read Audit" ON public.audit_logs 
FOR SELECT USING ( public.is_admin() );

DROP POLICY IF EXISTS "Insert Audit" ON public.audit_logs;
CREATE POLICY "Insert Audit" ON public.audit_logs 
FOR INSERT WITH CHECK ( true );

-- 3. Tạo một số dữ liệu ảo (Mock Data) để xem cho view ban đầu
INSERT INTO public.audit_logs (actor_email, action, entity_type, ip_address, status, created_at)
VALUES 
('admin@hcmut.edu.vn', 'Database Export', 'System', '192.168.1.45', 'SUCCESS', NOW() - INTERVAL '2 hours'),
('operator_khuA@hcmut.edu.vn', 'Manual Gate Override', 'Gate Control', '10.0.4.122', 'SUCCESS', NOW() - INTERVAL '3 hours'),
('admin@hcmut.edu.vn', 'Pricing Policy Update', 'Pricing', '192.168.1.45', 'SUCCESS', NOW() - INTERVAL '5 hours'),
('stranger@abroad.com', 'Admin Login Attempt', 'Auth', '45.22.19.8', 'FAILED', NOW() - INTERVAL '8 hours'),
('admin@hcmut.edu.vn', 'User Role Assignment', 'Profiles', '192.168.1.45', 'SUCCESS', NOW() - INTERVAL '1 day'),
('admin@hcmut.edu.vn', 'Exempt Payment Granted', 'Profiles', '192.168.1.45', 'SUCCESS', NOW() - INTERVAL '2 days');
