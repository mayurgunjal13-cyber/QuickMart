import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

export type UserRole = 'owner' | 'admin' | 'customer';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

const OWNER_EMAIL = "mayurgunjal13@gmail.com";

// Helper to create user from Supabase auth user (no DB call needed)
const createUserFromAuth = (supabaseUser: SupabaseUser): User => {
    const email = supabaseUser.email || '';
    return {
        id: supabaseUser.id,
        email: email,
        name: supabaseUser.user_metadata?.name || email.split('@')[0] || 'User',
        role: email === OWNER_EMAIL ? 'owner' : 'customer'
    };
};

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser(createUserFromAuth(session.user));
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth init error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, session: Session | null) => {
                console.log('Auth state changed:', event);

                if (session?.user) {
                    setUser(createUserFromAuth(session.user));
                } else {
                    setUser(null);
                }

                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password?: string) => {
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: password || ''
            });

            if (error) {
                setLoading(false);
                throw new Error(error.message);
            }

            // Auth state change listener will set the user
        } catch (err) {
            setLoading(false);
            throw err;
        }
    };

    const signUp = async (name: string, email: string, password?: string) => {
        setLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password: password || '',
                options: {
                    data: {
                        name: name
                    }
                }
            });

            if (error) {
                setLoading(false);
                throw new Error(error.message);
            }

            // Auth state change listener will set the user
        } catch (err) {
            setLoading(false);
            throw err;
        }
    };

    const signOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
    };

    const updateUserRole = async (_userId: string, _newRole: UserRole) => {
        // Only owner can update roles
        if (user?.role !== 'owner') {
            throw new Error("Only the owner can update user roles");
        }

        // For now, roles are determined by email only
        // To enable dynamic roles, you'd need to fix the profiles table RLS
        throw new Error("Role updates require fixing profiles table RLS policies");
    };

    const getAllUsers = async (): Promise<User[]> => {
        // Only owner and admin can get all users
        if (user?.role !== 'owner' && user?.role !== 'admin') {
            return [];
        }

        try {
            // Query profiles table to get all users
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, name, role');

            if (error) {
                console.error('Error fetching all users:', error);
                return [];
            }

            // Get auth users to get emails
            // Since we can't access auth.users directly, map profiles without email
            return (profiles || []).map(profile => ({
                id: profile.id,
                email: '', // Email not available in profiles table
                name: profile.name || 'User',
                role: profile.role as UserRole
            }));
        } catch (error) {
            console.error('Failed to fetch users:', error);
            return [];
        }
    };

    return {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateUserRole,
        getAllUsers
    };
}
