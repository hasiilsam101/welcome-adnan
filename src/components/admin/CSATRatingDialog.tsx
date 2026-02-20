import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";
import { useCSATRatings } from "@/hooks/useCSATRatings";

interface CSATRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId?: string;
  conversationId?: string;
  customerEmail?: string;
  customerName?: string;
  agentId?: string;
}

export function CSATRatingDialog({
  open,
  onOpenChange,
  ticketId,
  conversationId,
  customerEmail,
  customerName,
  agentId,
}: CSATRatingDialogProps) {
  const { submitRating, isSubmitting } = useCSATRatings();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const ratingLabels = ["", "Very Bad", "Bad", "Okay", "Good", "Excellent"];

  const handleSubmit = () => {
    if (rating === 0) return;

    submitRating({
      ticket_id: ticketId,
      conversation_id: conversationId,
      customer_email: customerEmail,
      customer_name: customerName,
      rating,
      feedback: feedback.trim() || undefined,
      agent_id: agentId,
    });

    setRating(0);
    setFeedback("");
    onOpenChange(false);
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate Service Quality</DialogTitle>
          <DialogDescription>
            How was the customer's experience?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= displayRating
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <p className="text-sm font-medium text-muted-foreground">
                {ratingLabels[displayRating]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Comment (Optional)</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write additional feedback..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={rating === 0 || isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Star className="h-4 w-4 mr-2" />
            )}
            Submit Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
