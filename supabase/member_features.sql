-- SUPABASE SQL SCHEMA FOR MEMBER FEATURES
-- Features: My Vehicles, Parking History, Policies & RLS

-- 1. Enable REQUIRED Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plate_number TEXT NOT NULL,
    vehicle_type TEXT DEFAULT 'bike', -- 'bike' or 'car'
    model_name TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE PARKING SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.parking_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vehicle_plate TEXT NOT NULL,
    zone_name TEXT NOT NULL,
    entry_time TIMESTAMPTZ DEFAULT now(),
    exit_time TIMESTAMPTZ,
    fee NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Ongoing', -- 'Ongoing', 'Completed', 'Cancelled'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. GRANT PERMISSIONS (Allow Authenticated Users to interact with tables)
GRANT ALL ON TABLE public.vehicles TO authenticated;
GRANT ALL ON TABLE public.parking_sessions TO authenticated;

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_sessions ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES (Users manage their OWN data only)
DROP POLICY IF EXISTS "Users can manage their own vehicles" ON public.vehicles;
CREATE POLICY "Users can manage their own vehicles" 
ON public.vehicles FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.parking_sessions;
CREATE POLICY "Users can manage their own sessions" 
ON public.parking_sessions FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Note: Ensure profiles table exists for balance/policy tracking
-- If profiles table is needed:
-- CREATE TABLE IF NOT EXISTS public.profiles (
--    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
--    full_name TEXT,
--    role TEXT DEFAULT 'Visitor',
--    balance NUMERIC DEFAULT 0,
--    exempt_payment BOOLEAN DEFAULT false,
--    package_expires_at TIMESTAMPTZ,
--    package_status TEXT DEFAULT 'None'
-- );
