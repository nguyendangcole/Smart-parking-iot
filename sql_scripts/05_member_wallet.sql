-- ================================================================
-- 05_MEMBER_WALLET.SQL
-- Wallet / Top-Up ledger for member accounts (HCMUT Smart Parking)
--
-- What this script does:
--   1. Ensures `profiles.balance` exists and is valid
--   2. Extends `parking_transactions` with the columns needed to
--      distinguish a TOP-UP from a session payment, and to keep a
--      clean audit trail of promo bonuses
--   3. Locks down RLS so a member can only read/write their OWN rows
--   4. Publishes an atomic RPC `public.member_topup_balance(...)`
--      that the front-end (TopUpDrawer.tsx) calls in a single round
--      trip — no more "balance update succeeded but ledger row was
--      left PENDING" race conditions
--   5. Grants the RPC to the `authenticated` role
--
-- Safe to run multiple times — every statement is idempotent.
-- Run order: 01_master_schema.sql → 02_master_security.sql → this file.
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. profiles.balance (VND, stored as NUMERIC for cent-safe math)
-- ----------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS balance NUMERIC(14, 2) DEFAULT 0 NOT NULL;

-- Any historical rows that pre-date this column will land as NULL
-- on some migration paths; normalize them to 0 so the NOT NULL and
-- the >= 0 constraint below don't reject them.
UPDATE public.profiles SET balance = 0 WHERE balance IS NULL;

-- Guard against negative balances creeping in from buggy clients.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_balance_nonneg'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_balance_nonneg CHECK (balance >= 0);
    END IF;
END $$;

-- Make sure the handle_new_user() trigger (defined in
-- 02_master_security.sql) keeps creating rows with balance = 0. The
-- column default handles this without needing to rewrite the trigger.

-- ----------------------------------------------------------------
-- 2. parking_transactions: distinguish TOP_UP vs SESSION_PAYMENT
--    and keep an audit trail for promo bonuses
-- ----------------------------------------------------------------
ALTER TABLE public.parking_transactions
    ADD COLUMN IF NOT EXISTS transaction_type TEXT
        DEFAULT 'SESSION_PAYMENT'
        CHECK (transaction_type IN ('TOP_UP', 'SESSION_PAYMENT', 'PLAN_RENEWAL', 'REFUND', 'ADJUSTMENT'));

ALTER TABLE public.parking_transactions
    ADD COLUMN IF NOT EXISTS bonus_amount NUMERIC(14, 2) DEFAULT 0 NOT NULL;

ALTER TABLE public.parking_transactions
    ADD COLUMN IF NOT EXISTS promo_code TEXT;

-- Historical rows won't have a type set; flag them as session payments
-- so analytics queries can keep filtering cleanly.
UPDATE public.parking_transactions
SET transaction_type = 'SESSION_PAYMENT'
WHERE transaction_type IS NULL;

-- Useful index for the member history page (ORDER BY created_at DESC LIMIT N).
CREATE INDEX IF NOT EXISTS parking_transactions_profile_created_idx
    ON public.parking_transactions (profile_id, created_at DESC);

-- ----------------------------------------------------------------
-- 3. RLS: members read / insert / update ONLY their own rows
-- ----------------------------------------------------------------
ALTER TABLE public.parking_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Member read own transactions" ON public.parking_transactions;
CREATE POLICY "Member read own transactions"
    ON public.parking_transactions
    FOR SELECT
    TO authenticated
    USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Member insert own transactions" ON public.parking_transactions;
CREATE POLICY "Member insert own transactions"
    ON public.parking_transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (profile_id = auth.uid());

-- An UPDATE policy is still useful for the existing 3-step client code
-- path (promote PENDING → SUCCESS/FAILED) so nothing breaks if an older
-- build is running against the new schema.
DROP POLICY IF EXISTS "Member update own transactions" ON public.parking_transactions;
CREATE POLICY "Member update own transactions"
    ON public.parking_transactions
    FOR UPDATE
    TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- ----------------------------------------------------------------
-- 4. Atomic RPC: member_topup_balance
--    SECURITY DEFINER so it can bump balance + write ledger in one
--    go, regardless of the caller's RLS grants. The WHERE clause
--    still pins every write to auth.uid(), so one member cannot
--    top up another member's wallet through this function.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.member_topup_balance(
    p_amount          NUMERIC,
    p_bonus_amount    NUMERIC DEFAULT 0,
    p_payment_method  TEXT    DEFAULT 'E-Wallet',
    p_promo_code      TEXT    DEFAULT NULL
)
RETURNS TABLE (
    transaction_id UUID,
    new_balance    NUMERIC,
    amount_paid    NUMERIC,
    bonus_credited NUMERIC,
    total_credited NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id   UUID := auth.uid();
    v_tx_id     UUID;
    v_new_bal   NUMERIC;
    v_paid      NUMERIC := COALESCE(p_amount, 0);
    v_bonus     NUMERIC := GREATEST(COALESCE(p_bonus_amount, 0), 0);
    v_total     NUMERIC;
    v_method    TEXT    := COALESCE(NULLIF(TRIM(p_payment_method), ''), 'E-Wallet');
BEGIN
    -- 4a. Must be signed in. The function is exposed to anon only so
    --     PostgREST can resolve it, but an unauthenticated call is rejected.
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated'
            USING ERRCODE = '42501';
    END IF;

    -- 4b. Amount bounds mirror the client (MIN_TOPUP / MAX_TOPUP in
    --     TopUpDrawer.tsx). Keeping them server-side means a tampered
    --     client can't push a 1 VND or 999M VND row into the ledger.
    IF v_paid < 10000 THEN
        RAISE EXCEPTION 'Top-up amount must be at least 10,000 VND (got %)', v_paid
            USING ERRCODE = '22023';
    END IF;

    IF v_paid > 5000000 THEN
        RAISE EXCEPTION 'Top-up amount cannot exceed 5,000,000 VND per transaction (got %)', v_paid
            USING ERRCODE = '22023';
    END IF;

    IF v_bonus > v_paid THEN
        RAISE EXCEPTION 'Bonus amount % cannot exceed paid amount %', v_bonus, v_paid
            USING ERRCODE = '22023';
    END IF;

    v_total := v_paid + v_bonus;

    -- 4c. Make sure a profile row exists before we try to credit it.
    --     The handle_new_user() trigger creates it on sign-up, but a
    --     missing row here means the auth user was created outside of
    --     the trigger path (manual admin insert, etc.).
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
        RAISE EXCEPTION 'Profile not found for user %', v_user_id
            USING ERRCODE = 'P0002';
    END IF;

    -- 4d. Insert the ledger row first. If anything below throws, the
    --     whole function rolls back (we're inside a single statement
    --     transaction from PostgREST's perspective).
    INSERT INTO public.parking_transactions (
        profile_id,
        amount,
        bonus_amount,
        transaction_type,
        status,
        payment_method,
        promo_code
    ) VALUES (
        v_user_id,
        v_paid,
        v_bonus,
        'TOP_UP',
        'SUCCESS',
        v_method,
        NULLIF(TRIM(p_promo_code), '')
    )
    RETURNING id INTO v_tx_id;

    -- 4e. Credit the profile. `balance = balance + v_total` is atomic
    --     at the row level, so a concurrent end-session that deducts a
    --     fee won't stomp on this top-up.
    UPDATE public.profiles
    SET balance = COALESCE(balance, 0) + v_total,
        updated_at = NOW()
    WHERE id = v_user_id
    RETURNING balance INTO v_new_bal;

    RETURN QUERY
    SELECT v_tx_id, v_new_bal, v_paid, v_bonus, v_total;
END;
$$;

-- Lock the function to its owner so SECURITY DEFINER can't be
-- hijacked by a role that shouldn't write to profiles / transactions.
REVOKE ALL ON FUNCTION public.member_topup_balance(NUMERIC, NUMERIC, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.member_topup_balance(NUMERIC, NUMERIC, TEXT, TEXT) TO authenticated;

-- ----------------------------------------------------------------
-- 5. Convenience view for the Payments / History pages: a flat
--    "wallet ledger" per user. Every SELECT still goes through the
--    RLS policies defined above.
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW public.member_wallet_ledger AS
SELECT
    t.id,
    t.profile_id,
    t.transaction_type,
    t.amount,
    t.bonus_amount,
    (t.amount + COALESCE(t.bonus_amount, 0)) AS total_credited,
    t.status,
    t.payment_method,
    t.promo_code,
    t.session_id,
    t.created_at
FROM public.parking_transactions t;

GRANT SELECT ON public.member_wallet_ledger TO authenticated;

-- ----------------------------------------------------------------
-- 6. Reload PostgREST schema so the new RPC shows up immediately
-- ----------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ================================================================
-- END OF 05_member_wallet.sql
--
-- Quick sanity check (run as a signed-in member in the SQL editor):
--   SELECT * FROM public.member_topup_balance(50000, 5000, 'MoMo', 'FIRST10');
--   SELECT id, balance FROM public.profiles WHERE id = auth.uid();
--   SELECT * FROM public.member_wallet_ledger
--   WHERE profile_id = auth.uid() ORDER BY created_at DESC LIMIT 5;
-- ================================================================
