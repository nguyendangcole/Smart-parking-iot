-- V1: Lược đồ cho quản lý IoT Nodes
CREATE TABLE IF NOT EXISTS public.iot_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sensor', 'camera', 'barrier', 'controller')),
    zone TEXT,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'OFFLINE', 'DELAYED', 'MAINTENANCE', 'ERROR')),
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    battery_level INTEGER, -- 0 to 100
    signal_strength INTEGER, -- e.g. -84 dBm
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng lưu lịch sử sự cố thiết bị
CREATE TABLE IF NOT EXISTS public.iot_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID REFERENCES public.iot_devices(id) ON DELETE CASCADE,
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
    description TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'IGNORED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- RLS
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_incidents ENABLE ROW LEVEL SECURITY;

-- Allow Admin full access
CREATE POLICY "Admin All Devices" ON public.iot_devices FOR ALL USING ( public.is_admin() );
CREATE POLICY "Admin All Incidents" ON public.iot_incidents FOR ALL USING ( public.is_admin() );

-- Dữ liệu giả lập thiết bị (Khởi tạo)
INSERT INTO public.iot_devices (name, type, zone, status, battery_level, signal_strength)
VALUES 
('Sensor Node #1042', 'sensor', 'Zone A', 'ACTIVE', 95, -60),
('Sensor Node #1043', 'sensor', 'Zone A', 'ACTIVE', 80, -65),
('IoT Node #1044', 'sensor', 'Zone B', 'ERROR', 15, -84),
('Barrier Gate #02', 'barrier', 'Main Gate', 'ERROR', 100, -50),
('Cam KV1', 'camera', 'Zone A', 'ACTIVE', 100, -55),
('Gate Controller Alpha', 'controller', 'Basement', 'ACTIVE', 100, -45);

-- Dữ liệu giả lập sự cố (Khởi tạo)
INSERT INTO public.iot_incidents (device_id, severity, description, status)
SELECT id, 'CRITICAL', 'Motor failure detected. Manual override engaged.', 'OPEN'
FROM public.iot_devices WHERE name = 'Barrier Gate #02';

INSERT INTO public.iot_incidents (device_id, severity, description, status)
SELECT id, 'WARNING', 'Intermittent connectivity. Signal strength at -84dBm.', 'OPEN'
FROM public.iot_devices WHERE name = 'IoT Node #1044';
