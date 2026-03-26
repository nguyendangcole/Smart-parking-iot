-- Add settings columns to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'English (US)',
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
