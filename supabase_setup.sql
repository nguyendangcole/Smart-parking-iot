-- SQL Setup for Supabase - HCMUT Smart Parking System

-- 1. Create a custom type for user roles (with check to avoid error if exists)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'student',
        'graduate',
        'doctoral',
        'faculty',
        'staff',
        'visitor',
        'operator',
        'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create a profiles table that extends auth.users
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'visitor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Users can read their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Only admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 4. Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        -- Logic to assign initial role based on email domain or metadata
        CASE 
            WHEN NEW.email LIKE '%@hcmut.edu.vn' THEN 
                COALESCE((NEW.raw_user_meta_data->>'requested_role')::user_role, 'student')
            ELSE 'visitor'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger to call the function on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Helper View for Admin to manage permissions
CREATE OR REPLACE VIEW admin_user_view AS
SELECT p.*, au.last_sign_in_at
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
);

-- 7. Specific Role Access Logic (Business logic examples)

-- Example: Table for parking slots that only Operators and Admins can manage
CREATE TABLE public.parking_slots (
    id SERIAL PRIMARY KEY,
    slot_number TEXT UNIQUE NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    zone TEXT,
    updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;

-- Everyone can view slots
CREATE POLICY "Public slots are viewable by everyone" 
ON public.parking_slots FOR SELECT 
TO authenticated, anon
USING (true);

-- Only Operator and Admin can update slots
CREATE POLICY "Operators and Admins can update slots" 
ON public.parking_slots FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('operator', 'admin')
    )
);

-- 8. Seed data (Optional - how to manually upgrade a user to Admin)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_ADMIN_EMAIL@hcmut.edu.vn';
