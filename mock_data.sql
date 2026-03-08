-- FORCE INSERT MOCK USERS INTO SUPABASE AUTH AND PUBLIC PROFILES
-- Chạy đoạn mã này trong Supabase SQL Editor để tạo dữ liệu test ngay lập tức

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    admin_id UUID := gen_random_uuid();
    operator_id UUID := gen_random_uuid();
    student_id UUID := gen_random_uuid();
    faculty_id UUID := gen_random_uuid();
BEGIN
    -- 1. TẠO ADMIN (admin@hcmut.edu.vn / 12345678)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (
        admin_id, 
        'admin@hcmut.edu.vn', 
        crypt('12345678', gen_salt('bf')), 
        now(), 
        '{"provider":"email","providers":["email"]}', 
        '{"full_name":"Hệ Thống Admin"}', 
        now(), now(), 'authenticated', 'authenticated', ''
    ) ON CONFLICT (email) DO NOTHING;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (admin_id, 'admin@hcmut.edu.vn', 'Hệ Thống Admin', 'admin')
    ON CONFLICT (email) DO UPDATE SET role = 'admin', full_name = 'Hệ Thống Admin';

    -- 2. TẠO OPERATOR (operator@hcmut.edu.vn / 12345678)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (
        operator_id, 
        'operator@hcmut.edu.vn', 
        crypt('12345678', gen_salt('bf')), 
        now(), 
        '{"provider":"email","providers":["email"]}', 
        '{"full_name":"Nhân Viên Vận Hành"}', 
        now(), now(), 'authenticated', 'authenticated', ''
    ) ON CONFLICT (email) DO NOTHING;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (operator_id, 'operator@hcmut.edu.vn', 'Nhân Viên Vận Hành', 'operator')
    ON CONFLICT (email) DO UPDATE SET role = 'operator', full_name = 'Nhân Viên Vận Hành';

    -- 3. TẠO SINH VIÊN (sinhvien@hcmut.edu.vn / 12345678)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (
        student_id, 
        'sinhvien@hcmut.edu.vn', 
        crypt('12345678', gen_salt('bf')), 
        now(), 
        '{"provider":"email","providers":["email"]}', 
        '{"full_name":"Nguyễn Văn A (Sinh Viên)"}', 
        now(), now(), 'authenticated', 'authenticated', ''
    ) ON CONFLICT (email) DO NOTHING;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (student_id, 'sinhvien@hcmut.edu.vn', 'Nguyễn Văn A (Sinh Viên)', 'student')
    ON CONFLICT (email) DO UPDATE SET role = 'student', full_name = 'Nguyễn Văn A (Sinh Viên)';

    -- 4. TẠO GIẢNG VIÊN (giangvien@hcmut.edu.vn / 12345678)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
    VALUES (
        faculty_id, 
        'giangvien@hcmut.edu.vn', 
        crypt('12345678', gen_salt('bf')), 
        now(), 
        '{"provider":"email","providers":["email"]}', 
        '{"full_name":"TS. Trần Văn B (Giảng Viên)"}', 
        now(), now(), 'authenticated', 'authenticated', ''
    ) ON CONFLICT (email) DO NOTHING;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (faculty_id, 'giangvien@hcmut.edu.vn', 'TS. Trần Văn B (Giảng Viên)', 'faculty')
    ON CONFLICT (email) DO UPDATE SET role = 'faculty', full_name = 'TS. Trần Văn B (Giảng Viên)';

END $$;

-- THÊM DỮ LIỆU BÃI XE (Bảng này không cần User)
INSERT INTO public.parking_slots (slot_number, is_occupied, zone)
VALUES 
('A-01', false, 'Khu A - Tòa A1'),
('A-02', true, 'Khu A - Tòa A1'),
('A-03', false, 'Khu A - Tòa A2'),
('B-01', true, 'Khu B - Ký túc xá'),
('B-02', false, 'Khu B - Ký túc xá')
ON CONFLICT (slot_number) DO NOTHING;
