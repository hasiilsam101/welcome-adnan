import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock, Flame } from "lucide-react";
import { useSLAConfig } from "@/hooks/useSLAConfig";
import { LiveChatConversation } from "@/hooks/useLiveChat";
import { SupportTicket } from "@/hooks/useSupportTickets";

interface SLABreachAlertProps {
  conversations: LiveChatConversation[];
  tickets: SupportTicket[];
}

export function SLABreachAlert({ conversations, tickets }: SLABreachAlertProps) {
  const { checkSLAStatus } = useSLAConfig();

  // Check for SLA breaches in conversations
  const breachedChats = conversations.filter(conv => {
    if (conv.status === "resolved" || conv.status === "closed") return false;
    const sla = checkSLAStatus(conv.created_at, null, null, "medium");
    return sla.breached;
  });

  // Check for SLA breaches in tickets
  const breachedTickets = tickets.filter(ticket => {
    if (ticket.status === "resolved" || ticket.status === "closed") return false;
    const sla = checkSLAStatus(
      ticket.created_at,
      ticket.first_response_at,
      ticket.response_time_seconds,
      ticket.priority
    );
    return sla.breached && !ticket.first_response_at;
  });

  const totalBreaches = breachedChats.length + breachedTickets.length;

  if (totalBreaches === 0) return null;

  return (
    <Card className="border-destructive/50 bg-destructive/5 animate-pulse">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-destructive/20">
            <Flame className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-destructive text-sm">
                ⚠️ SLA Breach Alert
              </h4>
              <Badge variant="destructive" className="text-xs">
                {totalBreaches}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
              {breachedChats.length > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  {breachedChats.length} chat(s) SLA missed
                </span>
              )}
              {breachedTickets.length > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-destructive" />
                  {breachedTickets.length} ticket(s) SLA missed
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
