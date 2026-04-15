-- ==========================================
-- OPERATOR_MOCK_DATA.SQL
-- Mock data for Operator View Functionality
-- ==========================================

-- 1. Insert Gates
INSERT INTO public.gates (gate_name, zone, gate_type, status, lock_state, ip_address, camera_url, description) VALUES
('Main Entrance Gate', 'Zone A', 'entry', 'online', 'closed', '192.168.1.101', 'https://picsum.photos/seed/gate_main/640/480.jpg', 'Main entrance gate for Zone A'),
('North Exit Gate', 'Zone A', 'exit', 'online', 'closed', '192.168.1.102', 'https://picsum.photos/seed/gate_north/640/480.jpg', 'North exit gate for Zone A'),
('South Entry Gate', 'Zone B', 'entry', 'online', 'closed', '192.168.1.103', 'https://picsum.photos/seed/gate_south/640/480.jpg', 'South entrance gate for Zone B'),
('Emergency Exit Gate', 'Zone B', 'exit', 'alert', 'locked', '192.168.1.104', 'https://picsum.photos/seed/gate_emergency/640/480.jpg', 'Emergency exit gate for Zone B'),
('Staff Parking Gate', 'Zone C', 'entry', 'online', 'closed', '192.168.1.105', 'https://picsum.photos/seed/gate_staff/640/480.jpg', 'Staff parking entrance gate'),
('Visitor Parking Gate', 'Zone C', 'exit', 'offline', 'locked', '192.168.1.106', 'https://picsum.photos/seed/gate_visitor/640/480.jpg', 'Visitor parking exit gate')
ON CONFLICT DO NOTHING;

-- 2. Insert Gate Actions History
INSERT INTO public.gate_actions (gate_id, operator_id, action_type, action_data, reason, status, created_at) VALUES
(
  (SELECT id FROM public.gates WHERE gate_name = 'Main Entrance Gate'),
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  'gate_open',
  '{"duration": 30}',
  'Morning rush hour traffic management',
  'completed',
  NOW() - INTERVAL '2 hours'
),
(
  (SELECT id FROM public.gates WHERE gate_name = 'North Exit Gate'),
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  'gate_close',
  '{"auto_close": true}',
  'Regular operation',
  'completed',
  NOW() - INTERVAL '1 hour'
),
(
  (SELECT id FROM public.gates WHERE gate_name = 'Emergency Exit Gate'),
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  'gate_lock',
  '{"emergency_lock": true}',
  'Security protocol activation',
  'completed',
  NOW() - INTERVAL '30 minutes'
),
(
  (SELECT id FROM public.gates WHERE gate_name = 'South Entry Gate'),
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  'manual_entry',
  '{"vehicle_plate": "ABC-1234", "student_id": "ST001"}',
  'Manual entry for lost RFID card',
  'completed',
  NOW() - INTERVAL '45 minutes'
)
ON CONFLICT DO NOTHING;

-- 3. Insert Operator Notifications
INSERT INTO public.operator_notifications (operator_id, type, title, message, data, is_read, created_at) VALUES
(
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  'alert',
  'Zone A - High Occupancy',
  'Zone A is now 85% full. Consider redirecting traffic to Zone B.',
  '{"zone": "A", "occupancy_rate": 85}',
  false,
  NOW() - INTERVAL '5 minutes'
),
(
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  'incident',
  'Emergency Exit Gate Offline',
  'Exit gate 2 connection lost - manual override may be needed.',
  '{"gate_id": "emergency_exit_gate", "severity": "high"}',
  false,
  NOW() - INTERVAL '15 minutes'
),
(
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  'info',
  'System Update',
  'Routine maintenance completed successfully. All systems operational.',
  '{"maintenance_type": "routine", "duration": "2 hours"}',
  true,
  NOW() - INTERVAL '2 hours'
),
(
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  'warning',
  'Gate Camera Malfunction',
  'Camera at Main Entrance Gate experiencing connectivity issues.',
  '{"gate_id": "main_entrance", "issue": "camera_connectivity"}',
  false,
  NOW() - INTERVAL '1 hour'
)
ON CONFLICT DO NOTHING;

-- 4. Insert Incidents
INSERT INTO public.incidents (gate_id, zone, incident_type, severity, description, status, operator_id, created_at) VALUES
(
  (SELECT id FROM public.gates WHERE gate_name = 'Emergency Exit Gate'),
  'Zone B',
  'Gate Offline',
  'high',
  'Emergency Exit Gate lost connection to main controller. Requires immediate attention.',
  'active',
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  NOW() - INTERVAL '15 minutes'
),
(
  (SELECT id FROM public.gates WHERE gate_name = 'Main Entrance Gate'),
  'Zone A',
  'Camera Malfunction',
  'medium',
  'Main entrance gate camera experiencing intermittent connectivity issues.',
  'investigating',
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  NOW() - INTERVAL '1 hour'
),
(
  (SELECT id FROM public.gates WHERE gate_name = 'Visitor Parking Gate'),
  'Zone C',
  'Power Outage',
  'critical',
  'Visitor parking gate completely offline due to power failure.',
  'resolved',
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  NOW() - INTERVAL '3 hours'
),
(
  NULL,
  'Zone A',
  'High Traffic Volume',
  'low',
  'Unusually high traffic volume detected at Zone A entrance.',
  'active',
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  NOW() - INTERVAL '30 minutes'
)
ON CONFLICT DO NOTHING;

-- 5. Insert Manual Handling Requests
INSERT INTO public.manual_handling_requests (operator_id, request_type, vehicle_plate, student_id, reason, supervisor_code, status, notes, created_at) VALUES
(
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  'lost_card',
  'XYZ-5678',
  'ST002',
  'Student reported lost RFID card',
  'SUP123',
  'approved',
  'Replacement card issued. Old card deactivated.',
  NOW() - INTERVAL '1 hour'
),
(
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  'manual_entry',
  'DEF-9012',
  'ST003',
  'RFID card not detected at reader',
  'SUP123',
  'completed',
  'Manual entry completed. Student advised to check card.',
  NOW() - INTERVAL '2 hours'
),
(
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  'override_gate',
  'GHI-3456',
  NULL,
  'Visitor vehicle requires manual gate override',
  'SUP456',
  'pending',
  'Waiting for supervisor approval.',
  NOW() - INTERVAL '30 minutes'
),
(
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  'manual_exit',
  'JKL-7890',
  'ST004',
  'Exit barrier not responding to card',
  'SUP123',
  'completed',
  'Manual exit completed. Maintenance notified.',
  NOW() - INTERVAL '45 minutes'
)
ON CONFLICT DO NOTHING;

-- 6. Insert Lost Card Records
INSERT INTO public.lost_card_records (operator_id, student_id, vehicle_plate, card_id, reason, status, replacement_issued, replacement_card_id, notes, created_at) VALUES
(
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  (SELECT id FROM public.profiles WHERE email = 'student2@hcmut.edu.vn'),
  'XYZ-5678',
  'RFID002',
  'Lost RFID card during campus event',
  'resolved',
  true,
  'RFID002_NEW',
  'Student verified identity. Replacement fee paid.',
  NOW() - INTERVAL '1 hour'
),
(
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  (SELECT id FROM public.profiles WHERE email = 'student3@hcmut.edu.vn'),
  'MNO-2345',
  'RFID003',
  'Card damaged beyond repair',
  'investigating',
  false,
  NULL,
  'Student reported card physically damaged. Verification pending.',
  NOW() - INTERVAL '30 minutes'
),
(
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  (SELECT id FROM public.profiles WHERE email = 'student4@hcmut.edu.vn'),
  'PQR-6789',
  'RFID004',
  'Card stolen from backpack',
  'reported',
  false,
  NULL,
  'Police report filed. Card immediately deactivated.',
  NOW() - INTERVAL '2 hours'
)
ON CONFLICT DO NOTHING;

-- 7. Insert Visitor Tickets
INSERT INTO public.visitor_tickets (ticket_number, vehicle_plate, vehicle_type, entry_time, status, fee_amount, paid_amount, operator_id, gate_id, notes, created_at) VALUES
(
  'VISIT-2024-0415-0001',
  'VISITOR-001',
  'car',
  NOW() - INTERVAL '3 hours',
  'active',
  30000,
  0,
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  (SELECT id FROM public.gates WHERE gate_name = 'Main Entrance Gate'),
  'Visitor for faculty meeting',
  NOW() - INTERVAL '3 hours'
),
(
  'VISIT-2024-0415-0002',
  'VISITOR-002',
  'motorcycle',
  NOW() - INTERVAL '2 hours',
  'unpaid',
  15000,
  0,
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  (SELECT id FROM public.gates WHERE gate_name = 'South Entry Gate'),
  'Delivery vehicle',
  NOW() - INTERVAL '2 hours'
),
(
  'VISIT-2024-0415-0003',
  'VISITOR-003',
  'car',
  NOW() - INTERVAL '1 hour',
  'grace_period',
  20000,
  0,
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  (SELECT id FROM public.gates WHERE gate_name = 'Main Entrance Gate'),
  'Parent visiting student',
  NOW() - INTERVAL '1 hour'
),
(
  'VISIT-2024-0415-0004',
  'VISITOR-004',
  'motorcycle',
  NOW() - INTERVAL '4 hours',
  'completed',
  10000,
  10000,
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  (SELECT id FROM public.gates WHERE gate_name = 'North Exit Gate'),
  'Contractor - paid cash',
  NOW() - INTERVAL '4 hours'
)
ON CONFLICT DO NOTHING;

-- 8. Insert Operator Sessions
INSERT INTO public.operator_sessions (operator_id, zone_assignments, active_gates, status, notes, created_at) VALUES
(
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  ARRAY['Zone A', 'Zone B'],
  ARRAY[(SELECT id FROM public.gates WHERE gate_name = 'Main Entrance Gate'), (SELECT id FROM public.gates WHERE gate_name = 'North Exit Gate')],
  'active',
  'Morning shift - monitoring Zone A & B',
  NOW() - INTERVAL '4 hours'
)
ON CONFLICT DO NOTHING;

-- 9. Insert Gateway Status History
INSERT INTO public.gateway_status_history (gate_id, previous_status, new_status, reason, operator_id, created_at) VALUES
(
  (SELECT id FROM public.gates WHERE gate_name = 'Emergency Exit Gate'),
  'online',
  'alert',
  'Connection timeout detected',
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  NOW() - INTERVAL '15 minutes'
),
(
  (SELECT id FROM public.gates WHERE gate_name = 'Visitor Parking Gate'),
  'online',
  'offline',
  'Power outage in Zone C',
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  NOW() - INTERVAL '3 hours'
),
(
  (SELECT id FROM public.gates WHERE gate_name = 'Main Entrance Gate'),
  'offline',
  'online',
  'Network connectivity restored',
  (SELECT id FROM public.profiles WHERE email = 'operator@hcmut.edu.vn'),
  NOW() - INTERVAL '5 hours'
)
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON SCRIPT IS 'Mock data for operator functionality testing';
