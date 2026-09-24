import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/dashboard-shell";
import { StockRequestForm } from "@/components/stock-request-form";
import { SalesEntryForm } from "@/components/sales-entry-form";
import { SubmissionReminderBanner } from "@/components/submission-reminder";
import { getMyTarget } from "@/lib/sales.functions";
import { TrendingUp, Target, DollarSign, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sales-rep")({
  head: () => ({
    meta: [
      { title: "Sales rep dashboard — SalesFlow Pro" },
      {
        name: "description",
        content: "Sales representative view: own sales, stock requests and targets.",
      },
      { property: "og:title", content: "Sales rep dashboard — SalesFlow Pro" },
      { property: "og:description", content: "Sales representative view of your own numbers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardShell role="sales_rep">
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-slate-500">
          Dashboard coming soon
        </h2>
      </div>
    </DashboardShell>
  );
}