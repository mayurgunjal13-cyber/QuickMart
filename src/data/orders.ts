import { supabase, DbOrder } from "@/integrations/supabase/client";

export interface OrderItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    emoji: string;
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    total: number;
    createdAt: string;
}

// Convert DB order to app order
const toOrder = (dbOrder: DbOrder): Order => ({
    id: dbOrder.id,
    userId: dbOrder.user_id,
    items: dbOrder.items as OrderItem[],
    total: Number(dbOrder.total),
    createdAt: dbOrder.created_at || new Date().toISOString()
});

// Get orders for current user
export const getUserOrders = async (userId: string): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return (data || []).map(toOrder);
};

// Get all orders (for admin/owner)
export const getAllOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all orders:', error);
        return [];
    }

    return (data || []).map(toOrder);
};

// Create a new order
export const createOrder = async (userId: string, items: OrderItem[], total: number): Promise<Order | null> => {
    const { data, error } = await supabase
        .from('orders')
        .insert({
            user_id: userId,
            items: items,
            total: total
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating order:', error);
        return null;
    }

    return toOrder(data);
};
