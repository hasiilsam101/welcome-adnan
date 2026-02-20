import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay } from "date-fns";

export interface ShiftSummary {
  ordersProcessed: number;
  ticketsResolved: number;
  chatsHandled: number;
  messagesReplied: number;
  avgResponseTime: string;
}

export function useShiftSummary() {
  const { user } = useAuth();
  const todayStart = startOfDay(new Date()).toISOString();

  const { data: ordersToday = [] } = useQuery({
    queryKey: ["shift-orders", todayStart],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status, updated_at")
        .gte("updated_at", todayStart)
        .in("status", ["processing", "shipped", "delivered"]);
      return data || [];
    },
  });

  const { data: ticketsToday = [] } = useQuery({
    queryKey: ["shift-tickets", user?.id, todayStart],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("id, status, updated_at, assigned_to")
        .gte("updated_at", todayStart)
        .in("status", ["resolved", "closed"]);
      return data || [];
    },
  });

  const { data: chatsToday = [] } = useQuery({
    queryKey: ["shift-chats", user?.id, todayStart],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("live_chat_conversations")
        .select("id, status, updated_at, assigned_to")
        .gte("updated_at", todayStart)
        .eq("status", "resolved");
      return data || [];
    },
  });

  const { data: repliedMessages = [] } = useQuery({
    queryKey: ["shift-messages", todayStart],
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_message_replies")
        .select("id, created_at")
        .gte("created_at", todayStart);
      return data || [];
    },
  });

  const summary: ShiftSummary = useMemo(() => ({
    ordersProcessed: ordersToday.length,
    ticketsResolved: ticketsToday.length,
    chatsHandled: chatsToday.length,
    messagesReplied: repliedMessages.length,
    avgResponseTime: "~5 min",
  }), [ordersToday.length, ticketsToday.length, chatsToday.length, repliedMessages.length]);

  return { summary };
}
