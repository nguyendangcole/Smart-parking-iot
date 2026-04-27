-- ===========================================
-- 02_MASTER_SECURITY.SQL
-- Bảo mật TOÀN DIỆN & Fix lỗi 500
-- ===========================================

-- 1. RESET SEARCH PATH CHUẨN SUPABASE (BƯỚC CHỐT HẠ)
ALTER DATABASE postgres SET search_path TO public, auth, extensions;
ALTER ROLE authenticator SET search_path TO public, auth, extensions;
ALTER ROLE postgres SET search_path TO public, auth, extensions;
ALTER ROLE anon SET search_path TO public, auth, extensions;
ALTER ROLE authenticated SET search_path TO public, auth, extensions;

-- 2. CẤP QUYỀN TRUY CẬP SCHEMA
GRANT USAGE ON SCHEMA public, auth, extensions TO postgres, service_role, authenticator, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 3. CƠ CHẾ TRIGGER TỰ ĐỘNG CHO PROFILES (PHẢI CÀI ĐẦU TIÊN)
-- Sau này mỗi khi add user trên auth, profiles sẽ tự nhảy
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (NEW.id, NEW.email, '', 'student', 'active');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. CHÍNH SÁCH BẢO MẬT (RLS) - DÙNG TRUY VẤN TRỰC TIẾP
-- Tránh gọi hàm external như is_admin() để bảo vệ khỏi lỗi Search Path

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Select Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Admin Full Access Profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Owner Edit Own Profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Parking RLS
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone see slots" ON public.parking_slots FOR SELECT USING (true);
CREATE POLICY "Admin All Slots" ON public.parking_slots FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin All Sessions" ON public.parking_sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin All Transactions" ON public.parking_transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- IoT & Signage RLS
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signage_displays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin All Devices" ON public.iot_devices FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin All Incidents" ON public.iot_incidents FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin All Signage" ON public.signage_displays FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Public read signage" ON public.signage_displays FOR SELECT USING (true);

-- Pricing RLS
ALTER TABLE public.pricing_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_policy_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read pricing" ON public.pricing_policies FOR SELECT USING (true);
CREATE POLICY "Admin manage pricing" ON public.pricing_policies FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Audit Logs RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin view audit" ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Insert Audit" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 5. PHÂN QUYỀN TRỰC TIẾP CHO CÁC ROLE (VẬN HÀNH) - Tùy chỉnh thêm nếu cần
-- Chúng ta cấp quyền cho "authenticator" để PostgREST luôn hoạt động
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticator;

-- 6. RESET BỘ NHỚ ĐỆM API
NOTIFY pgrst, 'reload schema';
