import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/dashboard-shell";
import { StockQueue } from "@/components/stock-queue";
import { getTodayFulfilmentCount } from "@/lib/sales.functions";
import { Package, CheckCircle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/storekeeper")({
  head: () => ({
    meta: [
      { title: "Storekeeper dashboard — SalesFlow Pro" },
      {
        name: "description",
        content: "Storekeeper view: stock levels, stock requests and catalogue.",
      },
      { property: "og:title", content: "Storekeeper dashboard — SalesFlow Pro" },
      { property: "og:description", content: "Storekeeper view of stock and requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <DashboardShell role="storekeeper">
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-slate-500">
          Dashboard coming soon
        </h2>
      </div>
    </DashboardShell>
  );
}