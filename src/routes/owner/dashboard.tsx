import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, AlertTriangle } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useBranches } from "@/hooks/useBranches";

export const Route = createFileRoute("/owner/dashboard")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
    return { user: data.user };
  },
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const { data, loading, error } = useDashboardData();
  const metrics = useDashboardMetrics();
  const { branches, loading: branchesLoading, error: branchesError } = useBranches();

  // Loading state
  if (loading || branchesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="ml-[240px]">
          <Header />
          <main className="p-5">
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (error || branchesError) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="ml-[240px]">
          <Header />
          <main className="p-5">
            <div className="bg-card rounded-lg border border-border shadow-sm p-8 text-center max-w-md mx-auto">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                We're having trouble loading your dashboard. Please try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const pct = metrics.revenuePercentage;
  const remaining = metrics.totalTarget - metrics.totalRevenue;
  const compactNaira = (value: number) =>
    value >= 1000 ? `₦${Math.round(value / 1000)}k` : `₦${value}`;
  const naira = (value: number) =>
    `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-[240px]">
        <Header />
        <main className="p-5">
          <div className="space-y-4">
            {/* Revenue Summary Card */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Revenue this month
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {naira(metrics.totalRevenue)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pct.toFixed(0)}% of {naira(metrics.totalTarget)} target
                </p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-right text-xs text-muted-foreground">
                  {naira(remaining)} remaining
                </p>
              </CardContent>
            </Card>

            {/* Branch Performance Section */}
            <section className="space-y-3">
              <div className="flex items-baseline gap-3">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Branch Performance
                </h2>
                <span className="text-xs text-muted-foreground">Real-time status</span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {branches.map((b) => {
                  const share = Math.round((b.revenue / b.target) * 100);
                  return (
                    <Card key={b.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">{b.name}</h3>
                            <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
                              {naira(b.revenue)}{" "}
                              <span className="text-sm font-normal text-muted-foreground">
                                of {naira(b.target)}
                              </span>
                            </p>
                          </div>
                          <Badge variant={share < 80 ? "destructive" : "secondary"}>
                            {share < 80 ? "Behind" : "At Risk"} ({share}%)
                          </Badge>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            Today&apos;s submissions: {b.submissionsToday}/{b.totalRepsToday} reps
                          </span>
                          <Link
                            to="/owner/branches/$branchId"
                            params={{ branchId: b.id }}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            View Detail
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 lg:grid-cols-2">
              <StatCard
                label="Inventory health"
                headline="5 products need attention"
                sub="across 2 branches"
                linkLabel="View inventory"
                to="/owner/inventory"
              />
              <StatCard
                label="Daily submissions"
                headline={`${Math.round((metrics.staffBreakdown.salesReps * 0.55))}/${metrics.staffBreakdown.salesReps} org-wide`}
                sub="(55%)"
                detail="Pending: Blessing, Emeka, Ibrahim…"
                linkLabel="View team"
                to="/owner/team"
              />

              <Card>
                <CardContent className="flex items-center justify-between gap-4 pt-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Target change requests
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">
                      3 awaiting approval
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/owner/target-change-requests">
                      Review <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between gap-4 pt-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Stock escalations
                    </p>
                    <p className="mt-2 text-xl font-semibold text-foreground">2 pending &gt;4hrs</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Handled by each branch&apos;s team
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Performance Chart */}
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base">Revenue Performance</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthlyRevenue} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      />
                      <YAxis
                        tickFormatter={(v: number) => compactNaira(v)}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        width={64}
                      />
                      <Tooltip
                        formatter={(v: number) => naira(v)}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          color: "var(--popover-foreground)",
                          fontSize: 12,
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12, paddingBottom: 12 }}
                      />
                      {branches.map((branch, idx) => (
                        <Line
                          key={branch.id}
                          type="monotone"
                          dataKey={branch.name.toLowerCase()}
                          name={branch.name}
                          stroke={`var(--chart-${idx + 1})`}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                      <Line
                        type="monotone"
                        dataKey="target"
                        name="Target"
                        stroke="var(--chart-5)"
                        strokeDasharray="6 6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b border-border">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <Link
                  to="/owner/audit-log"
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary hover:underline"
                >
                  View all audit log →
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {data.recentActivity.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-6 py-3.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold bg-primary/10 text-primary"
                      >
                        {a.branch?.[0] || "A"}
                      </span>
                      <div>
                        <p className="text-sm text-foreground">
                          <span className="text-muted-foreground">[{a.branch || "System"}]</span> {a.description}
                        </p>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          {new Date(a.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  label,
  headline,
  sub,
  detail,
  linkLabel,
  to,
}: {
  label: string;
  headline: string;
  sub?: string;
  detail?: string;
  linkLabel: string;
  to: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-lg font-semibold text-foreground">
          {headline} {sub && <span className="font-normal text-muted-foreground">{sub}</span>}
        </p>
        {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
        <Link
          to={to}
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          {linkLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
