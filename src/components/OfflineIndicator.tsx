import { useState, useEffect, useCallback } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        // Auto-hide the reconnected message after 3 seconds
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Nothing to show
  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-full px-5 py-3 shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-4",
        isOnline
          ? "bg-success text-success-foreground"
          : "bg-destructive text-destructive-foreground"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-medium">You're offline</span>
          <button
            onClick={handleRetry}
            className="ml-1 flex items-center gap-1 rounded-full bg-background/20 px-3 py-1 text-xs font-medium transition-colors hover:bg-background/30 active:scale-95"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </>
      )}
    </div>
  );
}