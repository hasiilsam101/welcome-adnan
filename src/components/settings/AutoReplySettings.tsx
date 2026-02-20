import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Bot, Clock } from "lucide-react";
import { useAutoReplySettings } from "@/hooks/useAutoReplySettings";

export function AutoReplySettings() {
  const { settings, isLoading, updateSettings, isUpdating } = useAutoReplySettings();
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync local state when settings load
  if (!isLoading && localSettings.message !== settings.message && !isUpdating) {
    setLocalSettings(settings);
  }

  const handleSave = () => {
    updateSettings(localSettings);
  };

  const hasChanges =
    localSettings.enabled !== settings.enabled ||
    localSettings.message !== settings.message ||
    localSettings.delaySeconds !== settings.delaySeconds;

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
          <Bot className="h-5 w-5" />
          Auto-Reply Settings
        </CardTitle>
        <CardDescription>
          When no admin is online, customers will receive an automatic reply
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-reply-enabled">Auto-Reply Enabled</Label>
            <p className="text-sm text-muted-foreground">
              Send automatic replies when offline
            </p>
          </div>
          <Switch
            id="auto-reply-enabled"
            checked={localSettings.enabled}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="auto-reply-message">Auto-Reply Message</Label>
          <Textarea
            id="auto-reply-message"
            value={localSettings.message}
            onChange={(e) =>
              setLocalSettings((prev) => ({ ...prev, message: e.target.value }))
            }
            placeholder="Message to send to customers when offline..."
            rows={4}
            disabled={!localSettings.enabled}
          />
          <p className="text-xs text-muted-foreground">
            This message will be sent after a customer starts a chat when no admin is online
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="delay-seconds" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Reply Delay (seconds)
          </Label>
          <Input
            id="delay-seconds"
            type="number"
            min={1}
            max={60}
            value={localSettings.delaySeconds}
            onChange={(e) =>
              setLocalSettings((prev) => ({
                ...prev,
                delaySeconds: parseInt(e.target.value) || 5,
              }))
            }
            className="w-32"
            disabled={!localSettings.enabled}
          />
          <p className="text-xs text-muted-foreground">
            How many seconds to wait after the customer's first message before sending auto-reply
          </p>
        </div>

        <Button onClick={handleSave} disabled={!hasChanges || isUpdating}>
          {isUpdating ? (
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
