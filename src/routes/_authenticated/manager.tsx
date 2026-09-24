import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ManagerDashboardContent } from "@/components/manager-dashboard-content";

export const Route = createFileRoute("/_authenticated/manager")({
  head: () => ({
    meta: [
      { title: "Manager dashboard — SalesFlow Pro" },
      { name: "description", content: "Manager view: own team, targets, inventory and reports." },
      { property: "og:title", content: "Manager dashboard — SalesFlow Pro" },
      { property: "og:description", content: "Manager view of your team's workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <DashboardShell role="manager">
      <h1 className="text-display text-foreground">Manager dashboard</h1>
      <p className="text-body mt-1 max-w-xl text-muted-foreground">
        Monitor team performance, approve requests, and identify reps who need support.
      </p>
      <ManagerDashboardContent />
    </DashboardShell>
  ),
});
