-- SCRIPT RESET MOCK DATA SIÊU CHUẨN (CHO HOSTED SUPABASE)
-- Chạy đoạn này trong SQL Editor để đảm bảo đăng nhập được 100%

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    -- Mật khẩu: 123456
    -- Đây là mã hash bcrypt chuẩn của "123456" với 10 rounds ($2a$10$...)
    -- Sử dụng hash cứng để tránh sai lệch giữa các phiên bản pgcrypto
    pass_hash TEXT := '$2a$10$7EqJtq78FeRoPzGuOuuyDe3P/CwH.4065hPMs9EnC94.88o.at02W';
    
    u_record RECORD;
    new_id UUID;
BEGIN
    -- 1. Dọn dẹp dữ liệu cũ để tránh xung đột
    DELETE FROM auth.users WHERE email LIKE '%@hcmut.edu.vn' OR email = 'guest@gmail.com';
    -- Bảng profiles sẽ tự xóa nhờ ON DELETE CASCADE (nếu đã thiết lập) hoặc ta xóa thủ công:
    DELETE FROM public.profiles WHERE email LIKE '%@hcmut.edu.vn' OR email = 'guest@gmail.com';

    -- 2. Tạo bảng tạm chứa danh sách user
    CREATE TEMP TABLE temp_users_list (
        email TEXT,
        full_name TEXT,
        role user_role
    ) ON COMMIT DROP;

    INSERT INTO temp_users_list VALUES 
    ('admin@hcmut.edu.vn', 'Hệ Thống Admin', 'admin'),
    ('operator@hcmut.edu.vn', 'Nhân Viên Vận Hành', 'operator'),
    ('sinhvien@hcmut.edu.vn', 'Nguyễn Văn A (Sinh Viên)', 'student'),
    ('giangvien@hcmut.edu.vn', 'Lê Thị B (Giảng Viên)', 'faculty'),
    ('canbo@hcmut.edu.vn', 'Trần Văn C (Cán Bộ)', 'staff'),
    ('guest@gmail.com', 'Khách Vãng Lai', 'visitor');

    -- 3. Lặp và chèn vào auth.users (với đầy đủ các cờ hệ thống)
    FOR u_record IN SELECT * FROM temp_users_list LOOP
        new_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, 
            id, 
            aud, 
            role, 
            email, 
            encrypted_password, 
            email_confirmed_at, 
            raw_app_meta_data, 
            raw_user_meta_data, 
            created_at, 
            updated_at, 
            confirmation_token, 
            is_super_admin,
            last_sign_in_at
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000', -- Mặc định cho hosted
            new_id,
            'authenticated',
            'authenticated',
            u_record.email,
            pass_hash,
            now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('full_name', u_record.full_name),
            now(),
            now(),
            '',
            false,
            now()
        );

        -- Chèn vào bảng profiles của bạn
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (new_id, u_record.email, u_record.full_name, u_record.role);
    END LOOP;

END $$;

-- Cập nhật lại bãi xe cho chắc chắn
INSERT INTO public.parking_slots (slot_number, is_occupied, zone)
VALUES 
('A-01', false, 'Khu A - Tòa A1'),
('A-02', true, 'Khu A - Tòa A1'),
('A-03', false, 'Khu A - Tòa A2'),
('B-01', true, 'Khu B - Ký túc xá'),
('B-02', false, 'Khu B - Ký túc xá'),
('C-01', false, 'Khu C - Thư viện')
ON CONFLICT (slot_number) DO NOTHING;
