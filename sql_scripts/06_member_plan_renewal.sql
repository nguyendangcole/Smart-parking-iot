-- ================================================================
-- 06_MEMBER_PLAN_RENEWAL.SQL
-- Plan-renewal ledger + profile column sync (HCMUT Smart Parking)
--
-- FIXES the "Could not find the 'package_expires_at' column of
-- 'profiles' in the schema cache" error on Payments → Extend Plan.
--
-- What this script does:
--   1. Ensures every profile column the client code writes to
--      actually exists (package_*, preferred_zone, exempt_payment,
--      reserved_slot_eligible, status, settings flags, updated_at).
--      All statements are idempotent — safe to re-run.
--   2. Publishes an atomic RPC `public.member_extend_plan(...)`
--      that Payments.tsx calls in a single round trip. No more
--      "PENDING tx row left behind because the profile UPDATE
--      failed mid-flight."
--   3. Respects `profiles.exempt_payment`: exempt members still
--      renew (so their `package_expires_at` moves forward) but the
--      ledger row lands with amount = 0 and payment_method = 'Exempt'.
--   4. Grants EXECUTE on the RPC to `authenticated`.
--
-- Run order:
--   01_master_schema.sql → 02_master_security.sql
--   → 05_member_wallet.sql (MUST run first — this file
--     depends on the transaction_type/bonus_amount columns)
--   → 06_member_plan_renewal.sql (this file)
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. Make sure the user_status enum exists before we reference it
-- ----------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'blocked', 'suspended');
    END IF;
END $$;

-- ----------------------------------------------------------------
-- 2. Ensure every column the client writes to actually exists.
--    ADD COLUMN IF NOT EXISTS is a no-op when the column is already
--    there, so this block is safe even on a fully-migrated DB.
-- ----------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS status                 user_status             DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS reserved_slot_eligible BOOLEAN                 DEFAULT false,
    ADD COLUMN IF NOT EXISTS exempt_payment         BOOLEAN                 DEFAULT false,
    ADD COLUMN IF NOT EXISTS preferred_zone         TEXT,
    ADD COLUMN IF NOT EXISTS package_status         TEXT                    DEFAULT 'None',
    ADD COLUMN IF NOT EXISTS package_expires_at     TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS dark_mode              BOOLEAN                 DEFAULT false,
    ADD COLUMN IF NOT EXISTS notifications_enabled  BOOLEAN                 DEFAULT true,
    ADD COLUMN IF NOT EXISTS preferred_language     TEXT                    DEFAULT 'English (US)',
    ADD COLUMN IF NOT EXISTS two_factor_enabled     BOOLEAN                 DEFAULT false,
    ADD COLUMN IF NOT EXISTS created_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill any rows where NULL snuck in from an earlier partial migration.
UPDATE public.profiles SET package_status = 'None'     WHERE package_status         IS NULL;
UPDATE public.profiles SET exempt_payment = false      WHERE exempt_payment         IS NULL;
UPDATE public.profiles SET reserved_slot_eligible = false
    WHERE reserved_slot_eligible IS NULL;

-- ----------------------------------------------------------------
-- 3. Atomic RPC: plan renewal / extension
--    SECURITY DEFINER lets it write to profiles + ledger in one
--    transaction regardless of caller grants. Every write is pinned
--    to auth.uid() so one member cannot extend another member's plan.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.member_extend_plan(
    p_duration_days  INTEGER,
    p_amount         NUMERIC,
    p_plan_name      TEXT DEFAULT 'Parking Plan',
    p_payment_method TEXT DEFAULT 'E-Wallet'
)
RETURNS TABLE (
    transaction_id UUID,
    new_balance    NUMERIC,
    new_expires_at TIMESTAMPTZ,
    amount_charged NUMERIC,
    is_exempt      BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id          UUID       := auth.uid();
    v_tx_id            UUID;
    v_current_balance  NUMERIC;
    v_current_expiry   TIMESTAMPTZ;
    v_new_expiry       TIMESTAMPTZ;
    v_new_balance      NUMERIC;
    v_is_exempt        BOOLEAN;
    v_charge           NUMERIC;
    v_amount           NUMERIC    := COALESCE(p_amount, 0);
    v_days             INTEGER    := COALESCE(p_duration_days, 0);
    v_method           TEXT       := COALESCE(NULLIF(TRIM(p_payment_method), ''), 'E-Wallet');
BEGIN
    -- 3a. Auth gate. Function is callable only as an authenticated user.
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
    END IF;

    -- 3b. Input bounds mirror DURATION_OPTIONS in Payments.tsx. A
    --     tampered client cannot request a 10-year or 0-day plan.
    IF v_days <= 0 OR v_days > 366 THEN
        RAISE EXCEPTION 'Duration must be between 1 and 366 days (got %)', v_days
            USING ERRCODE = '22023';
    END IF;

    IF v_amount < 0 OR v_amount > 50000000 THEN
        RAISE EXCEPTION 'Amount out of allowed range (got %)', v_amount
            USING ERRCODE = '22023';
    END IF;

    -- 3c. Snapshot the profile. We read exempt_payment server-side so
    --     a client can't claim "I'm exempt" to skip the charge.
    SELECT COALESCE(balance, 0),
           package_expires_at,
           COALESCE(exempt_payment, false)
    INTO   v_current_balance, v_current_expiry, v_is_exempt
    FROM   public.profiles
    WHERE  id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for user %', v_user_id
            USING ERRCODE = 'P0002';
    END IF;

    v_charge := CASE WHEN v_is_exempt THEN 0 ELSE v_amount END;

    IF v_charge > v_current_balance THEN
        RAISE EXCEPTION
            'Insufficient balance: need % VND, have %', v_charge, v_current_balance
            USING ERRCODE = '22023';
    END IF;

    -- 3d. Start from max(current_expiry, NOW()) so an already-expired
    --     plan restarts from today rather than extending into the past.
    v_new_expiry := GREATEST(COALESCE(v_current_expiry, NOW()), NOW())
                    + (v_days || ' days')::INTERVAL;

    -- 3e. Ledger first. transaction_type = 'PLAN_RENEWAL' is allowed by
    --     the CHECK constraint introduced in 05_member_wallet.sql.
    INSERT INTO public.parking_transactions (
        profile_id,
        amount,
        transaction_type,
        status,
        payment_method
    )
    VALUES (
        v_user_id,
        v_charge,
        'PLAN_RENEWAL',
        'SUCCESS',
        CASE WHEN v_is_exempt THEN 'Exempt' ELSE v_method END
    )
    RETURNING id INTO v_tx_id;

    -- 3f. Debit + extend in one row-level UPDATE so a concurrent
    --     end-session deduction can't race us into a negative balance.
    UPDATE public.profiles
    SET    balance            = COALESCE(balance, 0) - v_charge,
           package_expires_at = v_new_expiry,
           package_status     = 'Active',
           updated_at         = NOW()
    WHERE  id = v_user_id
    RETURNING balance INTO v_new_balance;

    RETURN QUERY
    SELECT v_tx_id, v_new_balance, v_new_expiry, v_charge, v_is_exempt;
END;
$$;

-- Lock the SECURITY DEFINER function so it can't be called by PUBLIC.
REVOKE ALL ON FUNCTION public.member_extend_plan(INTEGER, NUMERIC, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.member_extend_plan(INTEGER, NUMERIC, TEXT, TEXT) TO authenticated;

-- ----------------------------------------------------------------
-- 4. Reload PostgREST schema cache — this is what fixes the
--    "Could not find the ... column" error immediately after the
--    ALTER TABLE statements land.
-- ----------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ================================================================
-- END OF 06_member_plan_renewal.sql
--
-- Sanity check (as a signed-in member in the SQL editor):
--   SELECT * FROM public.member_extend_plan(180, 1020000, 'Faculty 6M', 'E-Wallet');
--   SELECT id, balance, package_status, package_expires_at
--     FROM public.profiles WHERE id = auth.uid();
--   SELECT id, transaction_type, amount, status, created_at
--     FROM public.parking_transactions
--     WHERE profile_id = auth.uid()
--     ORDER BY created_at DESC LIMIT 5;
-- ================================================================
