import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Send, Loader2 } from "lucide-react";

interface InternalNoteInputProps {
  onSubmit: (content: string, isInternal: boolean) => void;
  isSubmitting?: boolean;
  placeholder?: string;
}

export function InternalNoteInput({ onSubmit, isSubmitting, placeholder = "টিম নোট লিখুন..." }: InternalNoteInputProps) {
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!note.trim()) return;
    onSubmit(note.trim(), true);
    setNote("");
  };

  return (
    <div className="space-y-2 border border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-3 bg-amber-50/50 dark:bg-amber-900/10">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-amber-600" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          ইন্টারনাল নোট
        </span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600">
          শুধু টিম দেখবে
        </Badge>
      </div>
      <div className="flex gap-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="resize-none text-sm bg-background"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
        />
        <Button
          onClick={handleSubmit}
          disabled={!note.trim() || isSubmitting}
          size="icon"
          variant="outline"
          className="h-auto border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 text-amber-600" />
          )}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Ctrl+Enter দিয়েও পাঠাতে পারেন
      </p>
    </div>
  );
}
