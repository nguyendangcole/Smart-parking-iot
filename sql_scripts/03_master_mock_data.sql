-- ===========================================
-- 03_MASTER_MOCK_DATA.SQL
-- Dữ liệu giả lập cho Dashboard và Hệ thống
-- ===========================================

-- 1. Bơm Parking Slots & Zones (Dùng Khu A và Khu B)
DO $$
DECLARE
    i INT;
BEGIN
    -- Khu A: 50 chỗ trống / 50 chỗ có xe
    FOR i IN 1..100 LOOP
        INSERT INTO public.parking_slots (slot_number, is_occupied, zone)
        VALUES ('A-' || LPAD(i::text, 3, '0'), (i % 2 = 0), 'Khu A')
        ON CONFLICT (slot_number) DO NOTHING;
    END LOOP;
    
    -- Khu B: 15 chỗ trống / 35 chỗ có xe
    FOR i IN 1..50 LOOP
        INSERT INTO public.parking_slots (slot_number, is_occupied, zone)
        VALUES ('B-' || LPAD(i::text, 3, '0'), (i <= 35), 'Khu B')
        ON CONFLICT (slot_number) DO NOTHING;
    END LOOP;
END $$;

-- 2. Bơm Signage Displays (Biển báo LED)
INSERT INTO public.signage_displays (display_id, location, linked_zone, header_text, status) 
VALUES 
('LED-01', 'Main Entrance', NULL, 'WELCOME TO HCMUT', 'OPEN'),
('LED-02', 'East Wing (Khu A)', 'Khu A', 'ZONE A PARKING', 'OPEN'),
('LED-03', 'Basement (Khu C)', 'Khu C', 'UNDERGROUND C', 'OPEN'),
('LED-04', 'West Wing (Khu B)', 'Khu B', 'ZONE B PARKING', 'OPEN')
ON CONFLICT (display_id) DO NOTHING;

-- 3. Bơm IoT Devices (Sensors, Barrier, Camera)
INSERT INTO public.iot_devices (name, type, zone, status, battery_level, signal_strength)
VALUES 
('Sensor Node #1042', 'sensor', 'Zone A', 'ACTIVE', 95, -60),
('Sensor Node #1043', 'sensor', 'Zone A', 'ACTIVE', 80, -65),
('IoT Node #1044', 'sensor', 'Zone B', 'ERROR', 15, -84),
('Barrier Gate #02', 'barrier', 'Main Gate', 'ERROR', 100, -50),
('Cam KV1', 'camera', 'Zone A', 'ACTIVE', 100, -55),
('Gate Controller Alpha', 'controller', 'Basement', 'ACTIVE', 100, -45)
ON CONFLICT DO NOTHING;

-- 4. Bơm IoT Incidents (Sự cố thiết bị)
INSERT INTO public.iot_incidents (device_id, severity, description, status)
SELECT id, 'CRITICAL', 'Motor failure detected. Manual override engaged.', 'OPEN'
FROM public.iot_devices WHERE name = 'Barrier Gate #02'
LIMIT 1;

INSERT INTO public.iot_incidents (device_id, severity, description, status)
SELECT id, 'WARNING', 'Intermittent connectivity. Signal strength at -84dBm.', 'OPEN'
FROM public.iot_devices WHERE name = 'IoT Node #1044'
LIMIT 1;

-- 5. Bơm dữ liệu Parking Sessions (Lịch sử gửi xe)
INSERT INTO public.parking_sessions (vehicle_plate, vehicle_type, entry_time, status)
VALUES 
('51A-123.45', 'car', NOW() - INTERVAL '2 hours', 'ACTIVE'),
('59B-678.90', 'bike', NOW() - INTERVAL '4 hours', 'ACTIVE'),
('60C-445.55', 'car', NOW() - INTERVAL '1 hour', 'ACTIVE'),
('51D-999.00', 'car', NOW() - INTERVAL '30 mins', 'ACTIVE'),
('72E-111.22', 'car', NOW() - INTERVAL '5 hours', 'COMPLETED'),
('51F-333.44', 'bike', NOW() - INTERVAL '6 hours', 'COMPLETED'),
('59G-555.66', 'car', NOW() - INTERVAL '12 hours', 'COMPLETED');

-- 6. Bơm dữ liệu Transactions (Giao dịch)
INSERT INTO public.parking_transactions (amount, status, created_at, payment_method)
VALUES 
(25000, 'SUCCESS', NOW() - INTERVAL '1 hour', 'ZaloPay'),
(15000, 'SUCCESS', NOW() - INTERVAL '2 hours', 'Momo'),
(50000, 'SUCCESS', NOW() - INTERVAL '5 hours', 'Credit Card'),
(12000, 'PENDING', NOW() - INTERVAL '10 mins', 'Cash'),
(15000, 'SUCCESS', NOW() - INTERVAL '1 hour', 'Momo'),
(28000, 'SUCCESS', NOW() - INTERVAL '4 hours', 'E-Wallet'),
(42000, 'SUCCESS', NOW() - INTERVAL '7 hours', 'ZaloPay');

-- 7. Audit Logs giả lập
INSERT INTO public.audit_logs (actor_email, action, entity_type, status, created_at)
VALUES 
('admin_hcmut@hcmut.edu.vn', 'Database Maintenance', 'System', 'SUCCESS', NOW() - INTERVAL '2 hours'),
('operator_hcmut@hcmut.edu.vn', 'Manual Gate Override', 'Gate Control', 'SUCCESS', NOW() - INTERVAL '3 hours');
