-- MOCK DATA FOR TESTING ROLES
-- Copy paste these after you have created these users in Supabase Auth UI

-- 1. Upgrade a user to Admin
UPDATE public.profiles 
SET role = 'admin', full_name = 'Hệ Thống Admin'
WHERE email = 'admin@hcmut.edu.vn';

-- 2. Upgrade a user to Operator
UPDATE public.profiles 
SET role = 'operator', full_name = 'Nhân Viên Vận Hành 01'
WHERE email = 'operator@hcmut.edu.vn';

-- 3. Mock Students / Faculty
UPDATE public.profiles SET role = 'student', full_name = 'Nguyễn Văn A (Sinh Viên)' WHERE email = 'sinhvien@hcmut.edu.vn';
UPDATE public.profiles SET role = 'faculty', full_name = 'TS. Trần Văn B (Giảng Viên)' WHERE email = 'giangvien@hcmut.edu.vn';
UPDATE public.profiles SET role = 'staff', full_name = 'Chị Lan (Cán bộ PĐT)' WHERE email = 'canbo@hcmut.edu.vn';

-- 4. Visitor (Default role is already visitor, but can set name)
UPDATE public.profiles SET full_name = 'Khách Vãng Lai' WHERE email = 'guest@gmail.com';
