import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Circle } from "lucide-react";
import { useAgentAvailability, type AgentStatus } from "@/hooks/useAgentAvailability";
import { cn } from "@/lib/utils";

const statusConfig: Record<AgentStatus, { label: string; color: string; dotClass: string }> = {
  online: {
    label: "Online",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    dotClass: "text-emerald-500",
  },
  away: {
    label: "Away",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    dotClass: "text-amber-500",
  },
  busy: {
    label: "Busy",
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    dotClass: "text-red-500",
  },
};

export function AgentAvailabilityToggle() {
  const { status, updateStatus } = useAgentAvailability();
  const current = statusConfig[status];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
          <Circle className={cn("h-2.5 w-2.5 fill-current", current.dotClass)} />
          <span className="text-xs font-medium hidden sm:inline">{current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {(Object.entries(statusConfig) as [AgentStatus, typeof current][]).map(
          ([key, config]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => updateStatus(key)}
              className={cn("gap-2", status === key && "bg-muted")}
            >
              <Circle className={cn("h-2.5 w-2.5 fill-current", config.dotClass)} />
              <span>{config.label}</span>
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
