-- FORCE RE-SET MOCK USERS WITH NEW PASSWORD (123456)
-- Chạy đoạn mã này trong Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    admin_id UUID := gen_random_uuid();
    operator_id UUID := gen_random_uuid();
    student_id UUID := gen_random_uuid();
    faculty_id UUID := gen_random_uuid();
    -- Mật khẩu mới theo yêu cầu: 123456
    pass TEXT := '123456';
BEGIN
    -- 1. TẠO ADMIN (admin@hcmut.edu.vn / 123456)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@hcmut.edu.vn') THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
        VALUES (admin_id, 'admin@hcmut.edu.vn', crypt(pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hệ Thống Admin"}', now(), now(), 'authenticated', 'authenticated', '')
        RETURNING id INTO admin_id;
    ELSE
        SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@hcmut.edu.vn';
        UPDATE auth.users SET encrypted_password = crypt(pass, gen_salt('bf')), updated_at = now() WHERE id = admin_id;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (admin_id, 'admin@hcmut.edu.vn', 'Hệ Thống Admin', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Hệ Thống Admin';

    -- 2. TẠO OPERATOR (operator@hcmut.edu.vn / 123456)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'operator@hcmut.edu.vn') THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
        VALUES (operator_id, 'operator@hcmut.edu.vn', crypt(pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nhân Viên Vận Hành"}', now(), now(), 'authenticated', 'authenticated', '')
        RETURNING id INTO operator_id;
    ELSE
        SELECT id INTO operator_id FROM auth.users WHERE email = 'operator@hcmut.edu.vn';
        UPDATE auth.users SET encrypted_password = crypt(pass, gen_salt('bf')), updated_at = now() WHERE id = operator_id;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (operator_id, 'operator@hcmut.edu.vn', 'Nhân Viên Vận Hành', 'operator')
    ON CONFLICT (id) DO UPDATE SET role = 'operator', full_name = 'Nhân Viên Vận Hành';

    -- 3. TẠO SINH VIÊN (sinhvien@hcmut.edu.vn / 123456)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sinhvien@hcmut.edu.vn') THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token)
        VALUES (student_id, 'sinhvien@hcmut.edu.vn', crypt(pass, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nguyễn Văn A (Sinh Viên)"}', now(), now(), 'authenticated', 'authenticated', '')
        RETURNING id INTO student_id;
    ELSE
        SELECT id INTO student_id FROM auth.users WHERE email = 'sinhvien@hcmut.edu.vn';
        UPDATE auth.users SET encrypted_password = crypt(pass, gen_salt('bf')), updated_at = now() WHERE id = student_id;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (student_id, 'sinhvien@hcmut.edu.vn', 'Nguyễn Văn A (Sinh Viên)', 'student')
    ON CONFLICT (id) DO UPDATE SET role = 'student', full_name = 'Nguyễn Văn A (Sinh Viên)';

END $$;

-- THÊM DỮ LIỆU BÃI XE
INSERT INTO public.parking_slots (slot_number, is_occupied, zone)
VALUES 
('A-01', false, 'Khu A - Tòa A1'),
('A-02', true, 'Khu A - Tòa A1'),
('A-03', false, 'Khu A - Tòa A2'),
('B-01', true, 'Khu B - Ký túc xá'),
('B-02', false, 'Khu B - Ký túc xá')
ON CONFLICT (slot_number) DO NOTHING;
