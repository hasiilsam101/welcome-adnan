import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Phone,
  MessageSquare,
  Ticket,
  StickyNote,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CommunicationEntry } from "@/hooks/useCommunicationLog";

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  email: { icon: Mail, label: "Email", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  phone: { icon: Phone, label: "Phone", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  chat: { icon: MessageSquare, label: "Chat", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  ticket: { icon: Ticket, label: "Ticket", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  note: { icon: StickyNote, label: "Note", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  sms: { icon: MessageCircle, label: "SMS", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" },
};

interface CustomerCommunicationLogProps {
  entries: CommunicationEntry[];
  loading: boolean;
  onAddEntry: (entry: {
    type: CommunicationEntry["type"];
    subject?: string;
    content: string;
    direction: "inbound" | "outbound";
  }) => Promise<void>;
}

export function CustomerCommunicationLog({
  entries,
  loading,
  onAddEntry,
}: CustomerCommunicationLogProps) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<CommunicationEntry["type"]>("note");
  const [direction, setDirection] = useState<"inbound" | "outbound">("outbound");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onAddEntry({ type, subject: subject || undefined, content, direction });
      setContent("");
      setSubject("");
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEntries = filterType === "all"
    ? entries
    : entries.filter((e) => e.type === filterType);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Filter */}
      <div className="flex items-center justify-between gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant={showForm ? "secondary" : "default"}
          onClick={() => setShowForm(!showForm)}
          className="h-8 text-xs gap-1"
        >
          <Plus className="h-3 w-3" />
          Log Communication
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-2">
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={direction} onValueChange={(v) => setDirection(v as any)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-8 text-sm"
          />
          <Textarea
            placeholder="Communication details..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Log
            </Button>
          </div>
        </div>
      )}

      {/* Entries Timeline */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="mx-auto h-8 w-8 mb-2" />
          <p className="text-sm">No communication records</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredEntries.map((entry) => {
            const cfg = typeConfig[entry.type] || typeConfig.note;
            const Icon = cfg.icon;
            const DirIcon = entry.direction === "inbound" ? ArrowDownLeft : ArrowUpRight;

            return (
              <div
                key={entry.id}
                className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className={cn("flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center", cfg.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn("text-xs", cfg.color)}>
                      {cfg.label}
                    </Badge>
                    <DirIcon className={cn("h-3 w-3", entry.direction === "inbound" ? "text-blue-500" : "text-green-500")} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  {entry.subject && (
                    <p className="text-sm font-medium mt-1">{entry.subject}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {entry.content}
                  </p>
                  {entry.created_by && (
                    <p className="text-xs text-muted-foreground mt-1">
                      By: {entry.created_by}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
