import { useOrderActivityLog } from "@/hooks/useOrderActivityLog";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Clock, Package, Truck, CheckCircle2, XCircle, CreditCard, 
  Activity, ArrowRight, Loader2 
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const actionIcons: Record<string, React.ElementType> = {
  status_change: Package,
  payment_status_change: CreditCard,
};

const statusColors: Record<string, string> = {
  pending: "text-warning bg-warning/10",
  processing: "text-accent bg-accent/10",
  shipped: "text-chart-5 bg-chart-5/10",
  delivered: "text-success bg-success/10",
  cancelled: "text-destructive bg-destructive/10",
  paid: "text-success bg-success/10",
  failed: "text-destructive bg-destructive/10",
  refunded: "text-muted-foreground bg-muted",
};

interface OrderTimelineProps {
  orderId: string;
  orderCreatedAt: string;
}

export function OrderTimeline({ orderId, orderCreatedAt }: OrderTimelineProps) {
  const { data: activities = [], isLoading } = useOrderActivityLog(orderId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allEvents = [
    ...activities.map(a => ({
      id: a.id,
      type: a.action,
      description: a.description || '',
      oldValue: a.old_value,
      newValue: a.new_value,
      timestamp: a.created_at,
    })),
    {
      id: 'created',
      type: 'order_created',
      description: 'Order was placed',
      oldValue: null,
      newValue: null,
      timestamp: orderCreatedAt,
    }
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        Activity Timeline
      </h4>
      <ScrollArea className="max-h-[250px]">
        <div className="relative space-y-0">
          {allEvents.map((event, index) => {
            const Icon = event.type === 'order_created' 
              ? Clock 
              : actionIcons[event.type] || Activity;
            const colorClass = event.newValue 
              ? statusColors[event.newValue] || "text-primary bg-primary/10"
              : "text-primary bg-primary/10";

            return (
              <div key={event.id} className="flex gap-3 pb-4 relative">
                {/* Timeline line */}
                {index < allEvents.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                )}
                {/* Icon */}
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10",
                  colorClass
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-medium text-foreground">
                    {event.description}
                  </p>
                  {event.oldValue && event.newValue && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-muted-foreground capitalize">{event.oldValue}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium capitalize">{event.newValue}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')} · {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
