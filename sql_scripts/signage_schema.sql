-- 1. Xóa bảng cũ nếu có (để fix lỗi không tồn tại cột)
DROP TABLE IF EXISTS public.signage_displays CASCADE;

-- 2. Tạo bảng cấu hình bảng LED/Signage (BỎ các cột đếm slot giả)
CREATE TABLE public.signage_displays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    display_id TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    linked_zone TEXT, -- Liền kết với parking_slots.zone (VD: 'Khu A')
    header_text TEXT DEFAULT 'WELCOME TO HCMUT',
    marquee_message TEXT DEFAULT 'PLEASE DRIVE SLOWLY • OBSERVE PARKING RULES',
    theme_color TEXT DEFAULT 'orange',
    status TEXT DEFAULT 'OPEN',
    is_emergency BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS Security cho biển LED
ALTER TABLE public.signage_displays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read signage" ON public.signage_displays FOR SELECT USING (true);
CREATE POLICY "Admin update signage" ON public.signage_displays FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin insert signage" ON public.signage_displays FOR INSERT WITH CHECK (public.is_admin());

-- 4. Tạo kết nối dữ liệu giả cho Signage (Map với 'Khu A', 'Khu B')
INSERT INTO public.signage_displays (display_id, location, linked_zone, header_text, status) 
VALUES 
('LED-01', 'Main Entrance', NULL, 'WELCOME TO HCMUT', 'OPEN'),
('LED-02', 'East Wing (Khu A)', 'Khu A', 'ZONE A PARKING', 'OPEN'),
('LED-03', 'Basement (Khu C)', 'Khu C', 'UNDERGROUND C', 'OPEN'),
('LED-04', 'West Wing (Khu B)', 'Khu B', 'ZONE B PARKING', 'OPEN');

-- 5. Data giả cho parking_slots (để bạn test realtime hiển thị số chỗ trên biển LED)
-- Chỉ Insert nếu chưa có, nếu bạn đã có thì sửa lại
CREATE TABLE IF NOT EXISTS public.parking_slots (
    id SERIAL PRIMARY KEY,
    slot_number TEXT NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    zone TEXT NOT NULL
);

-- Bơm 100 slot vào Khu A (50 slot đã có xe, 50 slot trống) => Sẽ báo trên LED: 50 / 100
DO $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..100 LOOP
        INSERT INTO public.parking_slots (slot_number, is_occupied, zone)
        VALUES ('A-' || LPAD(i::text, 3, '0'), (i % 2 = 0), 'Khu A')
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- Bơm 50 slot vào Khu B (35 slot đã có, 15 trống) => Sẽ báo trên LED: 15 / 50
DO $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..50 LOOP
        INSERT INTO public.parking_slots (slot_number, is_occupied, zone)
        VALUES ('B-' || LPAD(i::text, 3, '0'), (i <= 35), 'Khu B')
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;
