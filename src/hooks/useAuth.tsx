import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

export type UserRole = 'owner' | 'admin' | 'customer';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password?: string) => Promise<void>;
    signUp: (name: string, email: string, password?: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
    getAllUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const OWNER_EMAIL = "mayurgunjal13@gmail.com";

// Helper to create user from Supabase auth user + profile
const createUserFromAuth = async (supabaseUser: SupabaseUser): Promise<User> => {
    const email = supabaseUser.email || '';

    // Try to get role from profiles table
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', supabaseUser.id)
            .single();

        if (profile) {
            return {
                id: supabaseUser.id,
                email: email,
                name: profile.name || supabaseUser.user_metadata?.name || email.split('@')[0] || 'User',
                role: profile.role as UserRole
            };
        }
    } catch (error) {
        console.error('Error fetching profile role:', error);
    }

    // Fallback if profile fetch fails
    return {
        id: supabaseUser.id,
        email: email,
        name: supabaseUser.user_metadata?.name || email.split('@')[0] || 'User',
        role: email === OWNER_EMAIL ? 'owner' : 'customer'
    };
};

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        console.log('AuthProvider: Setting up auth');

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, session: Session | null) => {
                console.log('Auth state changed:', event, session?.user?.email);

                if (!isMounted) return;

                if (session?.user) {
                    try {
                        const userProfile = await createUserFromAuth(session.user);
                        console.log('User profile created:', userProfile.email);
                        if (isMounted) {
                            setUser(userProfile);
                            setLoading(false);
                        }
                    } catch (error) {
                        console.error('Error creating user profile:', error);
                        if (isMounted) {
                            setUser(null);
                            setLoading(false);
                        }
                    }
                } else {
                    console.log('No user in session');
                    if (isMounted) {
                        setUser(null);
                        setLoading(false);
                    }
                }
            }
        );

        // Check for existing session
        const checkSession = async () => {
            try {
                console.log('AuthProvider: Checking for existing session');
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error getting session:', error);
                    if (isMounted) setLoading(false);
                    return;
                }

                if (session?.user) {
                    // Session exists, onAuthStateChange should have been called
                    // but let's also handle it here for safety
                    const userProfile = await createUserFromAuth(session.user);
                    console.log('AuthProvider: Session found, user:', userProfile.email);
                    if (isMounted) {
                        setUser(userProfile);
                        setLoading(false);
                    }
                } else {
                    console.log('AuthProvider: No existing session');
                    if (isMounted) setLoading(false);
                }
            } catch (error) {
                console.error('Auth init error:', error);
                if (isMounted) setLoading(false);
            }
        };

        checkSession();

        return () => {
            isMounted = false;
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

    const updateUserRole = async (userId: string, newRole: UserRole) => {
        // Only owner can update roles
        if (user?.role !== 'owner') {
            throw new Error("Only the owner can update user roles");
        }

        try {
            // Update role in profiles table
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) {
                console.error('Error updating role:', error);
                throw new Error(error.message);
            }
        } catch (err) {
            console.error('Failed to update user role:', err);
            throw err;
        }
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

    const value: AuthContextType = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateUserRole,
        getAllUsers
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
