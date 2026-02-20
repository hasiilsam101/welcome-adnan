import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type RefundStatus = "none" | "requested" | "processing" | "refunded" | "rejected";

interface RefundProcessingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    order_number: string;
    total: number;
    refund_status: RefundStatus;
    refund_amount: number;
    refund_reason: string | null;
    payment_method: string;
  } | null;
  onProcess: (orderId: string, data: { refund_status: RefundStatus; refund_amount: number; refund_reason: string }) => void;
  isProcessing?: boolean;
}

const refundStatusConfig: Record<RefundStatus, { label: string; color: string }> = {
  none: { label: "No Refund", color: "bg-muted text-muted-foreground" },
  requested: { label: "Requested", color: "bg-warning/10 text-warning border-warning/20" },
  processing: { label: "Processing", color: "bg-accent/10 text-accent border-accent/20" },
  refunded: { label: "Refunded", color: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Rejected", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function RefundProcessingModal({ open, onOpenChange, order, onProcess, isProcessing }: RefundProcessingModalProps) {
  const [refundStatus, setRefundStatus] = useState<RefundStatus>("requested");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && order) {
      setRefundStatus(order.refund_status === "none" ? "requested" : order.refund_status);
      setRefundAmount(order.refund_amount > 0 ? order.refund_amount.toString() : order.total.toString());
      setRefundReason(order.refund_reason || "");
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = () => {
    if (!order) return;
    const amount = parseFloat(refundAmount) || 0;
    if (amount <= 0 || amount > order.total) return;
    onProcess(order.id, {
      refund_status: refundStatus,
      refund_amount: amount,
      refund_reason: refundReason,
    });
  };

  if (!order) return null;

  const amount = parseFloat(refundAmount) || 0;
  const isValid = amount > 0 && amount <= order.total && refundReason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Refund Processing
          </DialogTitle>
          <DialogDescription>
            Process refund for order {order.order_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          {order.refund_status !== "none" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current:</span>
              <Badge variant="outline" className={refundStatusConfig[order.refund_status].color}>
                {refundStatusConfig[order.refund_status].label}
              </Badge>
            </div>
          )}

          {/* Refund Status */}
          <div className="space-y-2">
            <Label>Refund Status</Label>
            <Select value={refundStatus} onValueChange={(v) => setRefundStatus(v as RefundStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Refund Amount (৳)</Label>
            <Input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="Enter amount"
              max={order.total}
              min={0}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Order total: ৳{order.total.toLocaleString()}</span>
              {amount > order.total && (
                <span className="text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Exceeds order total
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setRefundAmount(order.total.toString())}>
                Full Refund
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setRefundAmount((order.total / 2).toFixed(2))}>
                50%
              </Button>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Enter refund reason..."
              rows={3}
            />
          </div>

          {/* Payment Method */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <span className="text-muted-foreground">Payment Method: </span>
            <span className="font-medium">{order.payment_method}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
            {refundStatus === "refunded" ? "Mark as Refunded" : "Process Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { refundStatusConfig };
