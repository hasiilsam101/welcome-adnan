import { useState } from "react";
import { useOrderNotes } from "@/hooks/useOrderNotes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Send, Trash2, Loader2, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderNotesSectionProps {
  orderId: string;
}

export function OrderNotesSection({ orderId }: OrderNotesSectionProps) {
  const { notes, isLoading, addNote, deleteNote, isAdding } = useOrderNotes(orderId);
  const [newNote, setNewNote] = useState("");

  const handleSubmit = () => {
    if (!newNote.trim()) return;
    addNote({ orderId, content: newNote.trim() });
    setNewNote("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        Internal Notes
      </h4>

      {/* Add note */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a note for the team... (Ctrl+Enter to send)"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="text-sm resize-none flex-1"
        />
        <Button 
          size="icon" 
          onClick={handleSubmit} 
          disabled={!newNote.trim() || isAdding}
          className="shrink-0 self-end"
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
          <StickyNote className="h-6 w-6 mb-1 opacity-50" />
          <p className="text-xs">No notes yet</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="group p-3 bg-muted/50 rounded-lg border border-transparent hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        {note.created_by_name || 'Admin'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => deleteNote(note.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
