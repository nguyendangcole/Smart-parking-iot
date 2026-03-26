import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    balance?: number;
}

export function useProfile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchProfileData(userId: string) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) {
                    console.error('[Profile] Database fetch error:', error);
                } else if (isMounted) {
                    console.log('[Profile] Data loaded for:', data.full_name);
                    setProfile(data);
                    setFetchError(null);
                }
            } catch (err: any) {
                console.error('[Profile] Unexpected fetch error:', err);
                if (isMounted) setFetchError(err.message || 'Network disconnected.');
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        async function initAuth() {
            try {
                console.log('[Profile] Checking session status...');
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                if (session?.user) {
                    await fetchProfileData(session.user.id);
                } else {
                    if (isMounted) {
                        setProfile(null);
                        setLoading(false);
                    }
                }
            } catch (err: any) {
                console.error('[Profile] Session init error:', err);
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Profile] Auth event detected:', event);
            if (session?.user) {
                await fetchProfileData(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                if (isMounted) {
                    setProfile(null);
                    setFetchError(null);
                    setLoading(false);
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const refreshProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                if (!error && data) {
                    setProfile(data);
                }
            } catch (err) {
                console.error('Failed to refresh profile', err);
            }
        }
    };

    return { profile, loading, logout, fetchError, refreshProfile };
}
