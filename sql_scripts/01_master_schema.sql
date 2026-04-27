-- ==========================================
-- 01_MASTER_SCHEMA.SQL (VERSION 2.0 - FULL)
-- Cấu trúc bảng TOÀN DIỆN & KHỚP 100% DASHBOARD
-- ==========================================

-- 1. Các kiểu dữ liệu Enum (Pricing & User Status)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'blocked', 'suspended');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_role') THEN
        CREATE TYPE pricing_role AS ENUM ('undergraduate', 'graduate', 'phd', 'faculty', 'staff', 'visitor_motorcycle', 'visitor_car', 'special_role');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_type') THEN
        CREATE TYPE pricing_type AS ENUM ('monthly', 'per_entry', 'handling_fee');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_status') THEN
        CREATE TYPE pricing_status AS ENUM ('draft', 'active', 'inactive', 'scheduled');
    END IF;
END $$;

-- 2. Bảng Profiles (Chứa đầy đủ 12 cột cho Quản lý User)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'student',
    status user_status DEFAULT 'active',
    reserved_slot_eligible BOOLEAN DEFAULT false,
    exempt_payment BOOLEAN DEFAULT false,
    preferred_zone TEXT,
    package_status TEXT DEFAULT 'None',
    package_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bảng Bãi đỗ xe (Parking)
CREATE TABLE IF NOT EXISTS public.parking_slots (
    id SERIAL PRIMARY KEY,
    slot_number TEXT NOT NULL UNIQUE,
    is_occupied BOOLEAN DEFAULT FALSE,
    zone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parking_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slot_id INTEGER REFERENCES public.parking_slots(id) ON DELETE SET NULL,
    vehicle_plate TEXT NOT NULL,
    vehicle_type TEXT DEFAULT 'car',
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'OVERDUE', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parking_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.parking_sessions(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'SUCCESS' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    payment_method TEXT DEFAULT 'E-Wallet',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng Chính sách giá & Logs
CREATE TABLE IF NOT EXISTS public.pricing_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    role pricing_role NOT NULL,
    type pricing_type NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_exemption BOOLEAN DEFAULT false,
    exemption_discount_percent NUMERIC(5, 2) DEFAULT 0,
    status pricing_status DEFAULT 'draft',
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pricing_policy_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES public.pricing_policies(id),
    action VARCHAR(50) NOT NULL, -- 'CREATED', 'ACTIVATED', 'DEACTIVATED'
    old_status pricing_status,
    new_status pricing_status,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bảng Biển báo LED (Signage)
CREATE TABLE IF NOT EXISTS public.signage_displays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    display_id TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    linked_zone TEXT,
    header_text TEXT DEFAULT 'WELCOME TO HCMUT',
    marquee_message TEXT DEFAULT 'PLEASE DRIVE SLOWLY',
    theme_color TEXT DEFAULT 'orange',
    status TEXT DEFAULT 'OPEN',
    is_emergency BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bảng Thiết bị IoT
CREATE TABLE IF NOT EXISTS public.iot_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sensor', 'camera', 'barrier', 'controller')),
    zone TEXT,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'OFFLINE', 'DELAYED', 'MAINTENANCE', 'ERROR')),
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    battery_level INTEGER,
    signal_strength INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.iot_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID REFERENCES public.iot_devices(id) ON DELETE CASCADE,
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
    description TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'IGNORED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 7. Bảng Nhật ký Audit
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    status TEXT DEFAULT 'SUCCESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
