import { useState, useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Tag,
  Package,
  ChevronRight,
  FolderTree,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategoriesData, type Category } from "@/hooks/useCategoriesData";
import { DataImportExport, type ColumnDef } from "@/components/admin/DataImportExport";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagination } from "@/hooks/usePagination";
import { toast } from "sonner";

interface FormData {
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
  image_url: string;
  status: string;
}

const defaultFormData: FormData = {
  name: "",
  slug: "",
  description: "",
  parent_id: null,
  image_url: "",
  status: "active",
};

const categoryImportColumns: ColumnDef[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'slug', label: 'Slug', required: true },
  { key: 'description', label: 'Description' },
  { key: 'parent', label: 'Parent Category' },
  { key: 'image_url', label: 'Image URL' },
  { key: 'status', label: 'Status', parse: (v) => v || 'active' },
];

export default function Categories() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategoriesData();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategoryItem, setDeleteCategoryItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const handleCategoryImport = async (items: any[]) => {
    const parentItems = items.filter((item) => !item.parent || item.parent.trim() === '');
    const childItems = items.filter((item) => item.parent && item.parent.trim() !== '');
    const createdMap: Record<string, string> = {};
    categories.forEach((c) => {
      createdMap[c.name.toLowerCase()] = c.id;
    });
    for (const item of parentItems) {
      try {
        const result = await createCategory({
          name: item.name,
          slug: item.slug,
          description: item.description || undefined,
          parent_id: null,
          image_url: item.image_url || undefined,
          status: item.status || 'active',
        });
        if (result?.id) {
          createdMap[item.name.toLowerCase()] = result.id;
        }
      } catch (e) {
        console.error(`Failed to import parent category: ${item.name}`, e);
      }
    }
    for (const item of childItems) {
      const parentId = createdMap[item.parent.toLowerCase()] || null;
      try {
        const result = await createCategory({
          name: item.name,
          slug: item.slug,
          description: item.description || undefined,
          parent_id: parentId,
          image_url: item.image_url || undefined,
          status: item.status || 'active',
        });
        if (result?.id) {
          createdMap[item.name.toLowerCase()] = result.id;
        }
      } catch (e) {
        console.error(`Failed to import child category: ${item.name}`, e);
      }
    }
  };

  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parent_id),
    [categories]
  );

  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.slug.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  const buildCategoryTree = () => {
    const result: { category: Category; level: number }[] = [];
    const addCategoryWithChildren = (category: Category, level: number) => {
      result.push({ category, level });
      const children = getChildren(category.id);
      children.forEach((child) => addCategoryWithChildren(child, level + 1));
    };
    if (searchQuery) {
      filteredCategories.forEach((cat) => {
        const level = cat.parent_id ? 1 : 0;
        result.push({ category: cat, level });
      });
    } else {
      rootCategories.forEach((cat) => addCategoryWithChildren(cat, 0));
    }
    return result;
  };

  const categoryTree = buildCategoryTree();

  // Pagination
  const {
    paginatedData: paginatedTree,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    goToPage,
    changePageSize,
  } = usePagination(categoryTree, { initialPageSize: 10 });

  // Selection helpers
  const currentPageIds = paginatedTree.map((item) => item.category.id);
  const allCurrentSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const someCurrentSelected = currentPageIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allCurrentSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Bulk actions
  const handleBulkStatusChange = async (status: 'active' | 'inactive') => {
    setBulkProcessing(true);
    let count = 0;
    for (const id of selectedIds) {
      try {
        await updateCategory(id, { is_active: status === 'active', status });
        count++;
      } catch (e) {
        console.error(`Failed to update category ${id}`, e);
      }
    }
    toast.success(`${count} categories set to ${status}`);
    clearSelection();
    setBulkProcessing(false);
  };

  const handleBulkTrash = async () => {
    setBulkProcessing(true);
    let count = 0;
    for (const id of selectedIds) {
      try {
        await deleteCategory(id);
        count++;
      } catch (e) {
        console.error(`Failed to trash category ${id}`, e);
      }
    }
    toast.success(`${count} categories moved to trash`);
    clearSelection();
    setBulkDeleteOpen(false);
    setBulkProcessing(false);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => {
      const newData = { ...prev, [key]: value };
      if (key === "name") {
        newData.slug = generateSlug(value as string);
      }
      return newData;
    });
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData(defaultFormData);
    setErrors({});
    setModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parent_id: category.parent_id,
      image_url: category.image_url || "",
      status: category.status,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Category name is required";
    if (!formData.slug.trim()) newErrors.slug = "Slug is required";
    const existingSlug = categories.find(
      (c) => c.slug === formData.slug && c.id !== editingCategory?.id
    );
    if (existingSlug) newErrors.slug = "Slug already exists";
    if (editingCategory && formData.parent_id === editingCategory.id) {
      newErrors.parent_id = "Category cannot be its own parent";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          parent_id: formData.parent_id,
          image_url: formData.image_url || null,
          status: formData.status,
        });
      } else {
        await createCategory({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          parent_id: formData.parent_id,
          image_url: formData.image_url || undefined,
          status: formData.status,
        });
      }
      setModalOpen(false);
    } catch (error) {}
  };

  const handleDelete = (category: Category) => {
    const children = getChildren(category.id);
    if (children.length > 0) return;
    setDeleteCategoryItem(category);
  };

  const confirmDelete = async () => {
    if (deleteCategoryItem) {
      await deleteCategory(deleteCategoryItem.id);
      setDeleteCategoryItem(null);
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return null;
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name || null;
  };

  const getTotalProducts = (categoryId: string): number => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return 0;
    const children = getChildren(categoryId);
    const childProducts = children.reduce(
      (sum, child) => sum + getTotalProducts(child.id),
      0
    );
    return (category.product_count || 0) + childProducts;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-10 w-64" />
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
            <h1 className="font-display text-2xl font-bold text-foreground">Categories</h1>
            <p className="text-sm text-muted-foreground">
              Manage product categories ({categories.length} total)
            </p>
          </div>
          <div className="flex gap-2">
            <DataImportExport
              entityName="Category"
              entityNamePlural="Categories"
              columns={categoryImportColumns}
              data={categories.map(c => ({
                name: c.name,
                slug: c.slug,
                description: c.description || '',
                parent: getParentName(c.parent_id) || '',
                image_url: c.image_url || '',
                status: c.is_active ? 'active' : 'inactive',
              }))}
              exampleRow={{
                name: 'T-Shirts',
                slug: 't-shirts',
                description: 'All types of t-shirts',
                parent: 'Clothing',
                image_url: 'https://example.com/img.jpg',
                status: 'active',
              }}
              onImport={handleCategoryImport}
              renderPreviewItem={(item, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg bg-card p-2">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <Tag className="h-4 w-4 text-muted-foreground" />
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
              Add Category
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FolderTree className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rootCategories.length}</p>
                <p className="text-sm text-muted-foreground">Root Categories</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Tag className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Total Categories</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {categories.reduce((sum, c) => sum + (c.product_count || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Tag className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {categories.filter((c) => c.status === "inactive").length}
                </p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="h-7 px-3">
                {selectedIds.size} selected
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 px-2">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-6 w-px bg-border" />
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              disabled={bulkProcessing}
              onClick={() => handleBulkStatusChange('active')}
            >
              <CheckCircle className="h-4 w-4 text-success" />
              Set Active
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              disabled={bulkProcessing}
              onClick={() => handleBulkStatusChange('inactive')}
            >
              <XCircle className="h-4 w-4 text-muted-foreground" />
              Set Inactive
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 gap-2"
              disabled={bulkProcessing}
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Move to Trash
            </Button>
          </div>
        )}

        {/* Categories Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allCurrentSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                      className={someCurrentSelected && !allCurrentSelected ? "opacity-50" : ""}
                    />
                  </TableHead>
                  <TableHead className="min-w-[300px]">Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTree.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Tag className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No categories found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTree.map(({ category, level }) => (
                    <TableRow key={category.id} className={selectedIds.has(category.id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(category.id)}
                          onCheckedChange={() => toggleSelect(category.id)}
                          aria-label={`Select ${category.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center gap-3"
                          style={{ paddingLeft: `${level * 24}px` }}
                        >
                          {level > 0 && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
                            {category.image_url ? (
                              <img
                                src={category.image_url}
                                alt={category.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{category.name}</p>
                            {category.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{getTotalProducts(category.id)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            category.status === "active"
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {category.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(category.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(category)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Move to Trash
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={goToPage}
                onPageSizeChange={changePageSize}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details below"
                : "Fill in the details to create a new category"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Category name"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="category-slug"
                className={errors.slug ? "border-destructive" : ""}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Category description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select
                value={formData.parent_id || "none"}
                onValueChange={(v) => updateField("parent_id", v === "none" ? null : v)}
              >
                <SelectTrigger className={errors.parent_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="none">None (Root Category)</SelectItem>
                  {categories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.parent_id && (
                <p className="text-xs text-destructive">{errors.parent_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image_url}
                onChange={(e) => updateField("image_url", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => updateField("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={!!deleteCategoryItem}
        onOpenChange={() => setDeleteCategoryItem(null)}
        onConfirm={confirmDelete}
        title="Move to Trash"
        itemName={deleteCategoryItem?.name}
      />

      {/* Bulk Delete Confirmation */}
      <DeleteConfirmModal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkTrash}
        title="Move to Trash"
        description={`Are you sure you want to move ${selectedIds.size} categories to trash?`}
        isLoading={bulkProcessing}
      />
    </AdminLayout>
  );
}
