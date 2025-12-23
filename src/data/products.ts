import { supabase, DbProduct } from "@/integrations/supabase/client";

export interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    emoji: string;
}

// Convert DB product to app product
const toProduct = (dbProduct: DbProduct): Product => ({
    id: dbProduct.id,
    name: dbProduct.name,
    price: Number(dbProduct.price),
    category: dbProduct.category,
    emoji: dbProduct.emoji || ''
});

// Get all products from Supabase
export const getProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id');

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return (data || []).map(toProduct);
};

// Get categories from products
export const getCategories = async (): Promise<string[]> => {
    const products = await getProducts();
    return [...new Set(products.map(p => p.category))];
};

// Add a new product
export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product | null> => {
    const { data, error } = await supabase
        .from('products')
        .insert({
            name: product.name,
            price: product.price,
            category: product.category,
            emoji: product.emoji
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding product:', error);
        return null;
    }

    return toProduct(data);
};

// Update an existing product
export const updateProduct = async (id: number, updates: Partial<Omit<Product, 'id'>>): Promise<Product | null> => {
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating product:', error);
        return null;
    }

    return toProduct(data);
};

// Delete a product
export const deleteProduct = async (id: number): Promise<boolean> => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting product:', error);
        return false;
    }

    return true;
};

// Subscribe to real-time product changes
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
    // Initial fetch
    getProducts().then(callback);

    // Subscribe to changes
    const subscription = supabase
        .channel('products_changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'products' },
            async () => {
                // Refetch all products on any change
                const products = await getProducts();
                callback(products);
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        subscription.unsubscribe();
    };
};
