import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StickyNote, ChevronDown, ChevronUp, Save, Loader2, Pencil } from "lucide-react";

interface CustomerNotesEditorProps {
  notes: string | null;
  onNotesChange: (notes: string) => void;
  isSaving?: boolean;
}

export function CustomerNotesEditor({ notes, onNotesChange, isSaving }: CustomerNotesEditorProps) {
  const [isOpen, setIsOpen] = useState(!!notes);
  const [isEditing, setIsEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes || "");

  // Sync local state when notes prop changes
  useEffect(() => {
    setLocalNotes(notes || "");
  }, [notes]);

  const handleSave = () => {
    onNotesChange(localNotes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalNotes(notes || "");
    setIsEditing(false);
  };

  const hasChanges = localNotes !== (notes || "");

  return (
    <Card className="border-dashed">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-2 px-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                <span>Customer Notes</span>
                {notes && !isOpen && (
                  <span className="text-xs text-muted-foreground font-normal truncate max-w-[150px]">
                    — {notes.substring(0, 30)}...
                  </span>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 px-3">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Write notes about this customer... e.g., preferences, issues, special requests"
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  rows={4}
                  className="text-sm resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave} 
                    disabled={!hasChanges || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {notes ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded-md">
                    {notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No notes yet
                  </p>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="w-full"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {notes ? "Edit Notes" : "Add Notes"}
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
