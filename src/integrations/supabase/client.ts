import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbProduct {
    id: number;
    name: string;
    price: number;
    category: string;
    emoji: string;
    created_at?: string;
}

export interface DbProfile {
    id: string;
    name: string;
    role: 'owner' | 'admin' | 'customer';
    created_at?: string;
}

export interface DbOrder {
    id: string;
    user_id: string;
    items: Array<{ id: number; name: string; price: number; quantity: number; emoji: string }>;
    total: number;
    created_at?: string;
}
