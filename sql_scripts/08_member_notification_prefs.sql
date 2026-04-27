-- ================================================================
-- 08_MEMBER_NOTIFICATION_PREFS.SQL
-- Granular notification preferences for member accounts
-- (HCMUT Smart Parking)
--
-- What this script does:
--   1. Adds two boolean columns to `public.profiles` so the Settings
--      page can persist each notification toggle independently:
--        - notify_low_balance  (default TRUE)  — alert when wallet
--          balance falls below LOW_BALANCE_THRESHOLD (50,000 VND)
--        - notify_promotions   (default FALSE) — promotional offers,
--          parking deals, campus news. Opt-in by design so we don't
--          spam new sign-ups.
--   2. Backfills any pre-existing rows where the columns landed NULL
--      (e.g. from a partial migration on staging) so downstream code
--      can rely on plain boolean values without nullish-coalescing.
--   3. Reloads the PostgREST schema cache so the new columns show up
--      to the client immediately — no Supabase dashboard click needed.
--
-- The pre-existing `notifications_enabled` column (added in
-- 06_member_plan_renewal.sql) stays as the master kill-switch; these
-- new flags only matter when that one is TRUE. The client gates on
-- both, but the SQL doesn't need to enforce that — it's a UI concern.
--
-- Safe to run multiple times — every statement is idempotent.
-- Run order: 01_master_schema.sql -> 02_master_security.sql
--            -> 05_member_wallet.sql -> 06_member_plan_renewal.sql
--            -> 07_member_profile_avatar.sql
--            -> 08_member_notification_prefs.sql (this file).
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. New per-channel notification toggle columns on profiles.
--    Keeping them as BOOLEAN NOT NULL with sensible defaults means
--    the front-end never has to deal with `null` — every member has
--    a concrete on/off state from the moment their profile row is
--    created by the handle_new_user() trigger.
-- ----------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS notify_low_balance BOOLEAN DEFAULT true  NOT NULL,
    ADD COLUMN IF NOT EXISTS notify_promotions  BOOLEAN DEFAULT false NOT NULL;

-- Belt-and-braces: the DEFAULT clause covers every fresh INSERT, but
-- if an older migration path created the column without a default and
-- someone subsequently re-ran this script, NULLs could linger. Force
-- them to the spec'd defaults so the NOT NULL constraint sticks even
-- on those edge-case databases.
UPDATE public.profiles SET notify_low_balance = true  WHERE notify_low_balance IS NULL;
UPDATE public.profiles SET notify_promotions  = false WHERE notify_promotions  IS NULL;

-- ----------------------------------------------------------------
-- 2. Reload the PostgREST schema cache so the Settings screen can
--    immediately read/write the new columns without a manual
--    "Reload schema" click in the Supabase dashboard.
-- ----------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ================================================================
-- END OF 08_member_notification_prefs.sql
--
-- Quick sanity check (run as a signed-in member in the SQL editor):
--   SELECT id, notify_low_balance, notify_promotions
--   FROM public.profiles
--   WHERE id = auth.uid();
--
--   UPDATE public.profiles
--   SET notify_promotions = true
--   WHERE id = auth.uid();
-- ================================================================
