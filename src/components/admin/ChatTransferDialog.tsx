import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useChatTransfer } from "@/hooks/useChatTransfer";
import { Agent } from "@/hooks/useAgents";

interface ChatTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  customerName: string;
  currentAgentId?: string | null;
  agents: Agent[];
}

export function ChatTransferDialog({
  open,
  onOpenChange,
  conversationId,
  customerName,
  currentAgentId,
  agents,
}: ChatTransferDialogProps) {
  const { transferChat, isTransferring } = useChatTransfer();
  const [toAgentId, setToAgentId] = useState<string>("");
  const [transferNote, setTransferNote] = useState("");

  // Filter out current agent
  const availableAgents = agents.filter(a => a.user_id !== currentAgentId);

  const handleTransfer = () => {
    if (!toAgentId) return;

    transferChat({
      conversationId,
      toAgentId,
      transferNote: transferNote.trim() || undefined,
      fromAgentId: currentAgentId || undefined,
    });

    setToAgentId("");
    setTransferNote("");
    onOpenChange(false);
  };

  const selectedAgent = agents.find(a => a.user_id === toAgentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            চ্যাট ট্রান্সফার
          </DialogTitle>
          <DialogDescription>
            {customerName} এর চ্যাট অন্য এজেন্টে ট্রান্সফার করুন
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>এজেন্ট সিলেক্ট করুন *</Label>
            <Select value={toAgentId} onValueChange={setToAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="এজেন্ট বেছে নিন" />
              </SelectTrigger>
              <SelectContent>
                {availableAgents.map(agent => (
                  <SelectItem key={agent.user_id} value={agent.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={agent.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {(agent.full_name || agent.email || "A").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{agent.full_name || agent.email}</span>
                      <Badge variant="outline" className="text-[10px] ml-1">{agent.role}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAgent && (
            <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedAgent.avatar_url || undefined} />
                <AvatarFallback>
                  {(selectedAgent.full_name || "A").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{selectedAgent.full_name || selectedAgent.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{selectedAgent.role}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>ট্রান্সফার নোট (ঐচ্ছিক)</Label>
            <Textarea
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="এজেন্টের জন্য কোনো নোট বা কনটেক্সট লিখুন..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>
          <Button onClick={handleTransfer} disabled={!toAgentId || isTransferring}>
            {isTransferring ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRightLeft className="h-4 w-4 mr-2" />
            )}
            ট্রান্সফার করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
