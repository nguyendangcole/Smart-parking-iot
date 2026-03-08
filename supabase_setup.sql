-- FINAL AUTH FIX (HCMUT Smart Parking)
-- Bản này sử dụng cơ chế hash nội tại của Database để đảm bảo 123456 hoạt động

-- 1. Setup cấu trúc cơ bản
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'student', 'graduate', 'doctoral', 'faculty', 
            'staff', 'visitor', 'operator', 'admin'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reset RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON public.profiles;
CREATE POLICY "public_select" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "owner_update" ON public.profiles;
CREATE POLICY "owner_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. TẠO TÀI KHOẢN VỚI HÀM CRYPT NỘI TẠI (Dứt điểm lỗi 400)
-- Chúng ta dùng ID ngẫu nhiên và KHÔNG dùng hash dán sẵn
DO $$
DECLARE
    admin_id UUID := gen_random_uuid();
    op_id UUID := gen_random_uuid();
    sv_id UUID := gen_random_uuid();
    -- Mật khẩu text thuần túy để database tự mã hóa
    raw_pass TEXT := '123456';
BEGIN
    -- Xóa cũ để chèn mới
    DELETE FROM auth.users WHERE email IN ('admin@hcmut.edu.vn', 'operator@hcmut.edu.vn', 'sinhvien@hcmut.edu.vn');

    -- ADMIN
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, is_super_admin)
    VALUES (
        admin_id, 'authenticated', 'authenticated', 'admin@hcmut.edu.vn', 
        crypt(raw_pass, gen_salt('bf')), -- Database tự tạo muối và hash
        now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hệ Thống Admin"}', 
        now(), now(), '', false
    );
    INSERT INTO public.profiles (id, email, full_name, role) VALUES (admin_id, 'admin@hcmut.edu.vn', 'Hệ Thống Admin', 'admin');

    -- OPERATOR
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, is_super_admin)
    VALUES (
        op_id, 'authenticated', 'authenticated', 'operator@hcmut.edu.vn', 
        crypt(raw_pass, gen_salt('bf')), 
        now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nhân Viên Vận Hành"}', 
        now(), now(), '', false
    );
    INSERT INTO public.profiles (id, email, full_name, role) VALUES (op_id, 'operator@hcmut.edu.vn', 'Nhân Viên Vận Hành', 'operator');

    -- SINH VIÊN
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, is_super_admin)
    VALUES (
        sv_id, 'authenticated', 'authenticated', 'sinhvien@hcmut.edu.vn', 
        crypt(raw_pass, gen_salt('bf')), 
        now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nguyễn Văn A (SV)"}', 
        now(), now(), '', false
    );
    INSERT INTO public.profiles (id, email, full_name, role) VALUES (sv_id, 'sinhvien@hcmut.edu.vn', 'Nguyễn Văn A (SV)', 'student');

END $$;

-- 3. CƯỚC PHÍ / BÃI XE (KHÔNG ĐỔI)
CREATE TABLE IF NOT EXISTS public.parking_slots (
    id SERIAL PRIMARY KEY,
    slot_number TEXT UNIQUE NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    zone TEXT
);
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_slots" ON public.parking_slots;
CREATE POLICY "select_slots" ON public.parking_slots FOR SELECT USING (true);
