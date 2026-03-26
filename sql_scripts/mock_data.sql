-- SCRIPT RESET MOCK DATA PHỎNG THEO CƠ CHẾ SUPABASE AUTH CHUẨN (FIXED)
-- Chạy đoạn này để đảm bảo mật khẩu '123456' hoạt động 100%

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    -- Mật khẩu thử nghiệm
    test_pass TEXT := '123456';
    u_record RECORD;
    new_user_id UUID;
BEGIN
    -- 1. Xóa toàn bộ dữ liệu mẫu cũ để làm sạch (Admin, Operator, Student...)
    DELETE FROM auth.users WHERE email IN (
        'admin@hcmut.edu.vn', 
        'operator@hcmut.edu.vn', 
        'sinhvien@hcmut.edu.vn', 
        'giangvien@hcmut.edu.vn', 
        'canbo@hcmut.edu.vn', 
        'guest@gmail.com'
    );
    
    -- Xóa cả bên profiles cho chắc
    DELETE FROM public.profiles WHERE email IN (
        'admin@hcmut.edu.vn', 
        'operator@hcmut.edu.vn', 
        'sinhvien@hcmut.edu.vn', 
        'giangvien@hcmut.edu.vn', 
        'canbo@hcmut.edu.vn', 
        'guest@gmail.com'
    );

    -- 2. Tạo danh sách User mới
    CREATE TEMP TABLE temp_users_fix (
        email TEXT,
        full_name TEXT,
        role user_role
    ) ON COMMIT DROP;

    INSERT INTO temp_users_fix VALUES 
    ('admin@hcmut.edu.vn', 'System Admin', 'admin'),
    ('operator@hcmut.edu.vn', 'Nhân Viên Vận Hành', 'operator'),
    ('sinhvien@hcmut.edu.vn', 'Nguyễn Văn A (Sinh Viên)', 'student'),
    ('giangvien@hcmut.edu.vn', 'Lê Thị B (Giảng Viên)', 'faculty'),
    ('canbo@hcmut.edu.vn', 'Trần Văn C (Cán Bộ)', 'staff'),
    ('guest@gmail.com', 'Khách Vãng Lai', 'visitor');

    -- 3. Chèn vào auth.users sử dụng hàm crypt() của chính database
    FOR u_record IN SELECT * FROM temp_users_fix LOOP
        new_user_id := gen_random_uuid();
        
        -- Lưu ý: Không chèn vào cột confirmed_at vì nó là generated column ở một số phiên bản Supabase
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
            is_super_admin
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            u_record.email,
            crypt(test_pass, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('full_name', u_record.full_name),
            now(),
            now(),
            '',
            false
        );

        -- Chèn profile tương ứng (Sử dụng ON CONFLICT vì Trigger đã tự tạo Profile một phần)
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (new_user_id, u_record.email, u_record.full_name, u_record.role)
        ON CONFLICT (id) DO UPDATE 
        SET role = EXCLUDED.role, 
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email;
    END LOOP;

END $$;

-- THÔNG TIN BÃI XE
INSERT INTO public.parking_slots (slot_number, is_occupied, zone)
VALUES 
('A-01', false, 'Khu A - Tòa A1'),
('A-02', true, 'Khu A - Tòa A1'),
('A-03', false, 'Khu A - Tòa A2'),
('B-01', true, 'Khu B - Ký túc xá'),
('B-02', false, 'Khu B - Ký túc xá')
ON CONFLICT (slot_number) DO NOTHING;
