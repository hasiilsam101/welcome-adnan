import { useState, useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Search, MoreVertical, Edit, Trash2, Package, Globe, Image as ImageIcon, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrandsData, type Brand } from "@/hooks/useBrandsData";
import { DataImportExport, type ColumnDef } from "@/components/admin/DataImportExport";

interface FormData {
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  website_url: string;
  is_active: boolean;
}

const defaultFormData: FormData = {
  name: "",
  slug: "",
  description: "",
  logo_url: "",
  website_url: "",
  is_active: true,
};

const brandImportColumns: ColumnDef[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'slug', label: 'Slug', required: true },
  { key: 'description', label: 'Description' },
  { key: 'logo_url', label: 'Logo URL' },
  { key: 'website_url', label: 'Website URL' },
  { key: 'status', label: 'Status', parse: (v) => v || 'active' },
];

export default function Brands() {
  const { brands, loading, createBrand, updateBrand, deleteBrand } = useBrandsData();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteBrandItem, setDeleteBrandItem] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredBrands = useMemo(() => {
    if (!searchQuery) return brands;
    const q = searchQuery.toLowerCase();
    return brands.filter(b =>
      b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q)
    );
  }, [brands, searchQuery]);

  const handleBrandImport = async (items: any[]) => {
    for (const item of items) {
      await createBrand({
        name: item.name,
        slug: item.slug,
        description: item.description || undefined,
        logo_url: item.logo_url || undefined,
        website_url: item.website_url || undefined,
        is_active: item.status !== 'inactive',
      });
    }
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => {
      const newData = { ...prev, [key]: value };
      if (key === "name") newData.slug = generateSlug(value as string);
      return newData;
    });
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: "" }));
  };

  const handleAdd = () => {
    setEditingBrand(null);
    setFormData(defaultFormData);
    setErrors({});
    setModalOpen(true);
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || "",
      logo_url: brand.logo_url || "",
      website_url: brand.website_url || "",
      is_active: brand.is_active,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Brand name is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    const existingSlug = brands.find(b => b.slug === formData.slug && b.id !== editingBrand?.id);
    if (existingSlug) newErrors.slug = "Slug already exists";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          logo_url: formData.logo_url || null,
          website_url: formData.website_url || null,
          is_active: formData.is_active,
        });
      } else {
        await createBrand({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          logo_url: formData.logo_url || undefined,
          website_url: formData.website_url || undefined,
          is_active: formData.is_active,
        });
      }
      setModalOpen(false);
    } catch {}
  };

  const confirmDelete = async () => {
    if (deleteBrandItem) {
      await deleteBrand(deleteBrandItem.id);
      setDeleteBrandItem(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Brands</h1>
            <p className="text-sm text-muted-foreground">
              Manage product brands ({brands.length} total)
            </p>
          </div>
          <div className="flex gap-2">
            <DataImportExport
              entityName="Brand"
              entityNamePlural="Brands"
              columns={brandImportColumns}
              data={brands.map(b => ({
                name: b.name,
                slug: b.slug,
                description: b.description || '',
                logo_url: b.logo_url || '',
                website_url: b.website_url || '',
                status: b.is_active ? 'active' : 'inactive',
              }))}
              exampleRow={{
                name: 'Nike',
                slug: 'nike',
                description: 'Sportswear brand',
                logo_url: 'https://example.com/nike.png',
                website_url: 'https://nike.com',
                status: 'active',
              }}
              onImport={handleBrandImport}
              renderPreviewItem={(item, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg bg-card p-2">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.slug}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{item.status}</Badge>
                </div>
              )}
            />
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Brand
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{brands.length}</p>
                <p className="text-sm text-muted-foreground">Total Brands</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <Award className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{brands.filter(b => b.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Package className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {brands.reduce((sum, b) => sum + (b.product_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[250px]">Brand</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Award className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No brands found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBrands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
                            {brand.logo_url ? (
                              <img src={brand.logo_url} alt={brand.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{brand.name}</p>
                            {brand.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{brand.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs">{brand.slug}</code>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{brand.product_count || 0}</span>
                      </TableCell>
                      <TableCell>
                        {brand.website_url ? (
                          <a href={brand.website_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Visit
                          </a>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          brand.is_active
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {brand.is_active ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(brand.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleEdit(brand)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteBrandItem(brand)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Move to Trash
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit Brand" : "Add New Brand"}</DialogTitle>
            <DialogDescription>
              {editingBrand ? "Update brand details" : "Fill in the details to create a new brand"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Name *</Label>
              <Input id="brand-name" value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Brand name"
                className={errors.name ? "border-destructive" : ""} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-slug">Slug *</Label>
              <Input id="brand-slug" value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="brand-slug"
                className={errors.slug ? "border-destructive" : ""} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-desc">Description</Label>
              <Textarea id="brand-desc" value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Brand description..." rows={2} className="resize-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-logo">Logo URL</Label>
              <Input id="brand-logo" value={formData.logo_url}
                onChange={(e) => updateField("logo_url", e.target.value)}
                placeholder="https://example.com/logo.png" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-website">Website URL</Label>
              <Input id="brand-website" value={formData.website_url}
                onChange={(e) => updateField("website_url", e.target.value)}
                placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.is_active ? "active" : "inactive"}
                onValueChange={(v) => updateField("is_active", v === "active")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingBrand ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <DeleteConfirmModal
        open={!!deleteBrandItem}
        onOpenChange={(open) => !open && setDeleteBrandItem(null)}
        onConfirm={confirmDelete}
        title="Move to Trash"
        itemName={deleteBrandItem?.name}
      />
    </AdminLayout>
  );
}
