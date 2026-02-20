import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Shield } from "lucide-react";
import { useSLAConfig, SLAConfig } from "@/hooks/useSLAConfig";

export function SLASettings() {
  const { config, isLoading, saveConfig } = useSLAConfig();
  const [localConfig, setLocalConfig] = useState<SLAConfig>(config);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setLocalConfig(config);
    }
  }, [isLoading, config]);

  const handleSave = async () => {
    setIsSaving(true);
    await saveConfig(localConfig);
    setIsSaving(false);
  };

  const hasChanges =
    localConfig.firstResponseMinutes !== config.firstResponseMinutes ||
    localConfig.resolutionHours !== config.resolutionHours ||
    localConfig.highPriorityResponseMinutes !== config.highPriorityResponseMinutes ||
    localConfig.urgentPriorityResponseMinutes !== config.urgentPriorityResponseMinutes;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          SLA Configuration
        </CardTitle>
        <CardDescription>
          Set Service Level Agreement (SLA) targets — breach alerts will trigger based on response time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first-response" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Default First Response (minutes)
            </Label>
            <Input
              id="first-response"
              type="number"
              min={1}
              value={localConfig.firstResponseMinutes}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  firstResponseMinutes: parseInt(e.target.value) || 60,
                }))
              }
              className="w-40"
            />
            <p className="text-xs text-muted-foreground">
              Response time for normal priority tickets
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution-hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Resolution Time (hours)
            </Label>
            <Input
              id="resolution-hours"
              type="number"
              min={1}
              value={localConfig.resolutionHours}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  resolutionHours: parseInt(e.target.value) || 24,
                }))
              }
              className="w-40"
            />
            <p className="text-xs text-muted-foreground">
              Maximum time to resolve a ticket
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="high-priority" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              High Priority রেসপন্স (মিনিট)
            </Label>
            <Input
              id="high-priority"
              type="number"
              min={1}
              value={localConfig.highPriorityResponseMinutes}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  highPriorityResponseMinutes: parseInt(e.target.value) || 30,
                }))
              }
              className="w-40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgent-priority" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              Urgent Priority রেসপন্স (মিনিট)
            </Label>
            <Input
              id="urgent-priority"
              type="number"
              min={1}
              value={localConfig.urgentPriorityResponseMinutes}
              onChange={(e) =>
                setLocalConfig((prev) => ({
                  ...prev,
                  urgentPriorityResponseMinutes: parseInt(e.target.value) || 15,
                }))
              }
              className="w-40"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
