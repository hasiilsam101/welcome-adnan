import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldAlert, ShieldCheck, Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerBlacklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  currentStatus: string;
  onStatusChange: (status: string, reason?: string) => Promise<void>;
}

const statusOptions = [
  { value: "active", label: "Active", icon: ShieldCheck, color: "text-green-600" },
  { value: "flagged", label: "Flagged", icon: Flag, color: "text-yellow-600" },
  { value: "blocked", label: "Blocked", icon: ShieldAlert, color: "text-destructive" },
];

export function CustomerBlacklistDialog({
  open,
  onOpenChange,
  customerName,
  currentStatus,
  onStatusChange,
}: CustomerBlacklistDialogProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onStatusChange(newStatus, reason || undefined);
      onOpenChange(false);
      setReason("");
    } finally {
      setSaving(false);
    }
  };

  const currentOption = statusOptions.find((o) => o.value === currentStatus);
  const newOption = statusOptions.find((o) => o.value === newStatus);
  const isChanging = newStatus !== currentStatus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Customer Status: {customerName}
          </DialogTitle>
          <DialogDescription>
            Change customer access status. Blocked customers cannot place orders.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current:</span>
            {currentOption && (
              <Badge variant="outline" className="gap-1 capitalize">
                <currentOption.icon className={cn("h-3 w-3", currentOption.color)} />
                {currentOption.label}
              </Badge>
            )}
          </div>

          {/* New Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Status</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className={cn("h-4 w-4", opt.color)} />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason (required for block/flag) */}
          {isChanging && newStatus !== "active" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason {newStatus === "blocked" ? "(required)" : "(optional)"}
              </label>
              <Textarea
                placeholder={`Why is this customer being ${newStatus === "blocked" ? "blocked" : "flagged"}?`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          )}

          {/* Warning for block */}
          {newStatus === "blocked" && isChanging && (
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm text-destructive font-medium">⚠️ Blocking Warning</p>
              <p className="text-xs text-destructive/80 mt-1">
                This customer will not be able to place new orders. Existing orders will not be affected.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !isChanging || (newStatus === "blocked" && !reason.trim())}
            variant={newStatus === "blocked" ? "destructive" : "default"}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {newStatus === "blocked" ? "Block Customer" : newStatus === "flagged" ? "Flag Customer" : "Activate Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
