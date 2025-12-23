import { Trash2, ShoppingBag, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/data/products";

interface CartItem extends Product {
    quantity: number;
}

interface CartProps {
    items: CartItem[];
    onUpdateQuantity: (id: number, delta: number) => void;
    onRemove: (id: number) => void;
    onClearCart: () => void;
    onCheckout: () => void;
    customerName: string;
}

const Cart = ({ items, onUpdateQuantity, onRemove, onClearCart, onCheckout, customerName }: CartProps) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="bg-card rounded-3xl border border-border shadow-soft overflow-hidden flex flex-col h-[calc(100vh-8rem)] sticky top-24">
            <div className="p-6 bg-muted/30 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                        <h2 className="font-display font-semibold text-lg">Current Cart</h2>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {items.reduce((acc, item) => acc + item.quantity, 0)} Items
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">
                    Billing for <span className="font-medium text-foreground">{customerName}</span>
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <ShoppingBag className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground font-medium">Your cart is empty</p>
                        <p className="text-xs text-muted-foreground mt-1">Add items to get started</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50 group hover:border-primary/20 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center text-xl shrink-0">
                                {item.emoji}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                <p className="text-xs text-muted-foreground">₹{item.price} / unit</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, -1)}
                                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center text-xs font-medium tabular-nums">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, 1)}
                                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => onRemove(item.id)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 bg-muted/30 border-t border-border">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{total}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium text-foreground pt-2 border-t border-border/50">
                        <span>Total</span>
                        <span className="text-xl">₹{total}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Button
                        className="w-full gradient-primary shadow-glow"
                        size="lg"
                        disabled={items.length === 0}
                        onClick={onCheckout}
                    >
                        Checkout
                    </Button>
                    {items.length > 0 && (
                        <Button
                            variant="outline"
                            className="w-full border-dashed text-muted-foreground hover:text-destructive hover:bg-destructive/5 hover:border-destructive/30"
                            onClick={onClearCart}
                        >
                            Clear Cart
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Cart;
