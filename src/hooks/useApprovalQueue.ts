import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ApprovalItemType = "refund" | "escalation" | "discount";

export interface ApprovalItem {
  id: string;
  type: ApprovalItemType;
  title: string;
  subtitle: string;
  amount?: number;
  reason: string;
  created_at: string;
  status: string;
  metadata: Record<string, unknown>;
}

export function useApprovalQueue() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["approval-queue"],
    queryFn: async () => {
      const approvalItems: ApprovalItem[] = [];

      // 1. Pending refunds
      const { data: refundOrders } = await supabase
        .from("orders")
        .select("id, order_number, refund_amount, refund_reason, refund_status, created_at, updated_at")
        .eq("refund_status", "requested")
        .order("updated_at", { ascending: false });

      if (refundOrders) {
        for (const o of refundOrders) {
          approvalItems.push({
            id: o.id,
            type: "refund",
            title: `Refund: ${o.order_number}`,
            subtitle: `৳${(o.refund_amount || 0).toLocaleString()}`,
            amount: o.refund_amount || 0,
            reason: o.refund_reason || "No reason provided",
            created_at: o.updated_at || o.created_at,
            status: o.refund_status || "requested",
            metadata: { order_number: o.order_number },
          });
        }
      }

      // 2. Escalated tickets
      const { data: escalatedTickets } = await supabase
        .from("support_tickets")
        .select("id, ticket_number, subject, escalation_reason, escalated_at, priority, status, customer_name")
        .not("escalated_at", "is", null)
        .in("status", ["open", "in_progress", "waiting"])
        .order("escalated_at", { ascending: false });

      if (escalatedTickets) {
        for (const t of escalatedTickets) {
          approvalItems.push({
            id: t.id,
            type: "escalation",
            title: `Escalated: ${t.ticket_number}`,
            subtitle: `${t.subject} — ${t.customer_name}`,
            reason: t.escalation_reason || "No reason",
            created_at: t.escalated_at || "",
            status: t.status,
            metadata: {
              ticket_number: t.ticket_number,
              priority: t.priority,
            },
          });
        }
      }

      // 3. Pending discount approvals (coupons with high value, active, recently created)
      const { data: highDiscounts } = await supabase
        .from("coupons")
        .select("id, code, title, discount_type, discount_value, created_at, is_active")
        .eq("is_active", true)
        .gte("discount_value", 30)
        .order("created_at", { ascending: false })
        .limit(10);

      if (highDiscounts) {
        for (const c of highDiscounts) {
          approvalItems.push({
            id: c.id,
            type: "discount",
            title: `Discount: ${c.code}`,
            subtitle: `${c.discount_type === "percentage" ? `${c.discount_value}%` : `৳${c.discount_value}`} — ${c.title || "No title"}`,
            reason: `High-value discount coupon`,
            created_at: c.created_at,
            status: "active",
            metadata: {
              code: c.code,
              discount_type: c.discount_type,
              discount_value: c.discount_value,
            },
          });
        }
      }

      // Sort all by date descending
      approvalItems.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return approvalItems;
    },
    refetchInterval: 30000,
  });

  const counts = {
    refund: items.filter((i) => i.type === "refund").length,
    escalation: items.filter((i) => i.type === "escalation").length,
    discount: items.filter((i) => i.type === "discount").length,
    total: items.length,
  };

  return { items, isLoading, counts };
}
