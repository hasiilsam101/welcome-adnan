import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow, differenceInMinutes, differenceInHours } from "date-fns";

interface ResponseTimeIndicatorProps {
  createdAt: string;
  firstResponseAt?: string | null;
  responseTimeSeconds?: number | null;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ResponseTimeIndicator({
  createdAt,
  firstResponseAt,
  responseTimeSeconds,
  showLabel = true,
  size = "md",
}: ResponseTimeIndicatorProps) {
  const createdDate = new Date(createdAt);
  const now = new Date();

  // If already responded
  if (firstResponseAt) {
    const responseDate = new Date(firstResponseAt);
    const minutes = responseTimeSeconds 
      ? Math.floor(responseTimeSeconds / 60)
      : differenceInMinutes(responseDate, createdDate);
    const hours = Math.floor(minutes / 60);

    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let Icon = CheckCircle2;
    let colorClass = "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";

    if (hours >= 24) {
      variant = "destructive";
      Icon = XCircle;
      colorClass = "text-red-600 bg-red-50 dark:bg-red-900/20";
    } else if (hours >= 4) {
      Icon = AlertTriangle;
      colorClass = "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
    }

    const timeText = hours >= 24
      ? `${Math.floor(hours / 24)}d ${hours % 24}h`
      : hours >= 1
      ? `${hours}h ${minutes % 60}m`
      : `${minutes}m`;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`gap-1 ${colorClass} ${size === "sm" ? "text-xs px-1.5 py-0" : ""}`}
            >
              <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
              {showLabel && (
                <span>{size === "sm" ? timeText : `Response: ${timeText}`}</span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>First response: {formatDistanceToNow(responseDate, { addSuffix: true })}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Not yet responded - show waiting time
  const waitingMinutes = differenceInMinutes(now, createdDate);
  const waitingHours = differenceInHours(now, createdDate);

  let colorClass = "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
  let Icon = Clock;
  let urgencyLevel = "normal";

  if (waitingHours >= 24) {
    colorClass = "text-red-600 bg-red-50 dark:bg-red-900/20 animate-pulse";
    Icon = AlertTriangle;
    urgencyLevel = "critical";
  } else if (waitingHours >= 4) {
    colorClass = "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
    Icon = AlertTriangle;
    urgencyLevel = "warning";
  } else if (waitingHours >= 1) {
    colorClass = "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
    urgencyLevel = "attention";
  }

  const waitingText = waitingHours >= 24
    ? `${Math.floor(waitingHours / 24)}d waiting`
    : waitingHours >= 1
    ? `${waitingHours}h waiting`
    : `${waitingMinutes}m waiting`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1 ${colorClass} ${size === "sm" ? "text-xs px-1.5 py-0" : ""}`}
          >
            <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {showLabel && <span>{waitingText}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {urgencyLevel === "critical" && "⚠️ Urgent attention needed!"}
            {urgencyLevel === "warning" && "⚡ Respond quickly"}
            {urgencyLevel === "attention" && "🕐 Not yet responded"}
            {urgencyLevel === "normal" && "New message"}
          </p>
          <p className="text-xs text-muted-foreground">
            Received: {formatDistanceToNow(createdDate, { addSuffix: true })}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// SLA Status Component
interface SLAStatusProps {
  responseTimeSeconds?: number | null;
  slaTargetMinutes?: number;
}

export function SLAStatus({ responseTimeSeconds, slaTargetMinutes = 60 }: SLAStatusProps) {
  if (!responseTimeSeconds) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Clock className="h-3 w-3" />
        N/A
      </Badge>
    );
  }

  const responseMinutes = responseTimeSeconds / 60;
  const metSLA = responseMinutes <= slaTargetMinutes;
  const percentage = Math.min(100, (responseMinutes / slaTargetMinutes) * 100);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={metSLA ? "default" : "destructive"}
            className={`gap-1 ${metSLA ? "bg-emerald-600" : ""}`}
          >
            {metSLA ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            <span>{metSLA ? "SLA Met" : "SLA Breach"}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Target: {slaTargetMinutes} min</p>
          <p>Actual: {Math.round(responseMinutes)} min</p>
          <p>{percentage.toFixed(0)}% of target</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Response Time Stats Component
interface ResponseTimeStatsProps {
  items: Array<{
    response_time_seconds?: number | null;
    first_response_at?: string | null;
    created_at: string;
  }>;
}

export function ResponseTimeStats({ items }: ResponseTimeStatsProps) {
  const responded = items.filter((i) => i.first_response_at);
  const pending = items.filter((i) => !i.first_response_at);

  const avgResponseTime = responded.length > 0
    ? responded.reduce((sum, i) => sum + (i.response_time_seconds || 0), 0) / responded.length
    : 0;

  const avgHours = Math.floor(avgResponseTime / 3600);
  const avgMinutes = Math.floor((avgResponseTime % 3600) / 60);

  const under1Hour = responded.filter((i) => (i.response_time_seconds || 0) < 3600).length;
  const under24Hours = responded.filter((i) => (i.response_time_seconds || 0) < 86400).length;
  const over24Hours = responded.filter((i) => (i.response_time_seconds || 0) >= 86400).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
      <div className="p-3 rounded-lg bg-muted/50">
        <p className="text-muted-foreground text-xs">Avg Response Time</p>
        <p className="font-semibold">
          {avgHours > 0 ? `${avgHours}h ${avgMinutes}m` : `${avgMinutes} min`}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
        <p className="text-muted-foreground text-xs">Under 1 Hour</p>
        <p className="font-semibold text-emerald-600">{under1Hour}</p>
      </div>
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
        <p className="text-muted-foreground text-xs">1-24 Hours</p>
        <p className="font-semibold text-amber-600">{under24Hours - under1Hour}</p>
      </div>
      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
        <p className="text-muted-foreground text-xs">Pending</p>
        <p className="font-semibold text-red-600">{pending.length}</p>
      </div>
    </div>
  );
}
