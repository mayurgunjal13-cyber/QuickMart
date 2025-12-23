import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, ShoppingBag, Store, Loader2 } from "lucide-react";
import { Product } from "@/data/products";
import { createOrder } from "@/data/orders";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface CartItem extends Product {
    quantity: number;
}

interface BillState {
    cartItems: CartItem[];
    customerName: string;
    date: string;
}

const Bill = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as BillState;
    const billRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    if (!state || !state.cartItems || state.cartItems.length === 0) {
        return (
            <div className="min-h-screen gradient-warm flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">No Bill Found</h2>
                <p className="text-muted-foreground mb-6">Please add items to your cart first.</p>
                <Button onClick={() => navigate("/")} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Store
                </Button>
            </div>
        );
    }

    const { cartItems, date } = state;
    const customerName = user?.name || state.customerName;
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const grandTotal = total * 1.05; // Including 5% tax

    const handlePrint = () => {
        window.print();
    };

    const handleDone = async () => {
        if (!user) {
            toast({
                title: "Error",
                description: "You must be logged in to place an order",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);

        try {
            // Save order to Supabase
            const orderItems = cartItems.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                emoji: item.emoji
            }));

            const order = await createOrder(user.id, orderItems, grandTotal);

            if (order) {
                toast({
                    title: "Order Placed!",
                    description: "Your order has been saved successfully"
                });
                navigate("/", { state: { clearCart: true } });
            } else {
                throw new Error("Failed to save order");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save order. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen gradient-warm p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <Button variant="ghost" onClick={handleDone} className="gap-2" disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeft className="w-4 h-4" />}
                        {isSaving ? "Saving..." : "Back to Store"}
                    </Button>
                    <Button onClick={handlePrint} className="gap-2 gradient-primary shadow-glow">
                        <Printer className="w-4 h-4" />
                        Print Bill
                    </Button>
                </div>

                <div ref={billRef} className="bg-card rounded-3xl shadow-soft p-8 md:p-12 print:shadow-none print:p-0">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-border pb-8 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center print:border print:border-black">
                                <Store className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="font-display font-bold text-2xl text-foreground">QuickMart</h1>
                                <p className="text-sm text-muted-foreground">Premium Grocery Store</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Invoice #</p>
                            <p className="font-mono font-bold text-lg">{Math.floor(Math.random() * 100000).toString().padStart(6, '0')}</p>
                            <p className="text-sm text-muted-foreground mt-1">{date}</p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="mb-8 p-4 bg-muted/30 rounded-xl print:bg-transparent print:p-0">
                        <p className="text-sm text-muted-foreground mb-1">Billed to</p>
                        <p className="font-bold text-lg text-foreground">{customerName}</p>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 font-medium text-muted-foreground text-sm">Item</th>
                                    <th className="text-center py-3 font-medium text-muted-foreground text-sm">Qty</th>
                                    <th className="text-right py-3 font-medium text-muted-foreground text-sm">Price</th>
                                    <th className="text-right py-3 font-medium text-muted-foreground text-sm">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {cartItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{item.emoji}</span>
                                                <span className="font-medium text-foreground">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center font-mono text-muted-foreground">{item.quantity}</td>
                                        <td className="py-4 text-right font-mono text-muted-foreground">₹{item.price}</td>
                                        <td className="py-4 text-right font-bold text-foreground">₹{item.price * item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Total */}
                    <div className="flex flex-col items-end border-t border-border pt-6">
                        <div className="w-full max-w-xs space-y-3">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Subtotal</span>
                                <span>₹{total}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Tax (5%)</span>
                                <span>₹{(total * 0.05).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-border">
                                <span className="font-bold text-lg">Grand Total</span>
                                <span className="font-bold text-2xl gradient-primary bg-clip-text text-transparent print:text-black">
                                    ₹{grandTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center pt-8 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">Thank you for shopping with QuickMart!</p>
                        <p className="text-xs text-muted-foreground mt-1">For support, contact support@quickmart.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bill;
