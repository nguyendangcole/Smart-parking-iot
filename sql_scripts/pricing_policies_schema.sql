-- ==============================================================================
-- DATABASE SCHEMA CHO PRICING POLICY
-- ==============================================================================

-- 1. Enum cho các loại Role và Type
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_role') THEN
        CREATE TYPE pricing_role AS ENUM (
            'undergraduate', 'graduate', 'phd', 'faculty', 
            'staff', 'visitor_motorcycle', 'visitor_car', 'special_role'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_type') THEN
        CREATE TYPE pricing_type AS ENUM (
            'monthly', 'per_entry', 'handling_fee'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_status') THEN
        CREATE TYPE pricing_status AS ENUM (
            'draft', 'active', 'inactive', 'scheduled'
        );
    END IF;
END $$;

-- 2. Bảng Pricing Policies
CREATE TABLE IF NOT EXISTS public.pricing_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role pricing_role NOT NULL,
    type pricing_type NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_exemption BOOLEAN DEFAULT false, -- Ví dụ: Faculty free, hoặc policy giảm giá đặc biệt
    exemption_discount_percent NUMERIC(5, 2) DEFAULT 0 CHECK (exemption_discount_percent >= 0 AND exemption_discount_percent <= 100),
    status pricing_status DEFAULT 'draft',
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE,
    version INT DEFAULT 1,
    parent_policy_id UUID REFERENCES public.pricing_policies(id) ON DELETE SET NULL, -- Để tracking version history / clone
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Bảng pricing_policies
ALTER TABLE public.pricing_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Select Policies" ON public.pricing_policies FOR SELECT USING (true);
CREATE POLICY "Admin All Policies" ON public.pricing_policies FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Bảng Logs / Lịch sử thay đổi (Audit log)
CREATE TABLE IF NOT EXISTS public.pricing_policy_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES public.pricing_policies(id),
    action VARCHAR(50) NOT NULL, -- e.g. 'CREATED', 'ACTIVATED', 'DEACTIVATED', 'UPDATED'
    old_status pricing_status,
    new_status pricing_status,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Constraint ngăn việc có 2 policy active/scheduled cùng lúc cho cùng role và type
CREATE UNIQUE INDEX idx_one_active_policy_per_role_type 
ON public.pricing_policies (role, type) 
WHERE status = 'active';

-- function check chồng lấn thời gian (overlapping effective dates) cho scheduled/active
CREATE OR REPLACE FUNCTION protect_active_policy_overlap() 
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status IN ('active', 'scheduled')) THEN
        IF EXISTS (
            SELECT 1 FROM public.pricing_policies 
            WHERE role = NEW.role 
              AND type = NEW.type 
              AND status IN ('active', 'scheduled')
              AND id != NEW.id
              AND (
                (NEW.effective_to IS NULL AND effective_to IS NULL) OR
                (NEW.effective_from <= coalesce(effective_to, 'infinity'::timestamp) AND coalesce(NEW.effective_to, 'infinity'::timestamp) >= effective_from)
              )
        ) THEN
            RAISE EXCEPTION 'Thời gian hiệu lực bị chồng chéo với một policy (active/scheduled) khác cho cùng Role và Type.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_policy_overlap ON public.pricing_policies;
CREATE TRIGGER trg_protect_policy_overlap
    BEFORE INSERT OR UPDATE ON public.pricing_policies
    FOR EACH ROW EXECUTE PROCEDURE protect_active_policy_overlap();

-- 5. Trigger không cho xoá nếu policy đã được sử dụng hoặc active (chỉ cho phép deactivate chuyển status)
CREATE OR REPLACE FUNCTION prevent_policy_deletion() 
RETURNS TRIGGER AS $$
BEGIN
    -- Thêm logic kiểm tra nếu policy_id nằm trong bảng giao dịch (transactions)
    -- Giả sử ta có bảng parking_transactions(policy_id) ...
    -- IF EXISTS (SELECT 1 FROM public.parking_transactions WHERE policy_id = OLD.id) THEN
    --     RAISE EXCEPTION 'Không thể xoá policy đã được sử dụng trong giao dịch. Vui lòng chuyển trạng thái sang inactive.';
    -- END IF;
    
    IF OLD.status IN ('active', 'inactive') THEN
         RAISE EXCEPTION 'Không thể xoá policy đã từng được kích hoạt. Vui lòng cập nhật trạng thái thành inactive thay vì xoá.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_policy_delete ON public.pricing_policies;
CREATE TRIGGER trg_prevent_policy_delete
    BEFORE DELETE ON public.pricing_policies
    FOR EACH ROW EXECUTE PROCEDURE prevent_policy_deletion();
