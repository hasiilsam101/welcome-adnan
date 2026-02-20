import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowUpRight, Loader2 } from "lucide-react";
import { useTicketEscalation } from "@/hooks/useTicketEscalation";
import { useAgents, Agent } from "@/hooks/useAgents";

interface TicketEscalationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  ticketSubject: string;
  currentPriority: string;
}

export function TicketEscalationDialog({
  open,
  onOpenChange,
  ticketId,
  ticketSubject,
  currentPriority,
}: TicketEscalationDialogProps) {
  const { escalateTicket, isEscalating } = useTicketEscalation();
  const { agents } = useAgents();
  const [reason, setReason] = useState("");
  const [escalateTo, setEscalateTo] = useState<string>("none");
  const [newPriority, setNewPriority] = useState("urgent");

  // Filter to managers/admins for escalation
  const managers = agents.filter(a => a.role === "admin" || a.role === "manager");

  const handleEscalate = () => {
    if (!reason.trim()) return;

    escalateTicket({
      ticketId,
      escalatedTo: escalateTo !== "none" ? escalateTo : undefined,
      reason,
      newPriority,
    });

    setReason("");
    setEscalateTo("none");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-destructive" />
            টিকেট এসকেলেট করুন
          </DialogTitle>
          <DialogDescription>{ticketSubject}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">
              এসকেলেট করলে টিকেটের প্রায়োরিটি বাড়ানো হবে এবং সংশ্লিষ্ট ম্যানেজারকে নোটিফাই করা হবে।
            </p>
          </div>

          <div className="space-y-2">
            <Label>বর্তমান প্রায়োরিটি</Label>
            <Badge variant="outline" className="capitalize">{currentPriority}</Badge>
          </div>

          <div className="space-y-2">
            <Label>নতুন প্রায়োরিটি</Label>
            <Select value={newPriority} onValueChange={setNewPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>এসকেলেট করুন (ম্যানেজার/এডমিন)</Label>
            <Select value={escalateTo} onValueChange={setEscalateTo}>
              <SelectTrigger>
                <SelectValue placeholder="সিলেক্ট করুন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">কাউকে নির্দিষ্ট করবেন না</SelectItem>
                {managers.map(agent => (
                  <SelectItem key={agent.user_id} value={agent.user_id}>
                    {agent.full_name || agent.email} ({agent.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>এসকেলেশনের কারণ *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="কেন এসকেলেট করছেন তা বিস্তারিত লিখুন..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>
          <Button
            variant="destructive"
            onClick={handleEscalate}
            disabled={!reason.trim() || isEscalating}
          >
            {isEscalating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowUpRight className="h-4 w-4 mr-2" />
            )}
            এসকেলেট করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
