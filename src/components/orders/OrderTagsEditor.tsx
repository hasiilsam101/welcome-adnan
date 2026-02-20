import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag, Plus, X } from "lucide-react";

const PRESET_TAGS = [
  "urgent",
  "vip-customer",
  "fragile",
  "replacement",
  "defective",
  "wrong-item",
  "delayed",
  "return-requested",
  "gift-order",
  "bulk-order",
  "partial-delivery",
  "address-issue",
];

interface OrderTagsEditorProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  compact?: boolean;
}

export function OrderTagsEditor({ tags, onTagsChange, compact = false }: OrderTagsEditorProps) {
  const [newTag, setNewTag] = useState("");
  const [open, setOpen] = useState(false);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(newTag);
    }
  };

  const availablePresets = PRESET_TAGS.filter(t => !tags.includes(t));

  return (
    <div className="space-y-2">
      {/* Current Tags */}
      <div className="flex flex-wrap gap-1">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1">
            {tag}
            <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
              <Plus className="h-3 w-3" />
              {compact ? "" : "Add Tag"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type and press Enter..."
                className="h-8 text-sm"
                autoFocus
              />
              {availablePresets.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {availablePresets.map(preset => (
                      <Badge
                        key={preset}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => addTag(preset)}
                      >
                        <Plus className="h-2.5 w-2.5 mr-1" />
                        {preset}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
