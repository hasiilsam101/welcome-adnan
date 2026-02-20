import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Clock,
  ShoppingBag,
  MessageSquare,
  ArrowUpRight,
  ExternalLink,
  Flame,
  Timer,
} from "lucide-react";
import { useSupportTickets, type SupportTicket } from "@/hooks/useSupportTickets";
import { useOrdersData, type Order } from "@/hooks/useOrdersData";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const priorityWeight: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const priorityConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  urgent: { label: "Urgent", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Flame },
  high: { label: "High", color: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
  medium: { label: "Medium", color: "bg-accent/10 text-accent border-accent/20", icon: Clock },
  low: { label: "Low", color: "bg-muted text-muted-foreground", icon: Timer },
};

interface PriorityItem {
  id: string;
  type: "ticket" | "order";
  title: string;
  subtitle: string;
  priority: string;
  status: string;
  created_at: string;
  urgencyScore: number;
  tags?: string[];
}

export function PriorityQueue() {
  const { tickets } = useSupportTickets();
  const { orders } = useOrdersData();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<"all" | "ticket" | "order">("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const priorityItems = useMemo(() => {
    const items: PriorityItem[] = [];

    // Add active tickets
    tickets
      .filter(t => !["resolved", "closed"].includes(t.status))
      .forEach(t => {
        const ageHours = (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60);
        const pWeight = priorityWeight[t.priority] || 1;
        // Higher score = more urgent; includes priority + age factor
        const urgencyScore = pWeight * 100 + Math.min(ageHours, 100);

        items.push({
          id: t.id,
          type: "ticket",
          title: t.subject,
          subtitle: `${t.ticket_number} • ${t.customer_name}`,
          priority: t.priority,
          status: t.status,
          created_at: t.created_at,
          urgencyScore,
          tags: t.tags,
        });
      });

    // Add pending/processing orders
    orders
      .filter(o => ["pending", "processing"].includes(o.status))
      .forEach(o => {
        const ageHours = (Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60);
        // Orders get base priority from payment status and age
        let basePriority = o.payment_status === "paid" ? 3 : 2;
        if (ageHours > 48) basePriority += 1; // Old orders become urgent
        const urgencyScore = basePriority * 100 + Math.min(ageHours, 100);
        const inferredPriority = basePriority >= 4 ? "urgent" : basePriority >= 3 ? "high" : "medium";

        items.push({
          id: o.id,
          type: "order",
          title: `${o.order_number} - ৳${o.total.toLocaleString()}`,
          subtitle: `${o.customer_name} • ${o.payment_method}`,
          priority: inferredPriority,
          status: o.status,
          created_at: o.created_at,
          urgencyScore,
          tags: (o as any).tags || [],
        });
      });

    // Sort by urgency score descending
    items.sort((a, b) => b.urgencyScore - a.urgencyScore);

    return items;
  }, [tickets, orders]);

  const filteredItems = useMemo(() => {
    return priorityItems.filter(item => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterPriority !== "all" && item.priority !== filterPriority) return false;
      return true;
    });
  }, [priorityItems, filterType, filterPriority]);

  const urgentCount = priorityItems.filter(i => i.priority === "urgent").length;
  const highCount = priorityItems.filter(i => i.priority === "high").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowUpRight className="h-5 w-5 text-primary" />
            Priority Queue
            {urgentCount > 0 && (
              <Badge variant="destructive" className="ml-2">{urgentCount} urgent</Badge>
            )}
            {highCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-warning/10 text-warning">{highCount} high</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="ticket">Tickets</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No items in queue</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const pConfig = priorityConfig[item.priority] || priorityConfig.medium;
                const PriorityIcon = pConfig.icon;
                const isTicket = item.type === "ticket";

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={cn(
                      "group flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
                      item.priority === "urgent" && "border-destructive/30 bg-destructive/5"
                    )}
                    onClick={() => navigate(isTicket ? "/messages" : "/orders")}
                  >
                    <div className={cn("p-1.5 rounded-md shrink-0", pConfig.color)}>
                      <PriorityIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                          {isTicket ? <MessageSquare className="h-2.5 w-2.5 mr-1" /> : <ShoppingBag className="h-2.5 w-2.5 mr-1" />}
                          {isTicket ? "Ticket" : "Order"}
                        </Badge>
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", pConfig.color)}>
                          {pConfig.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground capitalize">{item.status.replace("_", " ")}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-1">
                            {item.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="flex items-center justify-between pt-3 border-t mt-3 text-xs text-muted-foreground">
          <span>{filteredItems.length} items in queue</span>
          <span>{priorityItems.length} total active</span>
        </div>
      </CardContent>
    </Card>
  );
}
