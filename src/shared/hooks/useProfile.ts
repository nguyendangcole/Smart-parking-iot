import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const fetchedId = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile(userId: string) {
      if (fetchedId.current === userId) return;
      fetchedId.current = userId;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (isMounted) {
          if (error) {
            setProfile(null);
            setFetchError(error.message);
          } else {
            setProfile(data);
            setFetchError(null);
          }
        }
      } catch (err: any) {
        if (isMounted) setFetchError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    // Khởi tạo
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setLoading(false);
        }
      }
    });

    // Theo dõi auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        if (event === 'SIGNED_IN' && session?.user) {
          loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setLoading(false);
          fetchedId.current = null;
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Cố định 100%, không bao giờ thay đổi thứ tự hook

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return { profile, loading, logout, fetchError };
}
