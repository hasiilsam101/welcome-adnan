import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SLAConfig {
  firstResponseMinutes: number;
  resolutionHours: number;
  highPriorityResponseMinutes: number;
  urgentPriorityResponseMinutes: number;
}

const SLA_CONFIG_KEY = "sla_config";

const DEFAULT_SLA: SLAConfig = {
  firstResponseMinutes: 60,
  resolutionHours: 24,
  highPriorityResponseMinutes: 30,
  urgentPriorityResponseMinutes: 15,
};

export function useSLAConfig() {
  const [config, setConfig] = useState<SLAConfig>(DEFAULT_SLA);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("store_settings")
        .select("setting_value")
        .eq("key", SLA_CONFIG_KEY)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.setting_value) {
        setConfig({ ...DEFAULT_SLA, ...JSON.parse(data.setting_value) });
      }
    } catch (error) {
      console.error("Error fetching SLA config:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = useCallback(async (newConfig: SLAConfig) => {
    try {
      const { error } = await supabase
        .from("store_settings")
        .upsert({
          key: SLA_CONFIG_KEY,
          setting_value: JSON.stringify(newConfig),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (error) throw error;
      setConfig(newConfig);
      toast.success("SLA settings saved");
      return true;
    } catch (error) {
      console.error("Error saving SLA config:", error);
      toast.error("Failed to save SLA settings");
      return false;
    }
  }, []);

  const getSLATargetForPriority = useCallback((priority: string): number => {
    switch (priority) {
      case "urgent": return config.urgentPriorityResponseMinutes;
      case "high": return config.highPriorityResponseMinutes;
      default: return config.firstResponseMinutes;
    }
  }, [config]);

  const checkSLAStatus = useCallback((
    createdAt: string,
    firstResponseAt: string | null | undefined,
    responseTimeSeconds: number | null | undefined,
    priority: string = "medium"
  ): { met: boolean; targetMinutes: number; actualMinutes: number | null; breached: boolean } => {
    const targetMinutes = getSLATargetForPriority(priority);
    
    if (firstResponseAt && responseTimeSeconds != null) {
      const actualMinutes = responseTimeSeconds / 60;
      return {
        met: actualMinutes <= targetMinutes,
        targetMinutes,
        actualMinutes,
        breached: actualMinutes > targetMinutes,
      };
    }

    // Not yet responded - check if breached
    const waitingMinutes = (Date.now() - new Date(createdAt).getTime()) / 60000;
    return {
      met: false,
      targetMinutes,
      actualMinutes: null,
      breached: waitingMinutes > targetMinutes,
    };
  }, [getSLATargetForPriority]);

  return {
    config,
    isLoading,
    saveConfig,
    getSLATargetForPriority,
    checkSLAStatus,
  };
}
