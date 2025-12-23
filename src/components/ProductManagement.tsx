import { useState, useEffect } from "react";
import { Product, addProduct, updateProduct, deleteProduct, subscribeToProducts } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, X, Save, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ProductManagement = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: "",
        emoji: ""
    });

    useEffect(() => {
        // Subscribe to real-time product updates
        const unsubscribe = subscribeToProducts((loadedProducts) => {
            setProducts(loadedProducts);
            const cats = [...new Set(loadedProducts.map(p => p.category))];
            setCategories(cats);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const resetForm = () => {
        setFormData({ name: "", price: "", category: "", emoji: "" });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.price || !formData.category || !formData.emoji) {
            toast({
                title: "Error",
                description: "All fields are required",
                variant: "destructive"
            });
            return;
        }

        const price = parseFloat(formData.price);
        if (isNaN(price) || price <= 0) {
            toast({
                title: "Error",
                description: "Price must be a positive number",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            if (editingId !== null) {
                // Update existing product
                const result = await updateProduct(editingId, {
                    name: formData.name,
                    price,
                    category: formData.category,
                    emoji: formData.emoji
                });
                if (result) {
                    toast({
                        title: "Success",
                        description: "Product updated successfully"
                    });
                } else {
                    throw new Error("Failed to update product");
                }
            } else {
                // Add new product
                const result = await addProduct({
                    name: formData.name,
                    price,
                    category: formData.category,
                    emoji: formData.emoji
                });
                if (result) {
                    toast({
                        title: "Success",
                        description: "Product added successfully"
                    });
                } else {
                    throw new Error("Failed to add product");
                }
            }
            resetForm();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Something went wrong",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (product: Product) => {
        setFormData({
            name: product.name,
            price: product.price.toString(),
            category: product.category,
            emoji: product.emoji
        });
        setEditingId(product.id);
        setIsAdding(true);
    };

    const handleDelete = async (id: number, name: string) => {
        const result = await deleteProduct(id);
        if (result) {
            toast({
                title: "Deleted",
                description: `${name} removed successfully`
            });
        } else {
            toast({
                title: "Error",
                description: "Failed to delete product",
                variant: "destructive"
            });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-xl">Manage Products</h2>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Product
                    </Button>
                )}
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="bg-muted/30 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-lg mb-4">
                        {editingId !== null ? "Edit Product" : "Add New Product"}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Product Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Rice 1kg"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Price (₹)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="e.g., 45"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Category</label>
                                <Input
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g., Groceries"
                                    list="categories"
                                    required
                                    disabled={isSubmitting}
                                />
                                <datalist id="categories">
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Emoji / Icon</label>
                                <Input
                                    value={formData.emoji}
                                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                                    placeholder="e.g., 🍚"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="ghost" onClick={resetForm} disabled={isSubmitting}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button type="submit" className="gap-2" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {editingId !== null ? "Update" : "Add"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Products List */}
            <div className="space-y-3">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="bg-muted/30 rounded-lg p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">{product.emoji}</span>
                            <div>
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {product.category} • ₹{product.price}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(product)}
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(product.id, product.name)}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                {products.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No products yet</p>
                )}
            </div>
        </div>
    );
};

export default ProductManagement;
