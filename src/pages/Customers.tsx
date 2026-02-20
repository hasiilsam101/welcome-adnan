import React, { useState, useMemo, useCallback } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuSeparator,
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
  Search,
  MoreVertical,
  Eye,
  Send,
  Users,
  UserPlus,
  Crown,
  DollarSign,
  CheckCircle2,
  Clock,
  Ban,
  Merge,
  Flag,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCustomersData, type Customer, type CustomerOrder } from "@/hooks/useCustomersData";
import { TablePagination } from "@/components/ui/table-pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { DataExport } from "@/components/ui/data-export";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";
import { CustomerDetailModal } from "@/components/admin/CustomerDetailModal";
import { MergeCustomersModal } from "@/components/admin/MergeCustomersModal";
import { MobileCustomerCard } from "@/components/admin/MobileCustomerCard";
import { CustomerQuickLookup } from "@/components/admin/CustomerQuickLookup";
import { CustomerSegmentTabs, segments } from "@/components/admin/CustomerSegmentTabs";
import { useIsMobile } from "@/hooks/use-mobile";

const tierConfig = {
  bronze: { color: "bg-amber-700/10 text-amber-700 border-amber-700/20", minSpent: 0 },
  silver: { color: "bg-slate-400/10 text-slate-500 border-slate-400/20", minSpent: 20000 },
  gold: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", minSpent: 50000 },
  platinum: { color: "bg-violet-500/10 text-violet-500 border-violet-500/20", minSpent: 80000 },
};

const statusConfig = {
  active: { color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  inactive: { color: "bg-muted text-muted-foreground border-muted", icon: Clock },
  blocked: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: Ban },
  flagged: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Flag },
};

const getCustomerName = (customer: Customer): string => {
  return customer.full_name || customer.email?.split('@')[0] || 'Unknown';
};

const getLoyaltyTier = (totalSpent: number): keyof typeof tierConfig => {
  if (totalSpent >= 80000) return 'platinum';
  if (totalSpent >= 50000) return 'gold';
  if (totalSpent >= 20000) return 'silver';
  return 'bronze';
};

const getCity = (address: any): string | null => {
  if (!address) return null;
  if (typeof address === 'string') return null;
  if (typeof address === 'object' && address.city) return address.city;
  return null;
};

export default function Customers() {
  const {
    customers, loading, stats,
    updateCustomerNotes, updateCustomerTags, updateCustomerStatus,
    fetchCustomerAllOrders, mergeCustomers,
  } = useCustomersData();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [activeSegment, setActiveSegment] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [savingNotes, setSavingNotes] = useState(false);

  const platinumCount = useMemo(() => {
    return customers.filter(c => getLoyaltyTier(Number(c.total_spent)) === 'platinum').length;
  }, [customers]);

  // Apply segment filter first
  const segmentFilter = useMemo(() => {
    const seg = segments.find(s => s.id === activeSegment);
    return seg ? seg.filter : () => true;
  }, [activeSegment]);

  const filteredCustomers = useMemo(() => {
    let result = customers.filter(segmentFilter);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => {
        const name = getCustomerName(c).toLowerCase();
        const city = getCity(c.address);
        const tags = (c.tags || []).join(' ').toLowerCase();
        return name.includes(query) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.phone && c.phone.includes(query)) ||
          (city && city.toLowerCase().includes(query)) ||
          tags.includes(query);
      });
    }

    if (tierFilter !== "all") {
      result = result.filter(c => getLoyaltyTier(Number(c.total_spent)) === tierFilter);
    }

    return result;
  }, [customers, searchQuery, tierFilter, segmentFilter]);

  const { sortedData: sortedCustomers, sortKey, sortDirection, handleSort } = useSorting(filteredCustomers);

  const {
    paginatedData: paginatedCustomers,
    currentPage, pageSize, totalPages, totalItems,
    goToPage, changePageSize,
  } = usePagination(sortedCustomers, { initialPageSize: 10 });

  const exportColumns = [
    { key: "full_name" as const, header: "Name" },
    { key: "email" as const, header: "Email" },
    { key: "phone" as const, header: "Phone" },
    { key: "total_orders" as const, header: "Total Orders" },
    { key: "total_spent" as const, header: "Total Spent" },
    { key: (c: Customer) => getLoyaltyTier(Number(c.total_spent)), header: "Tier" },
    { key: "status" as const, header: "Status" },
    { key: (c: Customer) => (c.tags || []).join(', '), header: "Tags" },
    { key: (c: Customer) => c.notes || '', header: "Notes" },
    { key: "created_at" as const, header: "Joined Date" },
  ];

  const viewDetails = useCallback(async (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
    const orders = await fetchCustomerAllOrders(customer.id);
    setCustomerOrders(orders);
  }, [fetchCustomerAllOrders]);

  const handleNotesChange = async (notes: string) => {
    if (!selectedCustomer) return;
    setSavingNotes(true);
    try {
      await updateCustomerNotes(selectedCustomer.id, notes);
      setSelectedCustomer(prev => prev ? { ...prev, notes } : null);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleTagsChange = async (tags: string[]) => {
    if (!selectedCustomer) return;
    await updateCustomerTags(selectedCustomer.id, tags);
    setSelectedCustomer(prev => prev ? { ...prev, tags } : null);
  };

  const handleStatusChange = async (status: string, reason?: string) => {
    if (!selectedCustomer) return;
    await updateCustomerStatus(selectedCustomer.id, status, reason);
    setSelectedCustomer(prev => prev ? { ...prev, status: status as any } : null);
  };

  const sendEmail = (customer: Customer) => {
    toast.success(`Email dialog opened for ${getCustomerName(customer)}`);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const getStatus = (status: string | undefined): keyof typeof statusConfig => {
    if (status && status in statusConfig) return status as keyof typeof statusConfig;
    return 'active';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Customers</h1>
            <p className="text-sm text-muted-foreground">
              Manage your customer base ({customers.length} customers)
            </p>
          </div>
          {/* Quick Lookup (21) */}
          <CustomerQuickLookup customers={customers} onSelect={viewDetails} />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <UserPlus className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.newThisMonth}</p>
                <p className="text-sm text-muted-foreground">New This Month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">৳{(stats.totalRevenue / 1000).toFixed(0)}k</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-5/10">
                <Crown className="h-6 w-6 text-chart-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{platinumCount}</p>
                <p className="text-sm text-muted-foreground">Platinum Members</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Segment Tabs (22) */}
        <CustomerSegmentTabs
          customers={customers}
          activeSegment={activeSegment}
          onSegmentChange={setActiveSegment}
        />

        {/* Filters & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-36 bg-card">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setMergeOpen(true)}
            >
              <Merge className="h-4 w-4" />
              Merge Duplicates
            </Button>
            <DataExport
              data={sortedCustomers}
              filename={`customers-${new Date().toISOString().split('T')[0]}`}
              columns={exportColumns}
            />
          </div>
        </div>

        {/* Mobile Card View */}
        {isMobile ? (
          <div className="space-y-3">
            {paginatedCustomers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No customers found</p>
                </CardContent>
              </Card>
            ) : (
              paginatedCustomers.map((customer) => (
                <MobileCustomerCard
                  key={customer.id}
                  customer={customer}
                  onViewDetails={viewDetails}
                  onSendEmail={sendEmail}
                />
              ))
            )}
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
        ) : (
          /* Desktop Table View */
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableTableHead
                      sortKey="full_name"
                      currentSortKey={sortKey}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                      className="min-w-[250px]"
                    >
                      Customer
                    </SortableTableHead>
                    <TableHead>Contact</TableHead>
                    <SortableTableHead
                      sortKey="total_orders"
                      currentSortKey={sortKey}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                      className="text-center"
                    >
                      Orders
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="total_spent"
                      currentSortKey={sortKey}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                      className="text-right"
                    >
                      Total Spent
                    </SortableTableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No customers found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCustomers.map((customer) => {
                      const customerName = getCustomerName(customer);
                      const tier = getLoyaltyTier(Number(customer.total_spent));
                      const status = getStatus(customer.status);
                      const StatusIcon = statusConfig[status].icon;
                      const customerTags = customer.tags || [];

                      return (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(customerName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">{customerName}</p>
                                <p className="text-xs text-muted-foreground">
                                  Joined {formatDate(customer.created_at)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm">{customer.email || '-'}</p>
                              <p className="text-xs text-muted-foreground">{customer.phone || '-'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{customer.total_orders}</span>
                              {customer.last_order_date && (
                                <span className="text-xs text-muted-foreground">
                                  Last: {formatDate(customer.last_order_date)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ৳{Number(customer.total_spent).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1 capitalize", tierConfig[tier].color)}>
                              <Crown className="h-3 w-3" />
                              {tier}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {customerTags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {customerTags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{customerTags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1 capitalize", statusConfig[status].color)}>
                              <StatusIcon className="h-3 w-3" />
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
                                <DropdownMenuItem onClick={() => viewDetails(customer)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View 360° Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => sendEmail(customer)}>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    viewDetails(customer);
                                  }}
                                >
                                  <ShieldAlert className="mr-2 h-4 w-4" />
                                  Manage Status
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Customer Detail Modal - 360 View (18) */}
      <CustomerDetailModal
        customer={selectedCustomer}
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setCustomerOrders([]);
          }
        }}
        allOrders={customerOrders}
        onNotesChange={handleNotesChange}
        onTagsChange={handleTagsChange}
        onStatusChange={handleStatusChange}
        isSavingNotes={savingNotes}
      />

      {/* Merge Duplicates Modal */}
      <MergeCustomersModal
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        customers={customers}
        onMerge={mergeCustomers}
      />
    </AdminLayout>
  );
}
