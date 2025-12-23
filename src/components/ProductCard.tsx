import { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProductCardProps {
    product: Product;
    onAdd: (product: Product) => void;
}

const ProductCard = ({ product, onAdd }: ProductCardProps) => {
    return (
        <div className="group relative bg-card rounded-2xl p-4 transition-all duration-300 hover:shadow-glow border border-border/50 hover:border-primary/20">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4 text-6xl shadow-inner group-hover:scale-105 transition-transform duration-300">
                {product.emoji}
            </div>

            <div className="space-y-2">
                <h3 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {product.name}
                </h3>

                <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-foreground">
                        ₹{product.price}
                    </p>

                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                        onClick={() => onAdd(product)}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
