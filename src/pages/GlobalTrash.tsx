import { useState, useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Trash2, RotateCcw, Package, MoreVertical, AlertTriangle, ShoppingCart,
  Award, Tag, Ticket, Clock, User, Filter,
} from "lucide-react";
import { useGlobalTrash, TrashedItem, TrashEntityType } from "@/hooks/useGlobalTrash";
import { useAuth } from "@/contexts/AuthContext";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePagination } from "@/hooks/usePagination";
import { formatDistanceToNow, format } from "date-fns";

const ENTITY_ICONS: Record<TrashEntityType, React.ElementType> = {
  product: Package,
  order: ShoppingCart,
  brand: Award,
  category: Tag,
  coupon: Ticket,
};

const ENTITY_COLORS: Record<TrashEntityType, string> = {
  product: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  order: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  brand: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  category: "bg-green-500/10 text-green-500 border-green-500/20",
  coupon: "bg-pink-500/10 text-pink-500 border-pink-500/20",
};

const FILTER_OPTIONS: { value: TrashEntityType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'product', label: 'Products' },
  { value: 'order', label: 'Orders' },
  { value: 'brand', label: 'Brands' },
  { value: 'category', label: 'Categories' },
  { value: 'coupon', label: 'Coupons' },
];

export default function GlobalTrash() {
  const {
    items, activityLog, loading, logLoading, filter, setFilter,
    restoreItem, permanentDelete, bulkRestore, bulkPermanentDelete, fetchActivityLog,
  } = useGlobalTrash();
  const { isAdmin, isManager, role } = useAuth();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteItem, setDeleteItem] = useState<TrashedItem | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("items");

  const canRestore = isAdmin || isManager;
  const canPermanentDelete = isAdmin;

  const {
    paginatedData, currentPage, pageSize, totalPages, totalItems, goToPage, changePageSize,
  } = usePagination(items, { initialPageSize: 20 });

  const selectedItems = useMemo(
    () => items.filter(i => selectedIds.includes(i.id)),
    [items, selectedIds]
  );

  const handleSelectItem = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) setSelectedIds([]);
    else setSelectedIds(items.map(i => i.id));
  };

  const handleRestore = async (item: TrashedItem) => {
    await restoreItem(item);
    setSelectedIds(prev => prev.filter(id => id !== item.id));
  };

  const handlePermanentDelete = async () => {
    if (!deleteItem) return;
    await permanentDelete(deleteItem);
    setSelectedIds(prev => prev.filter(id => id !== deleteItem.id));
    setDeleteItem(null);
  };

  const handleBulkRestore = async () => {
    await bulkRestore(selectedItems);
    setSelectedIds([]);
  };

  const handleBulkPermanentDelete = async () => {
    await bulkPermanentDelete(selectedItems);
    setSelectedIds([]);
    setBulkDeleteConfirm(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "log") fetchActivityLog();
  };

  const entityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach(i => { counts[i.entity_type] = (counts[i.entity_type] || 0) + 1; });
    return counts;
  }, [items]);

  const allSelected = items.length > 0 && selectedIds.length === items.length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
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
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Trash2 className="h-6 w-6" />
              Global Trash
            </h1>
            <p className="text-sm text-muted-foreground">
              {items.length} items in trash · Auto-cleanup after 30 days
            </p>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {canRestore && (
                <Button variant="outline" size="sm" onClick={handleBulkRestore} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Restore ({selectedIds.length})
                </Button>
              )}
              {canPermanentDelete && (
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteConfirm(true)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Permanently ({selectedIds.length})
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Items older than 30 days will be automatically and permanently deleted.</span>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="items">Trashed Items</TabsTrigger>
            <TabsTrigger value="log">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            {/* Entity Filter */}
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  variant={filter === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setFilter(opt.value as any); setSelectedIds([]); }}
                  className="gap-1.5"
                >
                  {opt.value !== 'all' && (() => {
                    const Icon = ENTITY_ICONS[opt.value as TrashEntityType];
                    return <Icon className="h-3.5 w-3.5" />;
                  })()}
                  {opt.label}
                  {entityCounts[opt.value] !== undefined && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                      {entityCounts[opt.value] || 0}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Table */}
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
                <Trash2 className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">Trash is empty</h3>
                <p className="text-sm text-muted-foreground">No deleted items found</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12">
                        <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="min-w-[200px]">Name</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Deleted</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item) => {
                      const Icon = ENTITY_ICONS[item.entity_type];
                      return (
                        <TableRow key={`${item.entity_type}-${item.id}`}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(item.id)}
                              onCheckedChange={() => handleSelectItem(item.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={ENTITY_COLORS[item.entity_type]}>
                              <Icon className="mr-1 h-3 w-3" />
                              {item.entity_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-muted-foreground line-through">
                              {item.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <EntityDetails item={item} />
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
                                {canRestore && (
                                  <DropdownMenuItem onClick={() => handleRestore(item)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />Restore
                                  </DropdownMenuItem>
                                )}
                                {canPermanentDelete && (
                                  <DropdownMenuItem
                                    onClick={() => setDeleteItem(item)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />Delete Permanently
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {totalItems > 0 && (
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={goToPage}
                    onPageSizeChange={changePageSize}
                  />
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="log" className="space-y-4">
            {logLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : activityLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
                <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">No activity yet</h3>
                <p className="text-sm text-muted-foreground">Trash actions will be logged here</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>By</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLog.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant={
                            log.action === 'trashed' ? 'destructive' :
                            log.action === 'restored' ? 'default' : 'secondary'
                          }>
                            {log.action === 'trashed' ? 'Trashed' :
                             log.action === 'restored' ? 'Restored' : 'Deleted'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={ENTITY_COLORS[log.entity_type as TrashEntityType] || ''}>
                            {log.entity_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.entity_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            {log.performed_by_email || 'System'}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmModal
        open={!!deleteItem}
        onOpenChange={() => setDeleteItem(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete"
        itemName={deleteItem?.name}
      />

      <DeleteConfirmModal
        open={bulkDeleteConfirm}
        onOpenChange={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkPermanentDelete}
        title="Permanently Delete Items"
        itemName={`${selectedIds.length} items`}
      />
    </AdminLayout>
  );
}

function EntityDetails({ item }: { item: TrashedItem }) {
  const extra = item.extra || {};
  switch (item.entity_type) {
    case 'product':
      return <span>SKU: {extra.sku || '-'} · ৳{Number(extra.price || 0).toLocaleString()}</span>;
    case 'order':
      return <span>৳{Number(extra.total_amount || 0).toLocaleString()} · {extra.status || '-'}</span>;
    case 'brand':
      return <span>{extra.slug || '-'}</span>;
    case 'category':
      return <span>{extra.slug || '-'}</span>;
    case 'coupon':
      return <span>{extra.discount_type}: {extra.discount_value}</span>;
    default:
      return null;
  }
}
