import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  FileText,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  ShieldCheck,
  Trash2,
  MoreVertical,
  ChevronRight,
  Copy,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/hooks/useOrdersData";
import { format } from "date-fns";

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  processing: { label: "Processing", color: "bg-accent/10 text-accent border-accent/20", icon: Package },
  shipped: { label: "Shipped", color: "bg-chart-5/10 text-chart-5 border-chart-5/20", icon: Truck },
  delivered: { label: "Delivered", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20" },
  paid: { label: "Paid", color: "bg-success/10 text-success border-success/20" },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive border-destructive/20" },
  refunded: { label: "Refunded", color: "bg-muted text-muted-foreground" },
};

interface MobileOrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onGenerateInvoice: (order: Order) => void;
  onPrintPackingSlip: (order: Order) => void;
  onSendToCourier: (order: Order) => void;
  onVerifyPayment: (order: Order) => void;
  onDuplicate: (order: Order) => void;
  onDelete: (orderId: string) => void;
}

export function MobileOrderCard({
  order,
  onViewDetails,
  onUpdateStatus,
  onGenerateInvoice,
  onPrintPackingSlip,
  onSendToCourier,
  onVerifyPayment,
  onDuplicate,
  onDelete,
}: MobileOrderCardProps) {
  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const statusStyle = statusConfig[order.status]?.color || statusConfig.pending.color;
  const statusLabel = statusConfig[order.status]?.label || order.status;

  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwipingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);
    
    // Only swipe horizontally if the movement is more horizontal than vertical
    if (diffY > 30 && !isSwipingRef.current) return;
    
    if (Math.abs(diffX) > 10) {
      isSwipingRef.current = true;
    }

    if (isSwipingRef.current && diffX < 0) {
      setSwipeX(Math.max(diffX, -120));
    }
  };

  const handleTouchEnd = () => {
    if (swipeX < -60) {
      setSwipeX(-120);
    } else {
      setSwipeX(0);
    }
    isSwipingRef.current = false;
  };

  const resetSwipe = () => setSwipeX(0);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Swipe action buttons revealed behind the card */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        <Button
          variant="ghost"
          className="h-full rounded-none bg-primary px-4 text-primary-foreground hover:bg-primary/90"
          onClick={() => {
            onViewDetails(order);
            resetSwipe();
          }}
        >
          <Eye className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          className="h-full rounded-none bg-destructive px-4 text-destructive-foreground hover:bg-destructive/90"
          onClick={() => {
            onDelete(order.id);
            resetSwipe();
          }}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Main card content */}
      <Card
        className="relative z-10 transition-transform touch-pan-y border-border"
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-4">
          {/* Top row: Order number, date, actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-foreground text-base">{order.order_number}</p>
                {order.payment_verified_at && (
                  <ShieldCheck className="h-4 w-4 text-success flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 -mr-2 -mt-1">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-popover">
                <DropdownMenuItem onClick={() => onViewDetails(order)} className="py-3">
                  <Eye className="mr-3 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGenerateInvoice(order)} className="py-3">
                  <FileText className="mr-3 h-4 w-4" />
                  Download Invoice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrintPackingSlip(order)} className="py-3">
                  <Printer className="mr-3 h-4 w-4" />
                  Print Packing Slip
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSendToCourier(order)} className="py-3">
                  <Send className="mr-3 h-4 w-4" />
                  Send to Courier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onVerifyPayment(order)} className="py-3 text-primary">
                  <ShieldCheck className="mr-3 h-4 w-4" />
                  Verify Payment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(order)} className="py-3">
                  <Copy className="mr-3 h-4 w-4" />
                  Duplicate Order
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Quick status updates */}
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Update Status
                </div>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => onUpdateStatus(order.id, key as OrderStatus)}
                    disabled={order.status === key}
                    className="py-3 pl-6"
                  >
                    <config.icon className="mr-3 h-4 w-4" />
                    {config.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(order.id)}
                  className="py-3 text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-3 h-4 w-4" />
                  Move to Trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Customer info */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-primary">
                {order.customer_name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{order.customer_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {order.customer_phone || order.customer_email}
              </p>
            </div>
          </div>

          {/* Items summary */}
          <div className="mb-3 text-sm text-muted-foreground">
            {order.items.slice(0, 2).map((item, i) => (
              <p key={item.id} className="truncate">
                {item.quantity}× {item.product_name}
              </p>
            ))}
            {order.items.length > 2 && (
              <p className="text-xs">+{order.items.length - 2} more items</p>
            )}
          </div>

          {/* Bottom row: Total, payment, status */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-bold text-foreground">৳{order.total.toLocaleString()}</p>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-xs", paymentStatusConfig[order.payment_status]?.color)}
              >
                {paymentStatusConfig[order.payment_status]?.label || order.payment_status}
              </Badge>
              <Badge variant="outline" className={cn("gap-1 text-xs", statusStyle)}>
                <StatusIcon className="h-3 w-3" />
                {statusLabel}
              </Badge>
            </div>
          </div>

          {/* Quick status buttons on tap */}
          <div className="mt-3 flex gap-2">
            {order.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-10 text-xs gap-1.5"
                onClick={() => onUpdateStatus(order.id, "processing")}
              >
                <Package className="h-4 w-4" />
                Process
              </Button>
            )}
            {order.status === "processing" && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-10 text-xs gap-1.5"
                onClick={() => onUpdateStatus(order.id, "shipped")}
              >
                <Truck className="h-4 w-4" />
                Ship
              </Button>
            )}
            {order.status === "shipped" && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-10 text-xs gap-1.5"
                onClick={() => onUpdateStatus(order.id, "delivered")}
              >
                <CheckCircle2 className="h-4 w-4" />
                Deliver
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-10 text-xs gap-1.5"
              onClick={() => onViewDetails(order)}
            >
              Details
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}