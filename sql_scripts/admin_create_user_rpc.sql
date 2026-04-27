-- Tự động hóa tính năng Admin tạo tài khoản User từ Frontend (Bypass thao tác bằng tay)
-- Chạy script này trong Supabase SQL Editor. 
-- Script tạo một RPC (Hàm SQL) để frontend gọi an toàn.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.create_user_admin(
    new_email TEXT,
    new_password TEXT,
    new_full_name TEXT,
    new_role TEXT,
    new_status TEXT DEFAULT 'active'
) RETURNS json AS $$
DECLARE
    new_id UUID;
    encrypted_pw TEXT;
    is_admin BOOLEAN;
BEGIN
    -- Kiểm tra xem người đang gội hàm có phải là admin không
    SELECT (role = 'admin') INTO is_admin FROM public.profiles WHERE id = auth.uid();
    IF NOT is_admin THEN
        RETURN json_build_object('success', false, 'message', 'Unauthorized: Only Admin can create users.');
    END IF;

    -- Tạo ID ngẫu nhiên
    new_id := gen_random_uuid();
    -- Mã hóa mật khẩu chuẩn Bcrypt của Supabase
    encrypted_pw := crypt(new_password, gen_salt('bf'));

    -- 1. Chèn vào bảng auth.users (Sẽ tự động trigger kích hoạt Insert vào profiles)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
        new_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', new_email, encrypted_pw, now(),
        now(), now(), '', '', '', ''
    );

    -- 2. Chèn vào auth.identities để có thể đăng nhập bằng email
    INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    VALUES (
        gen_random_uuid(), new_id, new_id::text, format('{"sub":"%s","email":"%s"}', new_id::text, new_email)::jsonb, 'email', now(), now(), now()
    );

    -- 3. Cập nhật các thông tin đầy đủ vào bảng profiles (trigger mới chỉ tạo name='')
    UPDATE public.profiles 
    SET 
        full_name = new_full_name, 
        role = new_role::user_role,
        status = new_status::user_status
    WHERE id = new_id;

    RETURN json_build_object('success', true, 'id', new_id, 'email', new_email);
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('success', false, 'message', 'Email already exists in system.');
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
