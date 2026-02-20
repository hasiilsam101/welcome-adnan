import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Download,
  Search,
  RefreshCw,
  Star,
  ShoppingBag,
  Copy,
  Check,
  MapPin,
  Phone,
  Mail,
  Home,
  RotateCcw,
  Filter,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { generateInvoicePDF } from '@/utils/generateInvoicePDF';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id?: string | null;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  payment_status: string;
  payment_method: string;
  shipping_address: any;
  items: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const ORDERS_PER_PAGE = 5;

interface OrdersTabProps {
  orders: Order[];
  onRefresh: () => void;
}

export function OrdersTab({ orders, onRefresh }: OrdersTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(ORDERS_PER_PAGE);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Filter & search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((i) =>
          i.product_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const visibleOrders = filteredOrders.slice(0, visibleCount);
  const hasMore = visibleCount < filteredOrders.length;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addItem({
        id: item.product_id || item.id,
        name: item.product_name,
        price: item.unit_price,
        image: '/placeholder.svg',
      }, item.quantity);
    });
    toast({ title: 'Items added to cart', description: `${order.items.length} item(s) from order ${order.order_number}` });
  };

  const handleCancelRequest = async () => {
    if (!cancelOrderId) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', notes: `Cancel requested: ${cancelReason}` })
        .eq('id', cancelOrderId)
        .in('status', ['pending']);
      
      if (error) throw error;
      toast({ title: 'Order cancelled', description: 'Your cancellation request has been processed.' });
      setCancelOrderId(null);
      setCancelReason('');
      onRefresh();
    } catch (error: any) {
      toast({ title: 'Cannot cancel', description: 'Only pending orders can be cancelled.', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

  const downloadInvoiceForOrder = (order: Order) => {
    const invoiceData = {
      order_number: order.order_number,
      created_at: order.created_at,
      customer_name: order.shipping_address?.name || 'Customer',
      customer_email: order.shipping_address?.email || '',
      customer_phone: order.shipping_address?.phone || '',
      shipping_address: [
        order.shipping_address?.street,
        order.shipping_address?.city,
        order.shipping_address?.postal_code,
      ].filter(Boolean).join(', '),
      items: order.items,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      discount: order.discount_amount,
      total: order.total,
      payment_method: order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method,
      payment_status: order.payment_status,
    };
    generateInvoicePDF(invoiceData);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                {statusFilter !== 'all' && ` • ${statusConfig[statusFilter]?.label || statusFilter}`}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order # or product..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(ORDERS_PER_PAGE);
                }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setVisibleCount(ORDERS_PER_PAGE); }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">
                {orders.length === 0 ? 'No orders yet' : 'No matching orders'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {orders.length === 0
                  ? 'Start shopping to see your orders here'
                  : 'Try changing your search or filter'}
              </p>
              {orders.length === 0 && (
                <Button onClick={() => navigate('/store/products')} className="bg-gradient-store">
                  Browse Products
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {visibleOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const canCancel = order.status === 'pending';
                const canReview = order.status === 'delivered';

                return (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg">{order.order_number}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="space-y-1 mb-3">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.product_name} × {item.quantity}</span>
                          <span className="font-medium">৳{item.total_price.toFixed(2)}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{order.items.length - 3} more item(s)
                        </p>
                      )}
                    </div>

                    <Separator className="my-3" />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{order.payment_status}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-lg mr-2">৳{order.total.toFixed(2)}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedOrder(order); setOrderDetailsOpen(true); }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReorder(order)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Reorder
                        </Button>
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setCancelOrderId(order.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        {canReview && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const pid = order.items[0]?.product_id;
                              if (pid) navigate(`/store/product/${pid}#reviews`);
                            }}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Load More / Pagination */}
              {hasMore && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((c) => c + ORDERS_PER_PAGE)}
                  >
                    Show More Orders ({filteredOrders.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </DialogTitle>
            <DialogDescription>
              Complete information about your order
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-semibold text-lg">
                      {selectedOrder.order_number}
                    </span>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(selectedOrder.order_number);
                        setCopiedOrderNumber(true);
                        setTimeout(() => setCopiedOrderNumber(false), 2000);
                      }}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      {copiedOrderNumber ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedOrder.created_at)}
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Badge className={statusConfig[selectedOrder.status]?.color || statusConfig.pending.color}>
                    {statusConfig[selectedOrder.status]?.label || 'Pending'}
                  </Badge>
                  <div>
                    <Badge variant={selectedOrder.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {selectedOrder.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Home className="h-4 w-4" /> Shipping Address
                  </h4>
                  <div className="p-4 border rounded-lg space-y-2 text-sm">
                    <p className="font-medium">{selectedOrder.shipping_address.name}</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {selectedOrder.shipping_address.phone}
                    </div>
                    {selectedOrder.shipping_address.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {selectedOrder.shipping_address.email}
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-3 w-3 mt-1" />
                      <span>
                        {selectedOrder.shipping_address.street}
                        {selectedOrder.shipping_address.city && `, ${selectedOrder.shipping_address.city}`}
                        {selectedOrder.shipping_address.postal_code && ` - ${selectedOrder.shipping_address.postal_code}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" /> Order Items ({selectedOrder.items.length})
                </h4>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">৳{item.unit_price.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold">৳{item.total_price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Payment Summary
                </h4>
                <div className="p-4 border rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="capitalize font-medium">
                      {selectedOrder.payment_method === 'cod' ? 'Cash on Delivery' : selectedOrder.payment_method}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>৳{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>৳{selectedOrder.shipping_cost.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-৳{selectedOrder.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">৳{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="outline" onClick={() => downloadInvoiceForOrder(selectedOrder)}>
                  <Download className="h-4 w-4 mr-2" /> Download Invoice
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setOrderDetailsOpen(false); navigate(`/track/${selectedOrder.order_number}`); }}
                >
                  <Truck className="h-4 w-4 mr-2" /> Track Order
                </Button>
                <Button variant="outline" onClick={() => handleReorder(selectedOrder)}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Reorder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <AlertDialog open={!!cancelOrderId} onOpenChange={(open) => !open && setCancelOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRequest}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
