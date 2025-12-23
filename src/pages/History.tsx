import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserOrders, getAllOrders, Order } from "@/data/orders";

const History = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrders = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Admin and Owner can see all orders, Customers only see their own
                const fetchedOrders = (user.role === 'admin' || user.role === 'owner')
                    ? await getAllOrders()
                    : await getUserOrders(user.id);

                setOrders(fetchedOrders);
            } catch (error) {
                console.error('Error loading orders:', error);
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, [user]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen gradient-warm flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-warm p-6">
            <div className="container mx-auto max-w-4xl">
                <div className="mb-6">
                    <Link to="/">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Store
                        </Button>
                    </Link>
                </div>

                <div className="space-y-6">
                    {orders.length === 0 ? (
                        <div className="bg-card rounded-2xl border border-border p-8 shadow-soft text-center py-20">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h2 className="font-display font-bold text-xl mb-2">Order History</h2>
                            <p className="text-muted-foreground">
                                No orders found. Your purchase history will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <h2 className="font-display font-bold text-2xl mb-4">
                                {user?.role === 'admin' || user?.role === 'owner' ? 'All Orders' : 'Your Orders'}
                            </h2>
                            {orders.map((order) => (
                                <div key={order.id} className="bg-card rounded-xl border border-border p-6 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-bold text-lg">Order #{order.id.slice(0, 8)}</p>
                                            <p className="text-muted-foreground text-sm">{formatDate(order.createdAt)}</p>
                                        </div>
                                        <p className="font-bold text-xl gradient-primary bg-clip-text text-transparent">
                                            ₹{order.total.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span>{item.emoji} {item.name} x {item.quantity}</span>
                                                <span className="text-muted-foreground">₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default History;
