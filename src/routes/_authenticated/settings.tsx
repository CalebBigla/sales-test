/**
 * Settings page for notification preferences and report exports
 */

import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { NotificationSettings } from "@/components/notification-settings";
import { ReportExport } from "@/components/report-export";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <DashboardShell>
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-display text-foreground">Settings</h1>
          <p className="text-caption text-muted-foreground mt-1">
            Manage your notification preferences and export reports
          </p>
        </div>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="reports">Reports & Exports</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-6">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportExport />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
