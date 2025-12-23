import { useState, useEffect } from "react";
import { supabase, DbProfile } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

export type UserRole = 'owner' | 'admin' | 'customer';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

const OWNER_EMAIL = "mayurgunjal13@gmail.com";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch profile from Supabase
    const fetchProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // If profile doesn't exist yet (race condition), create it
                if (error.code === 'PGRST116') {
                    const newProfile = {
                        id: supabaseUser.id,
                        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
                        role: supabaseUser.email === OWNER_EMAIL ? 'owner' : 'customer'
                    };

                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert(newProfile);

                    if (!insertError) {
                        return {
                            id: supabaseUser.id,
                            email: supabaseUser.email || '',
                            name: newProfile.name,
                            role: newProfile.role as UserRole
                        };
                    }
                }
                return null;
            }

            return {
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: profile.name || supabaseUser.email?.split('@')[0] || 'User',
                role: (profile.role || 'customer') as UserRole
            };
        } catch (err) {
            console.error('Error in fetchProfile:', err);
            return null;
        }
    };

    useEffect(() => {
        // Get initial session
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    const profile = await fetchProfile(session.user);
                    setUser(profile);
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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);

            if (event === 'SIGNED_IN' && session?.user) {
                const profile = await fetchProfile(session.user);
                setUser(profile);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }

            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password?: string) => {
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: password || ''
        });

        if (error) {
            setLoading(false);
            throw new Error(error.message);
        }

        if (data.user) {
            const profile = await fetchProfile(data.user);
            setUser(profile);
        }

        setLoading(false);
    };

    const signUp = async (name: string, email: string, password?: string) => {
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
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

        // Note: Profile is created automatically by database trigger
        if (data.user) {
            // Wait a bit for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 500));
            const profile = await fetchProfile(data.user);
            setUser(profile);
        }

        setLoading(false);
    };

    const signOut = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
    };

    const updateUserRole = async (userId: string, newRole: UserRole) => {
        // Only owner can update roles
        if (user?.role !== 'owner') {
            throw new Error("Only the owner can update user roles");
        }

        // Get the user's email to check if it's the owner
        const { data: targetProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        // For safety, we check the profile role
        if (targetProfile?.role === 'owner') {
            throw new Error("Cannot change owner's role");
        }

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            throw new Error(error.message);
        }
    };

    const getAllUsers = async (): Promise<User[]> => {
        // Only owner and admin can get all users
        if (user?.role !== 'owner' && user?.role !== 'admin') {
            return [];
        }

        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*');

        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }

        return profiles.map((profile: DbProfile) => ({
            id: profile.id,
            email: '', // Email not stored in profiles for privacy
            name: profile.name || 'User',
            role: profile.role as UserRole
        }));
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
