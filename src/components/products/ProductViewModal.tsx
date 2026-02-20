import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, Edit, X, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "./ProductCard";
import { useProductVariants } from "@/hooks/useProductVariants";

interface ProductViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onEdit?: (product: Product) => void;
}

const colorNames: Record<string, string> = {
  "#000000": "Black",
  "#FFFFFF": "White",
  "#EF4444": "Red",
  "#3B82F6": "Blue",
  "#22C55E": "Green",
  "#EAB308": "Yellow",
  "#EC4899": "Pink",
  "#A855F7": "Purple",
  "#F97316": "Orange",
  "#6B7280": "Gray",
};

export function ProductViewModal({
  open,
  onOpenChange,
  product,
  onEdit,
}: ProductViewModalProps) {
  if (!product) return null;

  const { variants } = useProductVariants(open ? product.id : null);

  const getStatusColor = (status: Product["status"]) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "draft":
        return "bg-warning/10 text-warning border-warning/20";
      case "archived":
        return "bg-muted text-muted-foreground border-muted";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "text-destructive" };
    if (stock <= 10) return { label: "Low Stock", color: "text-warning" };
    return { label: "In Stock", color: "text-success" };
  };

  const stockStatus = getStockStatus(product.stock);
  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" />
            Product Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain"
            />
            {discount > 0 && (
              <Badge className="absolute bottom-3 left-3 bg-accent text-accent-foreground">
                {discount}% OFF
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn("absolute right-3 top-3 capitalize", getStatusColor(product.status))}
            >
              {product.status}
            </Badge>
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{product.category}</p>
              <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-foreground">
                ৳{product.price.toLocaleString()}
              </span>
              {product.comparePrice && (
                <span className="text-lg text-muted-foreground line-through">
                  ৳{product.comparePrice.toLocaleString()}
                </span>
              )}
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">SKU</p>
                <p className="font-medium text-foreground">{product.sku || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium text-foreground">{product.category || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Stock</p>
                <p className={cn("font-medium", stockStatus.color)}>
                  {product.stock} units ({stockStatus.label})
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="outline" className={cn("capitalize", getStatusColor(product.status))}>
                  {product.status}
                </Badge>
              </div>
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Available Sizes</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <Badge key={size} variant="secondary">
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Available Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <div key={color} className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded-full border-2 border-border"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm text-foreground">
                          {colorNames[color] || color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Variants */}
            {variants.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Variants ({variants.length})</p>
                  <div className="space-y-2">
                    {variants.map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <span className="text-sm font-medium">{v.name}</span>
                          {v.sku && <span className="text-xs text-muted-foreground ml-2">SKU: {v.sku}</span>}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          {v.price != null && (
                            <span className="font-medium">৳{v.price.toLocaleString()}</span>
                          )}
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            (v.quantity || 0) === 0 ? "text-destructive" : (v.quantity || 0) <= 5 ? "text-warning" : "text-success"
                          )}>
                            {v.quantity || 0} units
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
            {onEdit && (
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onEdit(product);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
