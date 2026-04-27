-- ================================================================
-- 07_MEMBER_PROFILE_AVATAR.SQL
-- Profile picture (avatar) backend for HCMUT Smart Parking
--
-- What this script does:
--   1. Adds the `avatar_url` column to `public.profiles` so the
--      Settings screen can persist whatever picture the member just
--      uploaded.
--   2. Provisions the Supabase Storage bucket `avatars` (public,
--      2 MB cap, image MIME types only) used by Settings.tsx.
--   3. Locks down RLS on `storage.objects` so a member can only
--      write / overwrite / delete files under their OWN folder
--      (`{user_id}/...`), while reads stay public so the member's
--      avatar can be served from a stable CDN URL.
--   4. Reloads the PostgREST schema cache so the new column shows
--      up to the client immediately.
--
-- Safe to run multiple times — every statement is idempotent.
-- Run order: 01_master_schema.sql -> 02_master_security.sql
--            -> 05_member_wallet.sql -> 06_member_plan_renewal.sql
--            -> 07_member_profile_avatar.sql (this file).
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. profiles.avatar_url
--    Stores the public Storage URL of the member's current avatar.
--    NULL means "no custom picture, fall back to initials" — this
--    is what the Settings / Sidebar UI already does today.
-- ----------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ----------------------------------------------------------------
-- 2. Storage bucket: `avatars`
--    - public = true so we can hand the client a stable getPublicUrl()
--      instead of minting a signed URL on every render.
--    - file_size_limit = 2 MiB. Larger uploads get rejected by
--      Storage before they ever hit our quota.
--    - allowed_mime_types restricts to common web image formats.
--      A user trying to sneak in a PDF or HTML file is bounced.
-- ----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152,                                          -- 2 MiB
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------
-- 3. RLS on storage.objects (scoped to the `avatars` bucket only)
--
--    Convention: every avatar lives at `{user_id}/{filename}` so
--    `(storage.foldername(name))[1]` returns the owner's UUID as
--    text. Comparing that to `auth.uid()::text` gives us a clean
--    "owner only" guard for INSERT / UPDATE / DELETE.
--
--    SELECT stays wide open so the picture can be served from the
--    public CDN URL stored in profiles.avatar_url — same pattern
--    Supabase recommends for user avatars.
--
--    NOTE: we deliberately do NOT run
--        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
--    here. As of recent Supabase platform updates, `storage.objects`
--    is owned by the `supabase_storage_admin` role, so even the SQL
--    editor's `postgres` user gets `ERROR: 42501: must be owner of
--    table objects` when toggling RLS on it. RLS is already enabled
--    by default on every Supabase project, and CREATE/DROP POLICY
--    against this table is explicitly granted to `postgres` — so the
--    statements below work fine without the ALTER.
-- ----------------------------------------------------------------

-- 3a. Public read access to anything in the avatars bucket
DROP POLICY IF EXISTS "Avatars: public read" ON storage.objects;
CREATE POLICY "Avatars: public read"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

-- 3b. A signed-in member may upload INTO their own folder only
DROP POLICY IF EXISTS "Avatars: owner upload" ON storage.objects;
CREATE POLICY "Avatars: owner upload"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 3c. ...and may overwrite / replace files inside that same folder
DROP POLICY IF EXISTS "Avatars: owner update" ON storage.objects;
CREATE POLICY "Avatars: owner update"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 3d. ...and delete (used when replacing an old avatar with a new one)
DROP POLICY IF EXISTS "Avatars: owner delete" ON storage.objects;
CREATE POLICY "Avatars: owner delete"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ----------------------------------------------------------------
-- 4. Reload PostgREST schema cache so `avatar_url` is queryable
--    from the JS client without restarting the API.
-- ----------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ================================================================
-- END OF 07_member_profile_avatar.sql
--
-- Sanity check (as a signed-in member in the SQL editor):
--   SELECT id, avatar_url FROM public.profiles WHERE id = auth.uid();
--   SELECT id, public, file_size_limit, allowed_mime_types
--     FROM storage.buckets WHERE id = 'avatars';
--   SELECT policyname FROM pg_policies
--     WHERE schemaname = 'storage' AND tablename = 'objects'
--       AND policyname LIKE 'Avatars:%';
-- ================================================================
