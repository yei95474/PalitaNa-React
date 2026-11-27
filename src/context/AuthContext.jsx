/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { demoSignIn, readLocal, writeLocal } from '../lib/demo.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => supabase ? null : readLocal('user', null));
    const [loading, setLoading] = useState(Boolean(supabase));
    const [recovery, setRecovery] = useState(false);

    useEffect(() => {
        if (!supabase) return;
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') setRecovery(true);
            setUser(session?.user ?? null);
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);

    async function authenticate({ email, password, fullName, username }, register) {
        if (!supabase) {
            const account = await demoSignIn({ email, password, fullName, username }, register);
            writeLocal('user', account);
            setUser(account);
            return true;
        }
        const { data, error } = register ? await supabase.auth.signUp({
            email, password,
            options: { data: { full_name: fullName, username }, emailRedirectTo: location.origin + '/login' },
        }) : await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return Boolean(data.session);
    }

    async function signOut() {
        if (supabase) {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } else {
            writeLocal('user', null);
            setUser(null);
        }
    }

    return <AuthContext.Provider value={{
        user, loading, authenticate, signOut, recovery, finishRecovery: () => setRecovery(false),
    }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
