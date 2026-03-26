-- SCRIPT XÓA VÀ FIX LỖI ĐỆ QUY RLS (INFINITE RECURSION)
-- Chạy script này trong Supabase SQL Editor

-- 1. Xóa TẤT CẢ các chính sách RLS cũ trên bảng profiles (để loại bỏ thủ phạm gây đệ quy)
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. Tắt và Bật lại tính năng RLS cho sạch sẽ
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Cài đặt lại chính sách đơn giản nhất, không bao giờ bị đệ quy
CREATE POLICY "Allow Select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow Insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow Update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow Delete" ON public.profiles FOR DELETE USING (auth.uid() = id);
