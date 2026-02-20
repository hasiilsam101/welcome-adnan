import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AgentStatus = "online" | "away" | "busy";

const PRESENCE_CHANNEL = "agent-availability";

interface AgentPresenceInfo {
  id: string;
  email: string;
  status: AgentStatus;
  online_at: string;
}

export function useAgentAvailability() {
  const { user } = useAuth();
  const [status, setStatus] = useState<AgentStatus>("online");
  const [onlineAgents, setOnlineAgents] = useState<AgentPresenceInfo[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const updateStatus = useCallback(
    async (newStatus: AgentStatus) => {
      setStatus(newStatus);
      if (channelRef.current && user) {
        await channelRef.current.track({
          id: user.id,
          email: user.email,
          status: newStatus,
          online_at: new Date().toISOString(),
        });
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const agents: AgentPresenceInfo[] = [];

        Object.entries(state).forEach(([key, presences]) => {
          const presence = (presences as unknown as AgentPresenceInfo[])[0];
          if (presence) {
            agents.push({ ...presence, id: key });
          }
        });

        setOnlineAgents(agents);
      })
      .subscribe(async (s) => {
        if (s === "SUBSCRIBED") {
          await channel.track({
            id: user.id,
            email: user.email,
            status,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user]); // intentionally not including `status` to avoid re-subscribing

  return {
    status,
    updateStatus,
    onlineAgents,
    availableAgents: onlineAgents.filter((a) => a.status === "online"),
  };
}
