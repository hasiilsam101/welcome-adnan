import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/hooks/useOrdersData";

const statusSteps: { key: OrderStatus; label: string; icon: React.ElementType; color: string }[] = [
  { key: "pending", label: "Pending", icon: Clock, color: "bg-warning/10 text-warning border-warning/20" },
  { key: "processing", label: "Processing", icon: Package, color: "bg-accent/10 text-accent border-accent/20" },
  { key: "shipped", label: "Shipped", icon: Truck, color: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, color: "bg-success/10 text-success border-success/20" },
];

interface MobileQuickStatusDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export function MobileQuickStatusDrawer({
  open,
  onOpenChange,
  order,
  onUpdateStatus,
}: MobileQuickStatusDrawerProps) {
  if (!order) return null;

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);

  const handleStatusUpdate = (status: OrderStatus) => {
    onUpdateStatus(order.id, status);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg">
            Quick Status Update
          </DrawerTitle>
          <DrawerDescription>
            {order.order_number} · {order.customer_name}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Progress steps */}
          <div className="relative">
            {statusSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.key === order.status;
              const isPast = index < currentStepIndex;
              const isFuture = index > currentStepIndex;

              return (
                <div key={step.key} className="relative">
                  {/* Connecting line */}
                  {index < statusSteps.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-5 top-12 w-0.5 h-6",
                        isPast ? "bg-success" : "bg-border"
                      )}
                    />
                  )}
                  
                  <button
                    className={cn(
                      "flex items-center gap-4 w-full p-3 rounded-xl transition-all active:scale-[0.98]",
                      isActive && "bg-primary/5 ring-2 ring-primary/20",
                      isPast && "opacity-60",
                      isFuture && "hover:bg-muted/50"
                    )}
                    onClick={() => handleStatusUpdate(step.key)}
                    disabled={isActive}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors",
                        isActive && "border-primary bg-primary/10",
                        isPast && "border-success bg-success/10",
                        isFuture && "border-border bg-muted"
                      )}
                    >
                      <StepIcon
                        className={cn(
                          "h-5 w-5",
                          isActive && "text-primary",
                          isPast && "text-success",
                          isFuture && "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p
                        className={cn(
                          "font-medium text-base",
                          isActive && "text-primary",
                          isPast && "text-success",
                          isFuture && "text-foreground"
                        )}
                      >
                        {step.label}
                      </p>
                      {isActive && (
                        <p className="text-xs text-muted-foreground">Current status</p>
                      )}
                    </div>
                    {isFuture && (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    {isPast && (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cancel option */}
          <div className="pt-2 border-t border-border">
            <button
              className={cn(
                "flex items-center gap-4 w-full p-3 rounded-xl transition-all active:scale-[0.98] hover:bg-destructive/5",
                order.status === "cancelled" && "bg-destructive/5 ring-2 ring-destructive/20"
              )}
              onClick={() => handleStatusUpdate("cancelled")}
              disabled={order.status === "cancelled"}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 border-2",
                  order.status === "cancelled"
                    ? "border-destructive bg-destructive/10"
                    : "border-border bg-muted"
                )}
              >
                <XCircle
                  className={cn(
                    "h-5 w-5",
                    order.status === "cancelled" ? "text-destructive" : "text-muted-foreground"
                  )}
                />
              </div>
              <div className="flex-1 text-left">
                <p
                  className={cn(
                    "font-medium text-base",
                    order.status === "cancelled" ? "text-destructive" : "text-foreground"
                  )}
                >
                  Cancelled
                </p>
                {order.status === "cancelled" && (
                  <p className="text-xs text-muted-foreground">Current status</p>
                )}
              </div>
            </button>
          </div>

          {/* Close */}
          <DrawerClose asChild>
            <Button variant="outline" className="w-full h-12 text-base">
              Close
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}