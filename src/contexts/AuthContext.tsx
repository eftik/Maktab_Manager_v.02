import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

type AdminRole = 'owner' | 'admin';

interface AdminInfo {
  role: AdminRole;
  schoolId: string | null;
  displayName: string;
}

interface AuthCtx {
  user: User | null;
  admin: AdminInfo | null;
  loading: boolean;
  isOwner: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const fetchAdmin = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('admins')
      .select('role, school_id, display_name')
      .eq('user_id', userId)
      .single();
    if (data) {
      setAdmin({ role: data.role, schoolId: data.school_id, displayName: data.display_name });
    } else {
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    // Get initial session once
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) await fetchAdmin(u.id);
      setLoading(false);
      initializedRef.current = true;
    });

    // Listen for subsequent auth changes only
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!initializedRef.current) return; // Skip initial event, we handle it above
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchAdmin(u.id);
      } else {
        setAdmin(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAdmin]);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ user, admin, loading, isOwner: admin?.role === 'owner', signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth outside provider');
  return c;
};
