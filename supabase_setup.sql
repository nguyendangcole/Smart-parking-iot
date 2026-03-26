-- ==============================================================================
-- BƯỚC 1: PRISTINE SETUP CHO PROJECT SUPABASE MỚI (CHUẨN 100%)
-- Chạy script này ĐẦU TIÊN trong Supabase SQL Editor của project mới
-- ==============================================================================

-- 1. Tạo Enum và Bảng Profiles
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'student', 'graduate', 'doctoral', 'faculty', 
            'staff', 'visitor', 'operator', 'admin'
        );
    END IF;
END $$;

-- Tạo bảng profiles để lưu thông tin người dùng và phân quyền
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'visitor',
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảo mật RLS (Mở rộng cho tất cả)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select" ON public.profiles;
CREATE POLICY "Public Select" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owner Update" ON public.profiles;
CREATE POLICY "Owner Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Đặt Trigger TỰ ĐỘNG (Xịn & An Toàn)
-- Mỗi khi bạn tạo user mới trong phần Authentication, Trigger này sẽ tự lưu vào bảng profiles
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, '', 'student');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Tạo dữ liệu Bãi đỗ xe luôn
CREATE TABLE IF NOT EXISTS public.parking_slots (
    id SERIAL PRIMARY KEY,
    slot_number TEXT UNIQUE NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    zone TEXT
);
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View Slots" ON public.parking_slots;
CREATE POLICY "View Slots" ON public.parking_slots FOR SELECT USING (true);

INSERT INTO public.parking_slots (slot_number, is_occupied, zone)
VALUES 
    ('A-01', false, 'Khu A'), 
    ('A-02', true, 'Khu A'), 
    ('B-01', false, 'Khu B')
ON CONFLICT (slot_number) DO NOTHING;

-- ==============================================================================
-- BƯỚC 2: HƯỚNG DẪN TẠO TÀI KHOẢN (LÀM TAY TRÊN SUPABASE)
-- ==============================================================================
/*
Vào mục Authentication -> Users -> Add User -> Create new user.
Tạo lần lượt các user sau (mật khẩu đều là 123456) và nhớ tick [x] Auto Confirm User:
1. admin@hcmut.edu.vn
2. operator@hcmut.edu.vn
3. giangvien@hcmut.edu.vn
4. canbo@hcmut.edu.vn
5. sinhvien@hcmut.edu.vn
6. guest@gmail.com
*/

-- ==============================================================================
-- BƯỚC 3: PHÂN QUYỀN SAU KHI TẠO XONG (CHẠY CUỐI CÙNG)
-- Chạy đoạn này trong SQL Editor sau khi đã tạo tay các tài khoản xong
-- ==============================================================================

UPDATE public.profiles SET role = 'admin', full_name = 'Hệ Thống Admin' WHERE email = 'admin@hcmut.edu.vn';
UPDATE public.profiles SET role = 'operator', full_name = 'Trực Tổng Đài' WHERE email = 'operator@hcmut.edu.vn';
UPDATE public.profiles SET role = 'faculty', full_name = 'Giảng Viên B' WHERE email = 'giangvien@hcmut.edu.vn';
UPDATE public.profiles SET role = 'staff', full_name = 'Trần Văn C' WHERE email = 'canbo@hcmut.edu.vn';
UPDATE public.profiles SET role = 'student', full_name = 'Nguyễn Văn A' WHERE email = 'sinhvien@hcmut.edu.vn';
UPDATE public.profiles SET role = 'visitor', full_name = 'Khách Vãng Lai' WHERE email = 'guest@gmail.com';
