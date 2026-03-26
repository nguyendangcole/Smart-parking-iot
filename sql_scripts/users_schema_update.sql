-- Cập nhật schema cho trang Quản lý Người Dùng & Phân quyền (User Management)
-- Chạy script này trong Supabase SQL Editor để thêm các cột quản lý cần thiết vào bảng profiles

-- 1. Tạo Enum cho trạng thái người dùng (nếu chưa có)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'blocked', 'suspended');
    END IF;
END $$;

-- 2. Thêm các cột cho bảng profiles hiện tại
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS reserved_slot_eligible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS exempt_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_zone TEXT,
ADD COLUMN IF NOT EXISTS package_status TEXT DEFAULT 'None',
ADD COLUMN IF NOT EXISTS package_expires_at TIMESTAMP WITH TIME ZONE;

-- 3. Tạo Policy cho Admin thao tác CRUD tự do trên bảng profile (Cập nhật quyền nếu cần)
DROP POLICY IF EXISTS "Admin Full Access Profiles" ON public.profiles;
CREATE POLICY "Admin Full Access Profiles" ON public.profiles
FOR ALL 
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- 4. Tạo một view ảo hiển thị các user có data mock package if necessary
-- (Chỉ để Test, Update các user hiện tại thành có package)
UPDATE public.profiles
SET 
  status = 'active',
  package_status = 'Active',
  package_expires_at = NOW() + INTERVAL '30 days'
WHERE email = 'sinhvien@hcmut.edu.vn';

UPDATE public.profiles
SET 
  exempt_payment = true,
  reserved_slot_eligible = true,
  preferred_zone = 'Khu A'
WHERE email = 'giangvien@hcmut.edu.vn';

UPDATE public.profiles
SET 
  status = 'blocked'
WHERE email = 'guest@gmail.com';
