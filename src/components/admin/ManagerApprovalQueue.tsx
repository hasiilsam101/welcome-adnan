import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  Loader2,
  RefreshCw,
  RotateCcw,
  Tag,
  ExternalLink,
} from "lucide-react";
import { useApprovalQueue, type ApprovalItem, type ApprovalItemType } from "@/hooks/useApprovalQueue";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const typeConfig: Record<
  ApprovalItemType,
  { label: string; icon: React.ElementType; color: string }
> = {
  refund: {
    label: "Refund",
    icon: RotateCcw,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
  escalation: {
    label: "Escalated",
    icon: AlertTriangle,
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
  discount: {
    label: "Discount",
    icon: Tag,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
};

export function ManagerApprovalQueue() {
  const { items, isLoading, counts } = useApprovalQueue();
  const [activeTab, setActiveTab] = useState<"all" | ApprovalItemType>("all");
  const navigate = useNavigate();
  const { role } = useAuth();
  const basePath = role === "admin" ? "/admin" : "/manager";

  const filteredItems =
    activeTab === "all"
      ? items
      : items.filter((item) => item.type === activeTab);

  const handleClick = (item: ApprovalItem) => {
    if (item.type === "refund") {
      navigate(`${basePath}/orders`);
    } else if (item.type === "escalation") {
      navigate(`${basePath}/messages`);
    } else {
      navigate(`${basePath}/coupons`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BadgeDollarSign className="h-5 w-5 text-primary" />
            Approval Queue
            {counts.total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {counts.total}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        >
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="all" className="text-xs">
              All ({counts.total})
            </TabsTrigger>
            <TabsTrigger value="refund" className="text-xs">
              Refunds ({counts.refund})
            </TabsTrigger>
            <TabsTrigger value="escalation" className="text-xs">
              Escalated ({counts.escalation})
            </TabsTrigger>
            <TabsTrigger value="discount" className="text-xs">
              Discounts ({counts.discount})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[380px]">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BadgeDollarSign className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const config = typeConfig[item.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="group flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50"
                      onClick={() => handleClick(item)}
                    >
                      <div
                        className={cn(
                          "p-1.5 rounded-md shrink-0",
                          config.color
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              config.color
                            )}
                          >
                            {config.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {item.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {item.created_at &&
                              formatDistanceToNow(new Date(item.created_at), {
                                addSuffix: true,
                              })}
                          </span>
                          {item.amount != null && item.amount > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1 py-0"
                            >
                              ৳{item.amount.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                          Reason: {item.reason}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex items-center justify-between pt-3 border-t mt-3 text-xs text-muted-foreground">
            <span>{filteredItems.length} items pending</span>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
