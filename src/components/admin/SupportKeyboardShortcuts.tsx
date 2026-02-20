import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

interface ShortcutAction {
  keys: string[];
  label: string;
  description: string;
  action?: () => void;
}

interface SupportKeyboardShortcutsProps {
  onQuickReply?: () => void;
  onNextTicket?: () => void;
  onResolveTicket?: () => void;
  onAssignTicket?: () => void;
  onEscalateTicket?: () => void;
}

export function SupportKeyboardShortcuts({
  onQuickReply,
  onNextTicket,
  onResolveTicket,
  onAssignTicket,
  onEscalateTicket,
}: SupportKeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();
  const { role } = useAuth();

  const basePath = role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/support";

  const shortcuts: ShortcutAction[] = [
    {
      keys: ["Shift", "?"],
      label: "Shortcuts Help",
      description: "Show this help dialog",
    },
    {
      keys: ["Alt", "R"],
      label: "Quick Reply",
      description: "Open quick reply picker",
      action: onQuickReply,
    },
    {
      keys: ["Alt", "N"],
      label: "Next Ticket",
      description: "Go to next assigned ticket",
      action: onNextTicket,
    },
    {
      keys: ["Alt", "S"],
      label: "Resolve Ticket",
      description: "Resolve current ticket",
      action: onResolveTicket,
    },
    {
      keys: ["Alt", "A"],
      label: "Assign Ticket",
      description: "Assign ticket",
      action: onAssignTicket,
    },
    {
      keys: ["Alt", "E"],
      label: "Escalate",
      description: "Escalate ticket",
      action: onEscalateTicket,
    },
    {
      keys: ["Alt", "D"],
      label: "Dashboard",
      description: "Go to dashboard",
      action: () => navigate(`${basePath}/dashboard`),
    },
    {
      keys: ["Alt", "M"],
      label: "Messages",
      description: "Go to messages page",
      action: () => navigate(`${basePath}/messages`),
    },
    {
      keys: ["Alt", "O"],
      label: "Orders",
      description: "Go to orders page",
      action: () => navigate(`${basePath}/orders`),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Shift + ? for help
      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Alt + key shortcuts
      if (e.altKey) {
        const key = e.key.toUpperCase();
        const shortcut = shortcuts.find(
          (s) => s.keys.includes("Alt") && s.keys.includes(key)
        );
        if (shortcut?.action) {
          e.preventDefault();
          shortcut.action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {shortcuts.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50"
            >
              <div>
                <p className="text-sm font-medium">{shortcut.label}</p>
                <p className="text-xs text-muted-foreground">
                  {shortcut.description}
                </p>
              </div>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <Badge
                    key={key}
                    variant="outline"
                    className="font-mono text-xs px-1.5 py-0"
                  >
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          Press Shift + ? to open or close this dialog
        </p>
      </DialogContent>
    </Dialog>
  );
}
