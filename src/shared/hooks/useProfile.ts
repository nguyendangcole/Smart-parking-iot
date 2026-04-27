import { useSyncExternalStore } from 'react';
import { supabase } from '../supabase';

// The profiles row has grown over time across several migrations
// (01_master_schema, users_schema_update, settings_schema,
// 07_member_profile_avatar). The required fields are typed strictly;
// the rest are optional so old mock rows and environments missing
// newer columns still validate.
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  balance?: number | null;
  status?: string | null;
  reserved_slot_eligible?: boolean | null;
  exempt_payment?: boolean | null;
  preferred_zone?: string | null;
  package_status?: string | null;
  package_expires_at?: string | null;
  avatar_url?: string | null;
  dark_mode?: boolean | null;
  notifications_enabled?: boolean | null;
  // Granular notification toggles surfaced on the Settings page.
  // Added in sql_scripts/08_member_notification_prefs.sql; we keep
  // them optional in the interface so consumers running against an
  // older DB without the migration still type-check.
  notify_low_balance?: boolean | null;
  notify_promotions?: boolean | null;
  preferred_language?: string | null;
  two_factor_enabled?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// ---------------------------------------------------------------------------
// Module-level shared store
//
// Why this is module-level instead of per-component useState:
//
// Roughly 20 components in the app call useProfile() — Sidebar, Settings,
// Dashboard, History, Payments, etc. If each one held its own copy of the
// profile, mutating it on the Settings screen (e.g. saving a new full_name
// or avatar) would only refresh that one screen. Every other screen would
// keep showing the stale value until a hard reload.
//
// By keeping the snapshot in a module variable and using useSyncExternalStore
// to subscribe, every consumer gets the SAME object reference and re-renders
// the moment any caller mutates it. The public hook API is unchanged so no
// other file needs to be touched.
// ---------------------------------------------------------------------------

interface ProfileSnapshot {
  profile: Profile | null;
  loading: boolean;
  fetchError: string | null;
}

let snapshot: ProfileSnapshot = {
  profile: null,
  loading: true,
  fetchError: null
};

const subscribers = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function getSnapshot(): ProfileSnapshot {
  return snapshot;
}

// Always allocate a fresh object so useSyncExternalStore sees a new reference
// and schedules re-renders for every subscriber.
function setSnapshot(patch: Partial<ProfileSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  subscribers.forEach(cb => cb());
}

// `activeUserId` mirrors the old `fetchedId` ref — it lets us skip a
// network round-trip when the same user is already loaded and the caller
// didn't explicitly request a force-refresh (e.g. Supabase fires SIGNED_IN
// on every token refresh too).
let activeUserId: string | null = null;

async function loadProfile(userId: string, force = false): Promise<void> {
  if (!force && activeUserId === userId && snapshot.profile?.id === userId) {
    return;
  }
  activeUserId = userId;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      setSnapshot({ profile: null, fetchError: error.message, loading: false });
      return;
    }
    setSnapshot({ profile: data as Profile, fetchError: null, loading: false });
  } catch (err: any) {
    setSnapshot({
      fetchError: err?.message || 'Failed to load profile',
      loading: false
    });
  }
}

// One-shot init: kick off the initial getSession() + subscribe to auth
// state changes the first time any component calls useProfile(). Using a
// promise guard makes this idempotent under React strict-mode double-mount
// and module HMR.
let initPromise: Promise<void> | null = null;

function ensureInitialized(): void {
  if (initPromise) return;

  initPromise = (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadProfile(session.user.id);
    } else {
      setSnapshot({ loading: false });
    }
  })();

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      // Don't force here — same-user token refreshes shouldn't trigger an
      // extra round-trip. A real "different user signed in" still passes
      // the activeUserId guard inside loadProfile().
      loadProfile(session.user.id);
    } else if (event === 'SIGNED_OUT') {
      activeUserId = null;
      setSnapshot({ profile: null, fetchError: null, loading: false });
    }
  });
}

// Manually refetch the current user's profile. Callers use this after a
// mutation (top-up, plan extension, profile edit, avatar upload) to pull
// fresh data without waiting for a realtime event.
async function refreshProfile(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    await loadProfile(session.user.id, true);
  }
}

async function logout(): Promise<void> {
  await supabase.auth.signOut();
  window.location.href = '/';
}

export function useProfile() {
  ensureInitialized();
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    profile: state.profile,
    loading: state.loading,
    fetchError: state.fetchError,
    logout,
    refreshProfile
  };
}
