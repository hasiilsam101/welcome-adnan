import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AssignedItem {
  id: string;
  type: "chat" | "ticket";
  title: string;
  status: string;
  priority: string | null;
  customerName: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useAssignedToMe() {
  const { user } = useAuth();

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ["assigned-to-me", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const results: AssignedItem[] = [];

      // Fetch assigned chats
      const { data: chats } = await supabase
        .from("live_chat_conversations")
        .select("id, subject, status, priority, customer_name, created_at, updated_at")
        .eq("assigned_to", user!.id)
        .in("status", ["open", "pending"])
        .order("updated_at", { ascending: false });

      (chats || []).forEach((c) => {
        results.push({
          id: c.id,
          type: "chat",
          title: c.subject || "Live Chat",
          status: c.status,
          priority: c.priority,
          customerName: c.customer_name,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        });
      });

      // Fetch assigned tickets
      const { data: tickets } = await supabase
        .from("support_tickets")
        .select("id, subject, status, priority, customer_name, created_at, updated_at")
        .eq("assigned_to", user!.id)
        .in("status", ["open", "in_progress", "waiting"])
        .order("updated_at", { ascending: false });

      (tickets || []).forEach((t) => {
        results.push({
          id: t.id,
          type: "ticket",
          title: t.subject || "Support Ticket",
          status: t.status,
          priority: t.priority,
          customerName: t.customer_name,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        });
      });

      return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },
  });

  const summary = {
    totalOpen: items.length,
    chats: items.filter((i) => i.type === "chat").length,
    tickets: items.filter((i) => i.type === "ticket").length,
    highPriority: items.filter((i) => i.priority === "high" || i.priority === "urgent").length,
  };

  return { items, summary, isLoading, refetch };
}
