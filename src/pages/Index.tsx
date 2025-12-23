import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Store, Filter, LogIn, LogOut, History, User, Shield } from "lucide-react";
import { subscribeToProducts, Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import Cart from "@/components/Cart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

interface CartItem extends Product {
    quantity: number;
}

const Index = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartBounce, setCartBounce] = useState(false);
    const [userName, setUserName] = useState("");
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const { user, signOut, loading } = useAuth();
    const navigate = useNavigate();

    // Track visitor on page load
    useVisitorTracking('/');

    const location = useLocation();

    // Subscribe to real-time product updates
    useEffect(() => {
        const unsubscribe = subscribeToProducts((loadedProducts) => {
            setProducts(loadedProducts);
            const cats = [...new Set(loadedProducts.map(p => p.category))];
            setCategories(cats);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    // Check for clear cart signal from Bill page
    useEffect(() => {
        if (location.state && (location.state as any).clearCart) {
            setCartItems([]);
            // Clear the state so refreshing doesn't clear it again (optional but good practice)
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // Redirect to auth if not logged in
    useEffect(() => {
        if (!loading && !user) {
            navigate('/auth');
        }
    }, [user, loading, navigate]);

    // Check if user has shop access - simplified to use role from localStorage auth
    useEffect(() => {
        if (user) {
            // All logged-in users have access to shop (owner, admin, customer)
            // This replaces the Supabase mock check
            setHasAccess(true);
        } else {
            setHasAccess(null);
        }
    }, [user]);

    // Get user's name from localStorage auth
    useEffect(() => {
        if (user) {
            // Use the name from our localStorage auth system
            setUserName(user.name || user.email?.split('@')[0] || 'Customer');
        }
    }, [user]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = product.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesCategory =
                !selectedCategory || product.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, selectedCategory, products]);

    const handleAddToCart = (product: Product) => {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });

        // Trigger bounce animation
        setCartBounce(true);
        setTimeout(() => setCartBounce(false), 300);

        toast({
            title: "Added to cart",
            description: `${product.emoji} ${product.name} added`,
        });
    };

    const handleUpdateQuantity = (id: number, delta: number) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                    : item
            )
        );
    };

    const handleRemove = (id: number) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleClearCart = () => {
        setCartItems([]);
        toast({
            title: "Cart cleared",
            description: "All items have been removed",
        });
    };

    const handleSignOut = async () => {
        await signOut();
        toast({
            title: "Signed out",
            description: "See you soon!",
        });
    };

    const handleCheckout = () => {
        navigate("/bill", {
            state: {
                cartItems,
                customerName: userName,
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }
        });
        toast({
            title: "Order Placed",
            description: "Redirecting to bill generation...",
        });
    };

    // Show loading while checking access
    if (loading || hasAccess === null) {
        return (
            <div className="min-h-screen gradient-warm flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Redirect to request access if user doesn't have shop access
    if (hasAccess === false) {
        navigate('/request-access');
        return null;
    }

    return (
        <div className="min-h-screen gradient-warm">
            {/* Header */}
            <header className="bg-card/80 backdrop-blur-md sticky top-0 z-40 border-b border-border shadow-soft">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                                <Store className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="font-display font-bold text-xl text-foreground">
                                    QuickMart
                                </h1>
                                <p className="text-xs text-muted-foreground hidden sm:block">
                                    Billing System
                                </p>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary/30"
                                />
                            </div>
                        </div>

                        {/* User Actions */}
                        <div className="flex items-center gap-2">
                            {!loading && (
                                <>
                                    {user ? (
                                        <>
                                            {(user.role === 'admin' || user.role === 'owner') && (
                                                <Link to="/admin">
                                                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                                                        <Shield className="w-4 h-4 mr-2" />
                                                        Admin
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="sm:hidden">
                                                        <Shield className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            )}
                                            <Link to="/history">
                                                <Button variant="ghost" size="sm" className="hidden sm:flex">
                                                    <History className="w-4 h-4 mr-2" />
                                                    History
                                                </Button>
                                                <Button variant="ghost" size="icon" className="sm:hidden">
                                                    <History className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                                                <User className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-medium text-primary truncate max-w-[120px]">
                                                    {user.name || user.email?.split('@')[0]}
                                                </span>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={handleSignOut}>
                                                <LogOut className="w-4 h-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <Link to="/auth">
                                            <Button variant="default" size="sm" className="gradient-primary text-primary-foreground">
                                                <LogIn className="w-4 h-4 mr-2" />
                                                Sign In
                                            </Button>
                                        </Link>
                                    )}
                                </>
                            )}

                            {/* Mobile Cart Count */}
                            <div
                                className={`lg:hidden flex items-center gap-2 ${cartBounce ? "animate-cart-bounce" : ""
                                    }`}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Store className="w-5 h-5 text-primary" />
                                    </div>
                                    {cartItems.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                                            {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Products Section */}
                    <div className="flex-1">
                        {/* Category Filter */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">
                                    Categories
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${!selectedCategory
                                        ? "gradient-primary text-primary-foreground shadow-glow"
                                        : "bg-card text-muted-foreground hover:bg-muted border border-border"
                                        }`}
                                >
                                    All
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === category
                                            ? "gradient-primary text-primary-foreground shadow-glow"
                                            : "bg-card text-muted-foreground hover:bg-muted border border-border"
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                            {filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAdd={handleAddToCart}
                                />
                            ))}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No products found</p>
                            </div>
                        )}
                    </div>

                    {/* Cart Section - Desktop */}
                    <div className="hidden lg:block w-96 flex-shrink-0">
                        <div className="sticky top-24">
                            <Cart
                                items={cartItems}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemove={handleRemove}
                                onClearCart={handleClearCart}
                                onCheckout={handleCheckout}
                                customerName={userName}
                            />
                        </div>
                    </div>
                </div>

                {/* Mobile Cart */}
                <div className="lg:hidden mt-6">
                    <Cart
                        items={cartItems}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemove}
                        onClearCart={handleClearCart}
                        onCheckout={handleCheckout}
                        customerName={userName}
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-card border-t border-border py-4 mt-8">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        QuickMart Billing System
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Index;
