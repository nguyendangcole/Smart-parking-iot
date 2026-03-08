-- SCRIPT MOCK DATA SIÊU CHUẨN (FIX LỖI TRÙNG LẶP TRIGGER)
-- Chạy đoạn này để đảm bảo tài khoản hoạt động và phân quyền chính xác 100%

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    -- Mật khẩu hash chuẩn của "123456"
    pass_hash TEXT := '$2a$10$7EqJtq78FeRoPzGuOuuyDe3P/CwH.4065hPMs9EnC94.88o.at02W';
    
    u_record RECORD;
    new_user_id UUID;
BEGIN
    -- 1. Tạo bảng tạm chứa danh sách user cần thiết lập
    CREATE TEMP TABLE temp_users_to_init (
        email TEXT,
        full_name TEXT,
        role user_role
    ) ON COMMIT DROP;

    INSERT INTO temp_users_to_init VALUES 
    ('admin@hcmut.edu.vn', 'Hệ Thống Admin', 'admin'),
    ('operator@hcmut.edu.vn', 'Nhân Viên Vận Hành', 'operator'),
    ('sinhvien@hcmut.edu.vn', 'Nguyễn Văn A (Sinh Viên)', 'student'),
    ('giangvien@hcmut.edu.vn', 'Lê Thị B (Giảng Viên)', 'faculty'),
    ('canbo@hcmut.edu.vn', 'Trần Văn C (Cán Bộ)', 'staff'),
    ('guest@gmail.com', 'Khách Vãng Lai', 'visitor');

    -- 2. Lặp qua danh sách để khởi tạo
    FOR u_record IN SELECT * FROM temp_users_to_init LOOP
        -- Kiểm tra nếu user đã có trong auth.users
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = u_record.email) THEN
            new_user_id := gen_random_uuid();
            
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, encrypted_password, 
                email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
                created_at, updated_at, confirmation_token, is_super_admin
            )
            VALUES (
                '00000000-0000-0000-0000-000000000000', 
                new_user_id, 'authenticated', 'authenticated', u_record.email, 
                pass_hash, now(), '{"provider":"email","providers":["email"]}', 
                jsonb_build_object('full_name', u_record.full_name), 
                now(), now(), '', false
            );
        ELSE
            -- Lấy ID của user cũ và cập nhật mật khẩu
            SELECT id INTO new_user_id FROM auth.users WHERE email = u_record.email;
            UPDATE auth.users SET encrypted_password = pass_hash, updated_at = now() WHERE id = new_user_id;
        END IF;

        -- 3. CẬP NHẬT BẢNG PROFILES (Sử dụng ON CONFLICT để tránh lỗi Trigger)
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (new_user_id, u_record.email, u_record.full_name, u_record.role)
        ON CONFLICT (id) DO UPDATE 
        SET role = EXCLUDED.role, 
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email;
    END LOOP;

END $$;

-- THÔNG TIN BÃI XE (KHÔNG ĐỔI)
INSERT INTO public.parking_slots (slot_number, is_occupied, zone)
VALUES 
('A-01', false, 'Khu A - Tòa A1'),
('A-02', true, 'Khu A - Tòa A1'),
('A-03', false, 'Khu A - Tòa A2'),
('B-01', true, 'Khu B - Ký túc xá'),
('B-02', false, 'Khu B - Ký túc xá')
ON CONFLICT (slot_number) DO NOTHING;
