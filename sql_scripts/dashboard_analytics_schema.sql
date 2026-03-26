-- 1. Bảng lưu trữ phiên gửi xe (Sessions)
CREATE TABLE IF NOT EXISTS public.parking_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_id INTEGER REFERENCES public.parking_slots(id) ON DELETE SET NULL,
    vehicle_plate TEXT NOT NULL,
    vehicle_type TEXT DEFAULT 'car',
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'OVERDUE', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bảng lưu trữ giao dịch thanh toán (Payments/Transactions)
CREATE TABLE IF NOT EXISTS public.parking_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.parking_sessions(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'SUCCESS' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    payment_method TEXT DEFAULT 'E-Wallet',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.parking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin All Sessions" ON public.parking_sessions FOR ALL USING ( public.is_admin() );
CREATE POLICY "Admin All Transactions" ON public.parking_transactions FOR ALL USING ( public.is_admin() );

-- Public read for users to see their own
CREATE POLICY "User View Own Sessions" ON public.parking_sessions FOR SELECT USING ( auth.uid() IN (SELECT id FROM public.profiles WHERE role != 'admin') );

-- 3. Mock Data cho Dashboard (Bơm dữ liệu để Dashboard nhảy số lung linh)
INSERT INTO public.parking_sessions (vehicle_plate, vehicle_type, entry_time, status)
VALUES 
('51A-123.45', 'car', NOW() - INTERVAL '2 hours', 'ACTIVE'),
('59B-678.90', 'bike', NOW() - INTERVAL '4 hours', 'ACTIVE'),
('60C-445.55', 'car', NOW() - INTERVAL '1 hour', 'ACTIVE'),
('51D-999.00', 'car', NOW() - INTERVAL '30 mins', 'ACTIVE'),
('72E-111.22', 'car', NOW() - INTERVAL '5 hours', 'COMPLETED'),
('51F-333.44', 'bike', NOW() - INTERVAL '6 hours', 'COMPLETED'),
('59G-555.66', 'car', NOW() - INTERVAL '12 hours', 'COMPLETED'),
('60H-777.88', 'car', NOW() - INTERVAL '1 day', 'COMPLETED'),
('51K-999.11', 'car', NOW() - INTERVAL '2 days', 'COMPLETED');

INSERT INTO public.parking_transactions (amount, status, created_at, payment_method)
VALUES 
(25000, 'SUCCESS', NOW() - INTERVAL '1 hour', 'ZaloPay'),
(15000, 'SUCCESS', NOW() - INTERVAL '2 hours', 'Momo'),
(50000, 'SUCCESS', NOW() - INTERVAL '5 hours', 'Credit Card'),
(12000, 'PENDING', NOW() - INTERVAL '10 mins', 'Cash'),
(30000, 'FAILED', NOW() - INTERVAL '1 day', 'E-Wallet'),
(45000, 'SUCCESS', NOW() - INTERVAL '3 hours', 'Momo'),
(35000, 'SUCCESS', NOW() - INTERVAL '15 hours', 'ZaloPay'),
(20000, 'SUCCESS', NOW() - INTERVAL '1 day', 'Credit Card'),
(55000, 'SUCCESS', NOW() - INTERVAL '2 days', 'Cash'),
(100000, 'SUCCESS', NOW() - INTERVAL '3 days', 'ZaloPay'),
(15000, 'SUCCESS', NOW() - INTERVAL '1 hour', 'Momo'),
(28000, 'SUCCESS', NOW() - INTERVAL '4 hours', 'E-Wallet'),
(42000, 'SUCCESS', NOW() - INTERVAL '7 hours', 'ZaloPay'),
(120000, 'SUCCESS', NOW() - INTERVAL '1.5 days', 'Momo'),
(60000, 'SUCCESS', NOW() - INTERVAL '12 hours', 'Credit Card');
