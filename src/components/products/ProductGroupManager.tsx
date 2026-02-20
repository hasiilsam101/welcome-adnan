import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Search, Package, Loader2 } from "lucide-react";
import { useProductGroupItems } from "@/hooks/useProductGroupItems";

interface ProductGroupManagerProps {
  productId: string | null;
  productType: "grouped" | "bundle";
  allProducts: { id: string; name: string; images: string[] | null; price: number }[];
}

export function ProductGroupManager({ productId, productType, allProducts }: ProductGroupManagerProps) {
  const { items, loading, addItem, updateItem, removeItem } = useProductGroupItems(productId);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  if (!productId) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Save the product first, then you can add {productType === "grouped" ? "grouped" : "bundle"} items.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const linkedIds = items.map(i => i.child_product_id);
  const availableProducts = allProducts
    .filter(p => p.id !== productId && !linkedIds.includes(p.id))
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const isBundle = productType === "bundle";

  return (
    <div className="space-y-4">
      {/* Current items */}
      {items.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            {isBundle ? "Bundle Items" : "Grouped Products"} ({items.length})
          </Label>
          {items.map((item) => {
            const childProduct = allProducts.find(p => p.id === item.child_product_id);
            return (
              <Card key={item.id} className="group">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0">
                    <img
                      src={childProduct?.images?.[0] || '/placeholder.svg'}
                      alt={childProduct?.name || 'Product'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{childProduct?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">৳{childProduct?.price?.toLocaleString()}</p>
                  </div>
                  {isBundle && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Qty:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                        className="h-8 w-16"
                      />
                      <Label className="text-xs">Disc%:</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount_percentage}
                        onChange={(e) => updateItem(item.id, { discount_percentage: parseFloat(e.target.value) || 0 })}
                        className="h-8 w-16"
                      />
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add products */}
      {showPicker ? (
        <Card className="border-dashed border-accent">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Add Products</Label>
              <Button variant="ghost" size="sm" onClick={() => setShowPicker(false)}>Close</Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-9 h-9"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto border rounded-lg divide-y divide-border">
              {availableProducts.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground text-center">No products found</p>
              ) : (
                availableProducts.slice(0, 20).map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => addItem(p.id, isBundle ? 1 : 1, 0)}
                  >
                    <div className="h-8 w-8 rounded bg-muted overflow-hidden shrink-0">
                      <img src={p.images?.[0] || '/placeholder.svg'} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">৳{p.price.toLocaleString()}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="w-full border-dashed" onClick={() => setShowPicker(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add {isBundle ? "Bundle Item" : "Product to Group"}
        </Button>
      )}
    </div>
  );
}
