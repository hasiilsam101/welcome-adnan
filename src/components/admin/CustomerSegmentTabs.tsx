import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Crown,
  ShieldAlert,
  Flag,
  TrendingUp,
  UserMinus,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/hooks/useCustomersData";

const getLoyaltyTier = (totalSpent: number) => {
  if (totalSpent >= 80000) return "platinum";
  if (totalSpent >= 50000) return "gold";
  if (totalSpent >= 20000) return "silver";
  return "bronze";
};

export interface Segment {
  id: string;
  label: string;
  icon: any;
  filter: (c: Customer) => boolean;
  color: string;
}

const segments: Segment[] = [
  {
    id: "all",
    label: "All",
    icon: Users,
    filter: () => true,
    color: "text-foreground",
  },
  {
    id: "vip",
    label: "VIP",
    icon: Crown,
    filter: (c) => getLoyaltyTier(Number(c.total_spent)) === "platinum" || getLoyaltyTier(Number(c.total_spent)) === "gold",
    color: "text-yellow-600",
  },
  {
    id: "active-buyers",
    label: "Active Buyers",
    icon: ShoppingBag,
    filter: (c) => {
      if (!c.last_order_date) return false;
      const days = Math.floor((Date.now() - new Date(c.last_order_date).getTime()) / (1000 * 60 * 60 * 24));
      return days <= 30;
    },
    color: "text-green-600",
  },
  {
    id: "high-value",
    label: "High Value",
    icon: TrendingUp,
    filter: (c) => Number(c.total_spent) >= 20000,
    color: "text-blue-600",
  },
  {
    id: "at-risk",
    label: "At Risk",
    icon: UserMinus,
    filter: (c) => {
      if (!c.last_order_date) return c.total_orders > 0;
      const days = Math.floor((Date.now() - new Date(c.last_order_date).getTime()) / (1000 * 60 * 60 * 24));
      return days > 60 && c.total_orders > 0;
    },
    color: "text-orange-600",
  },
  {
    id: "flagged",
    label: "Flagged",
    icon: Flag,
    filter: (c) => c.status === "flagged",
    color: "text-yellow-600",
  },
  {
    id: "blocked",
    label: "Blocked",
    icon: ShieldAlert,
    filter: (c) => c.status === "blocked",
    color: "text-destructive",
  },
];

interface CustomerSegmentTabsProps {
  customers: Customer[];
  activeSegment: string;
  onSegmentChange: (segmentId: string) => void;
}

export function CustomerSegmentTabs({
  customers,
  activeSegment,
  onSegmentChange,
}: CustomerSegmentTabsProps) {
  const segmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    segments.forEach((seg) => {
      counts[seg.id] = customers.filter(seg.filter).length;
    });
    return counts;
  }, [customers]);

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {segments.map((seg) => {
        const isActive = activeSegment === seg.id;
        const count = segmentCounts[seg.id] || 0;
        const Icon = seg.icon;

        // Hide segments with 0 count (except all)
        if (count === 0 && seg.id !== "all") return null;

        return (
          <Button
            key={seg.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-1.5 text-xs whitespace-nowrap flex-shrink-0",
              !isActive && "bg-card"
            )}
            onClick={() => onSegmentChange(seg.id)}
          >
            <Icon className={cn("h-3.5 w-3.5", !isActive && seg.color)} />
            {seg.label}
            <Badge
              variant={isActive ? "secondary" : "outline"}
              className="text-[10px] h-4 px-1 min-w-[18px] justify-center"
            >
              {count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}

export { segments };
