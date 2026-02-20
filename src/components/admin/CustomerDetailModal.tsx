import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Crown,
  DollarSign,
  Package,
  ChevronDown,
  ShieldAlert,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerNotesEditor } from "@/components/admin/CustomerNotesEditor";
import { ConversationTagsEditor } from "@/components/admin/ConversationTagsEditor";
import { CustomerCommunicationLog } from "@/components/admin/CustomerCommunicationLog";
import { CustomerBlacklistDialog } from "@/components/admin/CustomerBlacklistDialog";
import { useCommunicationLog } from "@/hooks/useCommunicationLog";
import type { Customer, CustomerOrder } from "@/hooks/useCustomersData";

const tierConfig = {
  bronze: { color: "bg-amber-700/10 text-amber-700 border-amber-700/20", minSpent: 0 },
  silver: { color: "bg-slate-400/10 text-slate-500 border-slate-400/20", minSpent: 20000 },
  gold: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", minSpent: 50000 },
  platinum: { color: "bg-violet-500/10 text-violet-500 border-violet-500/20", minSpent: 80000 },
};

const getLoyaltyTier = (totalSpent: number): keyof typeof tierConfig => {
  if (totalSpent >= 80000) return "platinum";
  if (totalSpent >= 50000) return "gold";
  if (totalSpent >= 20000) return "silver";
  return "bronze";
};

const getCustomerName = (customer: Customer): string =>
  customer.full_name || customer.email?.split("@")[0] || "Unknown";

const getAddressString = (address: any): string | null => {
  if (!address) return null;
  if (typeof address === "string") return address;
  if (typeof address === "object") {
    const parts = [address.street, address.area, address.city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const customerStatusConfig: Record<string, { color: string; icon: any; label: string }> = {
  active: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: null, label: "Active" },
  flagged: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Flag, label: "Flagged" },
  blocked: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: ShieldAlert, label: "Blocked" },
  inactive: { color: "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400", icon: null, label: "Inactive" },
};

interface CustomerDetailModalProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allOrders: CustomerOrder[];
  onNotesChange: (notes: string) => void;
  onTagsChange: (tags: string[]) => void;
  onStatusChange?: (status: string, reason?: string) => Promise<void>;
  isSavingNotes?: boolean;
}

export function CustomerDetailModal({
  customer,
  open,
  onOpenChange,
  allOrders,
  onNotesChange,
  onTagsChange,
  onStatusChange,
  isSavingNotes,
}: CustomerDetailModalProps) {
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [blacklistOpen, setBlacklistOpen] = useState(false);

  const { entries: commEntries, loading: commLoading, addEntry } = useCommunicationLog(
    customer?.id || null
  );

  if (!customer) return null;

  const customerName = getCustomerName(customer);
  const tier = getLoyaltyTier(Number(customer.total_spent));
  const addressStr = getAddressString(customer.address);
  const displayedOrders = showAllOrders ? allOrders : allOrders.slice(0, 5);
  const hasMoreOrders = allOrders.length > 5;
  const statusCfg = customerStatusConfig[customer.status || "active"];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer 360°</DialogTitle>
            <DialogDescription>
              Complete view of customer interactions and history
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {getInitials(customerName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{customerName}</h3>
                  <Badge
                    variant="outline"
                    className={cn("gap-1 capitalize", tierConfig[tier].color)}
                  >
                    <Crown className="h-3 w-3" />
                    {tier}
                  </Badge>
                  {/* Customer Status Badge */}
                  <Badge
                    variant="outline"
                    className={cn("gap-1 capitalize cursor-pointer hover:opacity-80", statusCfg.color)}
                    onClick={() => onStatusChange && setBlacklistOpen(true)}
                  >
                    {statusCfg.icon && <statusCfg.icon className="h-3 w-3" />}
                    {statusCfg.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Customer since {formatDate(customer.created_at)}
                </p>
                <div className="mt-2">
                  <ConversationTagsEditor
                    tags={customer.tags || []}
                    onTagsChange={onTagsChange}
                  />
                </div>
              </div>
              {/* Blacklist/Flag Button */}
              {onStatusChange && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => setBlacklistOpen(true)}
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Status
                </Button>
              )}
            </div>

            <Separator />

            {/* Tabbed Content - 360 View */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">
                  Orders ({allOrders.length})
                </TabsTrigger>
                <TabsTrigger value="communications">
                  Comms ({commEntries.length})
                </TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone || "-"}</span>
                  </div>
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{addressStr || "-"}</span>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <ShoppingBag className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">{customer.total_orders}</p>
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">
                        ৳{Number(customer.total_spent).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">
                        {customer.last_order_date
                          ? formatDate(customer.last_order_date)
                          : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">Last Order</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-3 mt-4">
                {allOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="mx-auto h-8 w-8 mb-2" />
                    <p>No orders found</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {displayedOrders.map((order) => (
                        <div
                          key={order.id + order.order_number}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ৳{order.total.toLocaleString()}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs capitalize",
                                statusColors[order.status] || ""
                              )}
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasMoreOrders && !showAllOrders && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowAllOrders(true)}
                      >
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show All {allOrders.length} Orders
                      </Button>
                    )}
                    {showAllOrders && hasMoreOrders && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setShowAllOrders(false)}
                      >
                        Show Less
                      </Button>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Communications Tab (20) */}
              <TabsContent value="communications" className="mt-4">
                <CustomerCommunicationLog
                  entries={commEntries}
                  loading={commLoading}
                  onAddEntry={addEntry}
                />
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="mt-4">
                <CustomerNotesEditor
                  notes={customer.notes || null}
                  onNotesChange={onNotesChange}
                  isSaving={isSavingNotes}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blacklist/Flag Dialog (19) */}
      {onStatusChange && (
        <CustomerBlacklistDialog
          open={blacklistOpen}
          onOpenChange={setBlacklistOpen}
          customerName={customerName}
          currentStatus={customer.status || "active"}
          onStatusChange={onStatusChange}
        />
      )}
    </>
  );
}
