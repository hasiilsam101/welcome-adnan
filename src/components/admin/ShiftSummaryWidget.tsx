import { ShoppingCart, MessageSquare, CheckCircle, Mail, Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useShiftSummary } from "@/hooks/useShiftSummary";

export function ShiftSummaryWidget() {
  const { summary } = useShiftSummary();

  const metrics = [
    { label: "Orders Processed", value: summary.ordersProcessed, icon: ShoppingCart, color: "text-primary bg-primary/10" },
    { label: "Tickets Resolved", value: summary.ticketsResolved, icon: CheckCircle, color: "text-success bg-success/10" },
    { label: "Chats Handled", value: summary.chatsHandled, icon: MessageSquare, color: "text-accent bg-accent/10" },
    { label: "Messages Replied", value: summary.messagesReplied, icon: Mail, color: "text-warning bg-warning/10" },
  ];

  return (
    <div className="space-y-4">
      {/* Today's header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Today's Shift Summary
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>Live</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center ${metric.color}`}>
                <metric.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
