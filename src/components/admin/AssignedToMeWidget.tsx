import { MessageSquare, Tag, AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssignedToMe } from "@/hooks/useAssignedToMe";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const priorityStyles: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-warning/10 text-warning border-warning/30",
  medium: "bg-primary/10 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};

export function AssignedToMeWidget() {
  const { items, summary, isLoading } = useAssignedToMe();
  const { role } = useAuth();
  const navigate = useNavigate();
  const basePath = role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/support";

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{summary.totalOpen}</p>
          <p className="text-xs text-muted-foreground">Total Open</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-primary">{summary.chats}</p>
          <p className="text-xs text-muted-foreground">Chats</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-accent">{summary.tickets}</p>
          <p className="text-xs text-muted-foreground">Tickets</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{summary.highPriority}</p>
          <p className="text-xs text-muted-foreground">Urgent</p>
        </div>
      </div>

      {/* Item List */}
      <ScrollArea className="h-[260px]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <Clock className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm font-medium">No assigned items</p>
            <p className="text-xs">Your task list is empty!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`${basePath}/messages`)}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  item.type === "chat" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                )}>
                  {item.type === "chat" ? <MessageSquare className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.priority && (item.priority === "high" || item.priority === "urgent") && (
                      <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.customerName || "Unknown"} • {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", priorityStyles[item.priority || "low"])}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
