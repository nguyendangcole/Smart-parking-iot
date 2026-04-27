-- Sửa lỗi recursion (truy vấn đệ quy vô hạn) do Policy của Admin trên bảng profiles
-- Chạy script này để fix bảng profile bị lỗi nhé

-- 1. Xóa policy gây lỗi đệ quy
DROP POLICY IF EXISTS "Admin Full Access Profiles" ON public.profiles;

-- 2. Đặt lại Policy chuần cho Profiles như ban đầu để Auth hoạt động (Ai cũng có thể đọc)
DROP POLICY IF EXISTS "Public Select" ON public.profiles;
CREATE POLICY "Public Select" ON public.profiles FOR SELECT USING (true);

-- 3. Cho phép owner tự update profile của mình
DROP POLICY IF EXISTS "Owner Update" ON public.profiles;
CREATE POLICY "Owner Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Tạo 1 function check admin không bị đệ quy khi gán vào policy
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Dùng security definer function để bypass RLS khi query check quyền
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Cho phép Admin toàn quyền CRUD trên bảng profiles mà không bị lỗi đệ quy
DROP POLICY IF EXISTS "Admin Full Access Profiles" ON public.profiles;
CREATE POLICY "Admin Full Access Profiles" ON public.profiles
FOR ALL
USING ( public.is_admin() );
