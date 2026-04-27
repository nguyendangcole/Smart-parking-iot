-- ==========================================
-- OPERATOR_SCHEMA.SQL
-- Database Schema cho Operator View Functionality
-- ==========================================

-- 1. Operator-specific Enums
DO $$ BEGIN
    -- Gate Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gate_status') THEN
        CREATE TYPE gate_status AS ENUM ('online', 'offline', 'alert', 'maintenance');
    END IF;
    
    -- Gate Lock State
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gate_lock_state') THEN
        CREATE TYPE gate_lock_state AS ENUM ('open', 'closed', 'locked');
    END IF;
    
    -- Action Type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operator_action_type') THEN
        CREATE TYPE operator_action_type AS ENUM ('gate_open', 'gate_close', 'gate_lock', 'gate_unlock', 'manual_entry', 'manual_exit', 'lost_card', 'override_gate');
    END IF;
    
    -- Notification Type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('alert', 'incident', 'info', 'warning', 'success');
    END IF;
    
    -- Incident Severity
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_severity') THEN
        CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;
END $$;

-- 2. Gates Table
CREATE TABLE IF NOT EXISTS public.gates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gate_name TEXT NOT NULL,
    zone TEXT NOT NULL,
    gate_type TEXT NOT NULL CHECK (gate_type IN ('entry', 'exit')),
    status gate_status DEFAULT 'offline',
    lock_state gate_lock_state DEFAULT 'closed',
    ip_address INET,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    camera_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Gate Actions Log
CREATE TABLE IF NOT EXISTS public.gate_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gate_id UUID REFERENCES public.gates(id) ON DELETE CASCADE,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type operator_action_type NOT NULL,
    action_data JSONB,
    reason TEXT,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    supervisor_code TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Operator Notifications
CREATE TABLE IF NOT EXISTS public.operator_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Incidents Table
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gate_id UUID REFERENCES public.gates(id) ON DELETE SET NULL,
    zone TEXT,
    incident_type TEXT NOT NULL,
    severity incident_severity DEFAULT 'medium',
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'closed')),
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Manual Handling Requests
CREATE TABLE IF NOT EXISTS public.manual_handling_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_type operator_action_type NOT NULL,
    vehicle_plate TEXT,
    student_id TEXT,
    reason TEXT,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    supervisor_code TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    notes TEXT,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 7. Lost Card Records
CREATE TABLE IF NOT EXISTS public.lost_card_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vehicle_plate TEXT,
    card_id TEXT,
    reason TEXT,
    status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved', 'closed')),
    replacement_issued BOOLEAN DEFAULT FALSE,
    replacement_card_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 8. Visitor Tickets (for Ticket Scanner)
CREATE TABLE IF NOT EXISTS public.visitor_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number TEXT UNIQUE NOT NULL,
    vehicle_plate TEXT NOT NULL,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('motorcycle', 'car')),
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unpaid', 'grace_period', 'completed', 'cancelled')),
    fee_amount DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    gate_id UUID REFERENCES public.gates(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Operator Sessions (for tracking active operator sessions)
CREATE TABLE IF NOT EXISTS public.operator_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_end TIMESTAMP WITH TIME ZONE,
    zone_assignments TEXT[],
    active_gates UUID[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'break', 'ended')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Gateway Status History
CREATE TABLE IF NOT EXISTS public.gateway_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gate_id UUID REFERENCES public.gates(id) ON DELETE CASCADE,
    previous_status gate_status,
    new_status gate_status NOT NULL,
    reason TEXT,
    operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gates_zone ON public.gates(zone);
CREATE INDEX IF NOT EXISTS idx_gates_status ON public.gates(status);
CREATE INDEX IF NOT EXISTS idx_gate_actions_gate_id ON public.gate_actions(gate_id);
CREATE INDEX IF NOT EXISTS idx_gate_actions_operator_id ON public.gate_actions(operator_id);
CREATE INDEX IF NOT EXISTS idx_gate_actions_created_at ON public.gate_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_operator_id ON public.operator_notifications(operator_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.operator_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_manual_requests_status ON public.manual_handling_requests(status);
CREATE INDEX IF NOT EXISTS idx_visitor_tickets_status ON public.visitor_tickets(status);
CREATE INDEX IF NOT EXISTS idx_visitor_tickets_plate ON public.visitor_tickets(vehicle_plate);

-- RLS Policies
ALTER TABLE public.gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_handling_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_card_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_status_history ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (admin and operators can access)
-- Gates
CREATE POLICY "Admins and operators can view gates" ON public.gates
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
    );

-- Gate Actions
CREATE POLICY "Admins and operators can view gate actions" ON public.gate_actions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
    );

CREATE POLICY "Operators can create gate actions" ON public.gate_actions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'operator')
    );

-- Notifications
CREATE POLICY "Operators can view their own notifications" ON public.operator_notifications
    FOR SELECT USING (
        operator_id = auth.uid()
    );

CREATE POLICY "Operators can update their own notifications" ON public.operator_notifications
    FOR UPDATE USING (
        operator_id = auth.uid()
    );

-- Incidents
CREATE POLICY "Admins and operators can view incidents" ON public.incidents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
    );

-- Manual Handling Requests
CREATE POLICY "Operators can view their own requests" ON public.manual_handling_requests
    FOR SELECT USING (
        operator_id = auth.uid()
    );

CREATE POLICY "Operators can create requests" ON public.manual_handling_requests
    FOR INSERT WITH CHECK (
        operator_id = auth.uid()
    );

-- Visitor Tickets
CREATE POLICY "Admins and operators can view visitor tickets" ON public.visitor_tickets
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'operator'))
    );

CREATE POLICY "Operators can manage visitor tickets" ON public.visitor_tickets
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'operator')
    );

-- Comments
COMMENT ON TABLE public.gates IS 'Cánh gate và thông tin status';
COMMENT ON TABLE public.gate_actions IS 'Lich su hành tác operator trên các gate';
COMMENT ON TABLE public.operator_notifications IS 'Thông báo cho operator';
COMMENT ON TABLE public.incidents IS 'Các incident/su co trong bãi xe';
COMMENT ON TABLE public.manual_handling_requests IS 'Yêu câux lý lý thucông';
COMMENT ON TABLE public.lost_card_records IS 'Biên la thâme thât RFID';
COMMENT ON TABLE public.visitor_tickets IS 'Vé khách tham quan';
COMMENT ON TABLE public.operator_sessions IS 'Phiên làm viêc operator';
