-- ============================================================================
-- 04_member_mock_sessions.sql
--
-- Seeds a varied set of COMPLETED parking sessions for ONE member account
-- so the member Dashboard ("Last 7 Days" activity chart, Recent Parking
-- Sessions table) and the History screen render with realistic data.
--
-- Coverage: 2026-04-20  ->  2026-05-12  (Vietnam time, UTC+07)
--
-- Activity shape (28 sessions across 17 active days, 6 deliberate empty days):
--
--   Apr 20  Mon  : 1 session  (~2.0 h)
--   Apr 21  Tue  : 2 sessions (~5.0 h)
--   Apr 22  Wed  : 0
--   Apr 23  Thu  : 3 sessions (~6.5 h)   -- busiest day in the 7-day chart
--   Apr 24  Fri  : 2 sessions (~3.0 h)
--   Apr 25  Sat  : 1 session  (~1.0 h)
--   Apr 26  Sun  : 1 session  (~1.5 h)   -- today
--   Apr 27  Mon  : 2 sessions (~3.5 h)
--   Apr 28  Tue  : 1 session  (~1.5 h)
--   Apr 29  Wed  : 2 sessions (~4.0 h)
--   Apr 30  Thu  : 0
--   May 01  Fri  : 0   -- Labor Day
--   May 02  Sat  : 0
--   May 03  Sun  : 0
--   May 04  Mon  : 3 sessions (~6.0 h)
--   May 05  Tue  : 2 sessions (~3.5 h)
--   May 06  Wed  : 2 sessions (~4.0 h)
--   May 07  Thu  : 1 session  (~2.0 h)
--   May 08  Fri  : 2 sessions (~4.0 h)
--   May 09  Sat  : 1 session  (~1.5 h)
--   May 10  Sun  : 0
--   May 11  Mon  : 2 sessions (~4.0 h)
--   May 12  Tue  : 2 sessions (~3.5 h)
--
-- Fees follow the same 5,000 VND / started-hour rule the app used while
-- handleEndSession existed:   fee = MAX(5000, CEIL(hours) * 5000)
--
-- Usage:
--   1. Open Supabase Studio  ->  SQL Editor.
--   2. (Optional) Edit `target_email` or `target_user_id` below to force a
--      specific account. Leaving both NULL auto-targets the member with
--      the most existing parking_sessions rows (usually the active test
--      account you're logged in as).
--   3. Run the file. The first NOTICE prints the resolved user — confirm
--      that's the account you wanted before trusting the data. Re-running
--      is safe; previous mock rows (matched by the `MOCK-` plate prefix)
--      are deleted before re-inserting, so duplicates never accumulate.
--
--   To find your own user_id manually, run:
--      SELECT id, email, full_name FROM public.profiles
--      ORDER BY created_at DESC;
-- ============================================================================

DO $$
DECLARE
    -- Override knobs. Leave both NULL for auto-detection.
    target_email   TEXT := NULL;   -- e.g. 'giangvien@hcmut.edu.vn'
    target_user_id UUID := NULL;   -- e.g. 'a1b2c3d4-...'

    test_user_id    UUID;
    resolved_email  TEXT;
    resolved_name   TEXT;
    inserted_count  INTEGER;
BEGIN
    -- 1. Resolve the target user.
    --    Priority: explicit user_id  ->  explicit email
    --              ->  most-active member by session count
    --              ->  first non-admin profile.
    IF target_user_id IS NOT NULL THEN
        test_user_id := target_user_id;
    ELSIF target_email IS NOT NULL THEN
        SELECT id INTO test_user_id
        FROM public.profiles
        WHERE email = target_email
        LIMIT 1;
    END IF;

    IF test_user_id IS NULL THEN
        -- Pick whichever member already has the most parking_sessions
        -- rows (excluding our own MOCK seed, in case it ran for the
        -- wrong account previously). That's almost always the live
        -- test/demo account.
        SELECT user_id INTO test_user_id
        FROM public.parking_sessions
        WHERE user_id IS NOT NULL
          AND vehicle_plate NOT LIKE 'MOCK-%'
        GROUP BY user_id
        ORDER BY COUNT(*) DESC, MAX(entry_time) DESC NULLS LAST
        LIMIT 1;
    END IF;

    IF test_user_id IS NULL THEN
        SELECT id INTO test_user_id
        FROM public.profiles
        WHERE COALESCE(role, '') NOT IN ('admin', 'operator', 'visitor')
        ORDER BY created_at NULLS LAST
        LIMIT 1;
    END IF;

    IF test_user_id IS NULL THEN
        RAISE EXCEPTION
            'No member profile found to seed. Set target_email/target_user_id explicitly.';
    END IF;

    SELECT email, full_name INTO resolved_email, resolved_name
    FROM public.profiles
    WHERE id = test_user_id;

    RAISE NOTICE '------------------------------------------------------------';
    RAISE NOTICE 'Seeding parking_sessions for:';
    RAISE NOTICE '   user_id   = %', test_user_id;
    RAISE NOTICE '   email     = %', COALESCE(resolved_email, '<not in profiles>');
    RAISE NOTICE '   full_name = %', COALESCE(resolved_name,  '<not in profiles>');
    RAISE NOTICE '------------------------------------------------------------';

    -- 2. Wipe any previous run (sentinel plate prefix `MOCK-`). Real
    --    sessions written by the gate or the app are untouched.
    DELETE FROM public.parking_sessions
    WHERE user_id = test_user_id
      AND vehicle_plate LIKE 'MOCK-%';

    -- 3. Insert the Apr 20 -> May 12 window. All timestamps are written
    --    as TIMESTAMPTZ with an explicit `+07` offset so they map to the
    --    correct local calendar day in Vietnam regardless of the
    --    Postgres server timezone.
    INSERT INTO public.parking_sessions
        (user_id, vehicle_plate, entry_time, exit_time, zone_name, fee, status)
    VALUES
        ----------------------------------------------------------------
        --                       APRIL 2026
        ----------------------------------------------------------------
        -- Apr 20 Mon : 1 session
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-20 09:00:00+07', '2026-04-20 11:00:00+07',
         'B2 Building', 10000, 'COMPLETED'),

        -- Apr 21 Tue : 2 sessions
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-21 08:30:00+07', '2026-04-21 11:30:00+07',
         'Central Library', 15000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-21 14:00:00+07', '2026-04-21 16:00:00+07',
         'A1 Building', 10000, 'COMPLETED'),

        -- Apr 22 Wed : (empty — gap on the chart)

        -- Apr 23 Thu : 3 sessions  (busiest)
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-23 07:30:00+07', '2026-04-23 10:00:00+07',
         'B2 Building', 15000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-23 11:00:00+07', '2026-04-23 13:00:00+07',
         'H6 Building', 10000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-23 15:00:00+07', '2026-04-23 17:00:00+07',
         'Central Library', 10000, 'COMPLETED'),

        -- Apr 24 Fri : 2 sessions
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-24 09:00:00+07', '2026-04-24 10:30:00+07',
         'A1 Building', 10000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-24 14:00:00+07', '2026-04-24 15:30:00+07',
         'B2 Building', 10000, 'COMPLETED'),

        -- Apr 25 Sat : 1 short visit
        (test_user_id, 'MOCK-59B-678.90',
         '2026-04-25 10:00:00+07', '2026-04-25 11:00:00+07',
         'Central Library', 5000, 'COMPLETED'),

        -- Apr 26 Sun : 1 session (today)
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-26 09:00:00+07', '2026-04-26 10:30:00+07',
         'B2 Building', 10000, 'COMPLETED'),

        -- Apr 27 Mon : 2 sessions
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-27 08:00:00+07', '2026-04-27 10:00:00+07',
         'B2 Building', 10000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-27 14:30:00+07', '2026-04-27 16:00:00+07',
         'A1 Building', 10000, 'COMPLETED'),

        -- Apr 28 Tue : 1 session
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-28 09:30:00+07', '2026-04-28 11:00:00+07',
         'Central Library', 10000, 'COMPLETED'),

        -- Apr 29 Wed : 2 sessions
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-29 08:00:00+07', '2026-04-29 10:30:00+07',
         'B2 Building', 15000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-04-29 14:00:00+07', '2026-04-29 15:30:00+07',
         'H6 Building', 10000, 'COMPLETED'),

        -- Apr 30 Thu : (day off)

        ----------------------------------------------------------------
        --                       MAY 2026
        ----------------------------------------------------------------
        -- May 01 Fri : (Labor Day)
        -- May 02 Sat : (weekend off)
        -- May 03 Sun : (weekend off)

        -- May 04 Mon : 3 sessions  (back from long weekend)
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-04 07:30:00+07', '2026-05-04 09:30:00+07',
         'B2 Building', 10000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-04 10:30:00+07', '2026-05-04 12:30:00+07',
         'Central Library', 10000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-04 15:00:00+07', '2026-05-04 17:00:00+07',
         'A1 Building', 10000, 'COMPLETED'),

        -- May 05 Tue : 2 sessions
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-05 09:00:00+07', '2026-05-05 11:00:00+07',
         'B2 Building', 10000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-05 14:30:00+07', '2026-05-05 16:00:00+07',
         'H6 Building', 10000, 'COMPLETED'),

        -- May 06 Wed : 2 sessions
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-06 08:30:00+07', '2026-05-06 10:30:00+07',
         'Central Library', 10000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-06 13:00:00+07', '2026-05-06 15:00:00+07',
         'A1 Building', 10000, 'COMPLETED'),

        -- May 07 Thu : 1 session
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-07 09:00:00+07', '2026-05-07 11:00:00+07',
         'B2 Building', 10000, 'COMPLETED'),

        -- May 08 Fri : 2 sessions
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-08 08:00:00+07', '2026-05-08 10:30:00+07',
         'Central Library', 15000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-08 14:00:00+07', '2026-05-08 15:30:00+07',
         'B2 Building', 10000, 'COMPLETED'),

        -- May 09 Sat : 1 weekend visit
        (test_user_id, 'MOCK-59B-678.90',
         '2026-05-09 10:00:00+07', '2026-05-09 11:30:00+07',
         'A1 Building', 10000, 'COMPLETED'),

        -- May 10 Sun : (weekend off)

        -- May 11 Mon : 2 sessions
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-11 09:30:00+07', '2026-05-11 11:30:00+07',
         'B2 Building', 10000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-11 14:00:00+07', '2026-05-11 16:00:00+07',
         'H6 Building', 10000, 'COMPLETED'),

        -- May 12 Tue : 2 sessions
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-12 08:30:00+07', '2026-05-12 10:30:00+07',
         'Central Library', 10000, 'COMPLETED'),
        (test_user_id, 'MOCK-51A-123.45',
         '2026-05-12 14:00:00+07', '2026-05-12 15:30:00+07',
         'B2 Building', 10000, 'COMPLETED');

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RAISE NOTICE 'Inserted % mock parking sessions across Apr 20 -> May 12.', inserted_count;
END $$;

-- Quick sanity check (uncomment to inspect after running):
-- SELECT entry_time::date AS day, COUNT(*) AS sessions, SUM(fee) AS total_fee
-- FROM public.parking_sessions
-- WHERE vehicle_plate LIKE 'MOCK-%'
-- GROUP BY 1
-- ORDER BY 1;
