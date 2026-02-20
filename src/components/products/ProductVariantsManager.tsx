import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Package, DollarSign, Hash, AlertTriangle, Loader2 } from "lucide-react";
import { useProductVariants, ProductVariant } from "@/hooks/useProductVariants";
import { cn } from "@/lib/utils";

interface ProductVariantsManagerProps {
  productId: string | null;
}

export function ProductVariantsManager({ productId }: ProductVariantsManagerProps) {
  const { variants, loading, addVariant, updateVariant, deleteVariant } = useProductVariants(productId);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState({
    name: "",
    sku: "",
    price: "",
    compare_at_price: "",
    quantity: "",
    color: "",
    size: "",
    color_code: "",
  });

  if (!productId) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Save the product first, then you can add variants with individual pricing and stock.
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

  const handleAddVariant = async () => {
    const autoName = newVariant.name.trim() || `${newVariant.color}${newVariant.color && newVariant.size ? ' - ' : ''}${newVariant.size}`.trim();
    if (!autoName) return;
    setSaving("new");
    try {
      await addVariant({
        product_id: productId,
        name: newVariant.name.trim() || `${newVariant.color} - ${newVariant.size}`.trim().replace(/^ - | - $/g, '') || 'Variant',
        sku: newVariant.sku.trim() || null,
        price: newVariant.price ? Number(newVariant.price) : null,
        compare_at_price: newVariant.compare_at_price ? Number(newVariant.compare_at_price) : null,
        quantity: newVariant.quantity ? Number(newVariant.quantity) : 0,
        options: null,
        image_url: null,
      });
      setNewVariant({ name: "", sku: "", price: "", compare_at_price: "", quantity: "", color: "", size: "", color_code: "" });
      setAdding(false);
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateField = async (id: string, field: string, value: any) => {
    setSaving(id);
    try {
      await updateVariant(id, { [field]: value });
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(id);
    try {
      await deleteVariant(id);
    } finally {
      setSaving(null);
    }
  };

  const totalStock = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      {variants.length > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{variants.length} variant{variants.length !== 1 ? "s" : ""}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Total Stock: <strong>{totalStock}</strong></span>
          </div>
        </div>
      )}

      {/* Variant List */}
      <div className="space-y-3">
        {variants.map((variant) => (
          <VariantRow
            key={variant.id}
            variant={variant}
            saving={saving === variant.id}
            onUpdate={handleUpdateField}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Add New Variant */}
      {adding ? (
        <Card className="border-dashed border-accent">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">New Variant</Label>
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Color *</Label>
                <Input
                  value={newVariant.color}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="e.g., Blue, White, Red"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Size *</Label>
                <Input
                  value={newVariant.size}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="e.g., XL, M, XXL"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Variant Name (auto-generated)</Label>
                <Input
                  value={newVariant.name || `${newVariant.color}${newVariant.color && newVariant.size ? ' - ' : ''}${newVariant.size}`}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Auto: Color - Size"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SKU</Label>
                <Input
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                  placeholder="e.g., PROD-BLUE-XL"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price (৳)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newVariant.price}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Variant price"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Compare Price (৳)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newVariant.compare_at_price}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, compare_at_price: e.target.value }))}
                  placeholder="Original price"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stock Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={newVariant.quantity}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="0"
                  className="h-9"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAddVariant}
              disabled={(!newVariant.color.trim() && !newVariant.size.trim() && !newVariant.name.trim()) || saving === "new"}
              className="w-full"
            >
              {saving === "new" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Variant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="w-full border-dashed" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      )}
    </div>
  );
}

function VariantRow({
  variant,
  saving,
  onUpdate,
  onDelete,
}: {
  variant: ProductVariant;
  saving: boolean;
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: variant.name,
    sku: variant.sku || "",
    price: variant.price?.toString() || "",
    compare_at_price: variant.compare_at_price?.toString() || "",
    quantity: variant.quantity?.toString() || "0",
  });

  useEffect(() => {
    setEditData({
      name: variant.name,
      sku: variant.sku || "",
      price: variant.price?.toString() || "",
      compare_at_price: variant.compare_at_price?.toString() || "",
      quantity: variant.quantity?.toString() || "0",
    });
  }, [variant]);

  const handleSave = () => {
    onUpdate(variant.id, "batch", {
      name: editData.name,
      sku: editData.sku || null,
      price: editData.price ? Number(editData.price) : null,
      compare_at_price: editData.compare_at_price ? Number(editData.compare_at_price) : null,
      quantity: editData.quantity ? Number(editData.quantity) : 0,
    });
    setEditing(false);
  };

  const stockStatus = (variant.quantity || 0) === 0
    ? { label: "Out of Stock", color: "text-destructive" }
    : (variant.quantity || 0) <= 5
      ? { label: "Low Stock", color: "text-warning" }
      : { label: "In Stock", color: "text-success" };

  if (editing) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SKU</Label>
              <Input
                value={editData.sku}
                onChange={(e) => setEditData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price (৳)</Label>
              <Input
                type="number"
                min="0"
                value={editData.price}
                onChange={(e) => setEditData(prev => ({ ...prev, price: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Compare Price (৳)</Label>
              <Input
                type="number"
                min="0"
                value={editData.compare_at_price}
                onChange={(e) => setEditData(prev => ({ ...prev, compare_at_price: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Stock</Label>
              <Input
                type="number"
                min="0"
                value={editData.quantity}
                onChange={(e) => setEditData(prev => ({ ...prev, quantity: e.target.value }))}
                className="h-9"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{variant.name}</span>
            {variant.sku && (
              <Badge variant="outline" className="text-xs shrink-0">
                {variant.sku}
              </Badge>
            )}
            <Badge variant="outline" className={cn("text-xs shrink-0", stockStatus.color)}>
              {stockStatus.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {variant.price != null && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                ৳{variant.price.toLocaleString()}
                {variant.compare_at_price && (
                  <span className="line-through ml-1">৳{variant.compare_at_price.toLocaleString()}</span>
                )}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {variant.quantity || 0} units
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditing(true)}>
            <DollarSign className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(variant.id)}
            disabled={saving}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
