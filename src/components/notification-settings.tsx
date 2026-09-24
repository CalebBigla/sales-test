/**
 * Notification Settings Component
 * Allows users to configure their notification preferences
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../lib/notifications.functions";

export function NotificationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    sms_enabled: false,
    daily_reminder_enabled: true,
    low_stock_alerts_enabled: true,
    behind_pace_alerts_enabled: true,
    monthly_report_enabled: true,
    reminder_time: "08:00:00",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const prefs = await getNotificationPreferences();
        if (prefs) {
          setPreferences(prefs);
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load notification preferences",
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotificationPreferences({ data: preferences });
      toast({
        title: "Success",
        description: "Notification preferences saved successfully",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notification preferences",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: string, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Loading preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Configure how and when you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Notification Channels</h3>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-enabled">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              id="email-enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => handleToggle("email_enabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div className="space-y-0.5">
              <Label htmlFor="sms-enabled">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via SMS (Coming soon)
              </p>
            </div>
            <Switch
              id="sms-enabled"
              checked={preferences.sms_enabled}
              disabled
              onCheckedChange={(checked) => handleToggle("sms_enabled", checked)}
            />
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Notification Types</h3>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="daily-reminder">Daily Submission Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Remind me to submit daily sales (Sales Reps only)
              </p>
            </div>
            <Switch
              id="daily-reminder"
              checked={preferences.daily_reminder_enabled}
              onCheckedChange={(checked) => handleToggle("daily_reminder_enabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="low-stock">Low Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alert me when inventory is running low (Storekeepers & Managers)
              </p>
            </div>
            <Switch
              id="low-stock"
              checked={preferences.low_stock_alerts_enabled}
              onCheckedChange={(checked) => handleToggle("low_stock_alerts_enabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="behind-pace">Behind Pace Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alert me when reps are behind target (Managers only)
              </p>
            </div>
            <Switch
              id="behind-pace"
              checked={preferences.behind_pace_alerts_enabled}
              onCheckedChange={(checked) => handleToggle("behind_pace_alerts_enabled", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="monthly-report">Monthly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive automated monthly reports via email
              </p>
            </div>
            <Switch
              id="monthly-report"
              checked={preferences.monthly_report_enabled}
              onCheckedChange={(checked) => handleToggle("monthly_report_enabled", checked)}
            />
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
