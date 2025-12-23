import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, User } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Package, Shield, ShoppingCart } from "lucide-react";
import ProductManagement from "@/components/ProductManagement";
import { supabase } from "@/integrations/supabase/client";

interface Order {
    id: string;
    date: string;
    items: any[];
    total: number;
    customerName: string;
    userId?: string;
}

const AdminDashboard = () => {
    const { user, loading, getAllUsers, updateUserRole } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'customers' | 'orders' | 'products' | 'admins'>('customers');
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    // Redirect if not admin or owner
    useEffect(() => {
        if (!loading && (!user || (user.role !== 'admin' && user.role !== 'owner'))) {
            navigate('/', { replace: true });
        }
    }, [user, loading, navigate]);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            if (user && (user.role === 'admin' || user.role === 'owner')) {
                try {
                    const allUsers = await getAllUsers();
                    setUsers(allUsers);
                } catch (error) {
                    console.error('Failed to load users:', error);
                    setUsers([]);
                }

                try {
                    // Load orders from Supabase
                    const { getAllOrders } = await import("@/data/orders");
                    const allOrders = await getAllOrders();

                    // Fetch customer names from profiles for each unique user
                    const userIds = [...new Set(allOrders.map(o => o.userId))];
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, name')
                        .in('id', userIds);

                    const userNamesMap = new Map(
                        (profiles || []).map(p => [p.id, p.name || 'Unknown'])
                    );

                    setOrders(allOrders.map(o => ({
                        id: o.id,
                        date: o.createdAt,
                        items: o.items,
                        total: o.total,
                        customerName: userNamesMap.get(o.userId) || 'Unknown',
                        userId: o.userId
                    })));
                } catch (error) {
                    console.error('Failed to load orders:', error);
                    setOrders([]);
                }
            }
        };
        loadData();
    }, [refreshKey, getAllUsers, user]);

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'customer') => {
        try {
            await updateUserRole(userId, newRole);
            setRefreshKey(prev => prev + 1); // Trigger refresh
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to update role");
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-purple-500/20 text-purple-700 border-purple-500';
            case 'admin': return 'bg-blue-500/20 text-blue-700 border-blue-500';
            default: return 'bg-gray-500/20 text-gray-700 border-gray-500';
        }
    };

    // Show loading while checking authorization
    if (loading) {
        return (
            <div className="min-h-screen gradient-warm flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Don't render anything if not authorized (will redirect via useEffect)
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return null;
    }

    return (
        <div className="min-h-screen gradient-warm p-6">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Store
                    </Button>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Logged in as</p>
                        <p className="font-bold">{user?.name} <span className={`text-xs px-2 py-1 rounded border ${getRoleBadgeColor(user?.role || '')}`}>{user?.role}</span></p>
                    </div>
                </div>

                <div className="bg-card rounded-2xl border border-border shadow-soft p-8">
                    <h1 className="font-display font-bold text-3xl mb-6">Admin Dashboard</h1>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-border">
                        <button
                            onClick={() => setActiveTab('customers')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'customers'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Customers
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'orders'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Package className="w-4 h-4" />
                            Orders
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'products'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Products
                        </button>
                        {user?.role === 'owner' && (
                            <button
                                onClick={() => setActiveTab('admins')}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'admins'
                                    ? 'border-primary text-primary font-semibold'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Shield className="w-4 h-4" />
                                Manage Admins
                            </button>
                        )}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'customers' && (
                        <div>
                            <h2 className="font-bold text-xl mb-4">All Customers</h2>
                            <div className="space-y-3">
                                {users.filter(u => u.role === 'customer').map(customer => (
                                    <div key={customer.id} className="bg-muted/30 rounded-lg p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{customer.name}</p>
                                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded border ${getRoleBadgeColor(customer.role)}`}>
                                            {customer.role}
                                        </span>
                                    </div>
                                ))}
                                {users.filter(u => u.role === 'customer').length === 0 && (
                                    <p className="text-muted-foreground text-center py-8">No customers yet</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div>
                            <h2 className="font-bold text-xl mb-4">All Orders</h2>
                            <div className="space-y-4">
                                {orders.map(order => (
                                    <div key={order.id} className="bg-muted/30 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-bold">Order #{order.id}</p>
                                                <p className="text-sm text-muted-foreground">{order.date}</p>
                                                <p className="text-sm font-medium mt-1">Customer: {order.customerName}</p>
                                            </div>
                                            <p className="font-bold text-xl gradient-primary bg-clip-text text-transparent">
                                                ₹{parseFloat(order.total.toString()).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            {order.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span>{item.emoji} {item.name} x {item.quantity}</span>
                                                    <span className="text-muted-foreground">₹{item.price * item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {orders.length === 0 && (
                                    <p className="text-muted-foreground text-center py-8">No orders yet</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <ProductManagement />
                    )}

                    {activeTab === 'admins' && user?.role === 'owner' && (
                        <div>
                            <h2 className="font-bold text-xl mb-4">Manage Admins</h2>
                            <div className="space-y-3">
                                {users.map(u => (
                                    <div key={u.id} className="bg-muted/30 rounded-lg p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{u.name}</p>
                                            <p className="text-sm text-muted-foreground">{u.email}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-3 py-1 rounded border ${getRoleBadgeColor(u.role)}`}>
                                                {u.role}
                                            </span>
                                            {u.role !== 'owner' && (
                                                <Button
                                                    size="sm"
                                                    variant={u.role === 'admin' ? 'destructive' : 'default'}
                                                    onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'customer' : 'admin')}
                                                >
                                                    {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
