import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import StatCard from "@/components/dashboard/StatCard";
import BranchCard from "@/components/dashboard/BranchCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import ActivityItem from "@/components/dashboard/ActivityItem";
import ApprovalButton from "@/components/dashboard/ApprovalButton";
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

  // Loading state - show skeletons
  if (loading || branchesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="ml-[240px]">
          <Header />
          <main className="p-5">
            <div className="space-y-6">
              {/* Zone 1: Business Snapshot */}
              <div className="grid gap-4 md:grid-cols-2">
                <StatCard skeleton />
                <StatCard skeleton />
              </div>
              {/* Zone 2: Revenue This Month */}
              <StatCard skeleton className="flex flex-col items-start" />
              {/* Zone 3: Branch Performance */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Branch Performance
                </h2>
                <p className="text-sm text-muted-foreground">Real-time Status</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <BranchCard skeleton />
                  <BranchCard skeleton />
                </div>
              </div>
              {/* Zone 4: Secondary Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <StatCard skeleton />
                <StatCard skeleton />
              </div>
              {/* Zone 5: Approvals Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <StatCard skeleton action={<ApprovalButton linkTo="/owner/target-change-requests" />} />
                <StatCard skeleton dot="#B91C1C" />
              </div>
              {/* Zone 6: Revenue Performance Chart */}
              <RevenueChart skeleton className="h-48" />
              {/* Zone 7: Recent Activity */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground mb-1">
                  Recent Activity
                </h2>
                <div className="flex justify-between items-center mb-2">
                  <a href="/owner/audit-log" className="text-[12px] font-[600] text-[#2563EB] uppercase">
                    VIEW ALL AUDIT LOG ?
                  </a>
                </div>
                <div className="space-y-2">
                  <ActivityItem skeleton />
                  <ActivityItem skeleton />
                  <ActivityItem skeleton />
                  <ActivityItem skeleton />
                  <ActivityItem skeleton />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error state
  if (error || branchesError) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <div className="bg-white rounded-lg border border-[#E5E9F0] shadow p-8 text-center max-w-md">
          <h2 className="text-[24px] font-[700] text-[#0F1B33] mb-4">
            Something went wrong
          </h2>
          <p className="text-[14px] font-[400] text-[#334155] mb-6">
            We're having trouble loading your dashboard. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#2563EB] text-white rounded-lg font-[600] hover:bg-[#1d4ed8] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Populated state - data is ready
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-[240px]">
        <Header />
        <main className="p-5">
          {/* Zone 1: Business Snapshot */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <StatCard
              label="TOTAL BRANCHES"
              valueFontSize="small"
              value={branches.length}
              caption={branches.map(b => b.name).join(", ")}
              linkText="Manage branches ?"
              linkTo="/owner/branches"
            />
            <StatCard
              label="TOTAL STAFF"
              valueFontSize="small"
              value={metrics.totalStaff}
              caption={`${metrics.staffBreakdown.managers} Managers · ${metrics.staffBreakdown.storekeepers} Storekeepers · ${metrics.staffBreakdown.salesReps} Sales Reps`}
              linkText="Manage team ?"
              linkTo="/owner/team"
            />
          </div>

          {/* Zone 2: Revenue This Month */}
          <StatCard
            label="REVENUE THIS MONTH"
            value={`?${metrics.totalRevenue.toLocaleString()}`}
            caption={`${metrics.revenuePercentage.toFixed(0)}% of ?${metrics.totalTarget.toLocaleString()} target`}
            className="flex flex-col items-start"
          >
            <div className="mt-4 w-full">
              <div className="w-full">
                <div className="h-2.5 w-full bg-[#E5E9F0] rounded-full overflow-hidden">
                  <div className="h-2.5 w-[80%] bg-[#2563EB] rounded-full"></div>
                </div>
              </div>
              <div className="mt-2 text-[12px] font-[400] text-[#64748B] text-right">
                ?750,000 remaining
              </div>
            </div>
          </StatCard>

          {/* Zone 3: Branch Performance - FIXED: Use complete branch data directly */}
          <div className="space-y-4 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-1">
              Branch Performance
            </h2>
            <p className="text-sm text-muted-foreground">Real-time Status</p>
            <div className="grid gap-4 md:grid-cols-2">
              {branches.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  onClick={() => {
                    // navigate to branch detail
                  }}
                />
              ))}
            </div>
          </div>

          {/* Zone 4: Secondary Row */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <StatCard
              label="INVENTORY HEALTH"
              value="5 products need attention across 2 branches"
              linkText="View inventory ?"
              linkTo="/owner/inventory"
            />
            <StatCard
              label="DAILY SUBMISSIONS"
              value="55% org-wide (6/11)"
              caption="Pending: Blessing, Emeka, Ibrahim…"
              linkText="View team ?"
              linkTo="/owner/team"
            />
          </div>

          {/* Zone 5: Approvals Row */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <StatCard
              label="TARGET CHANGE REQUESTS"
              value="3 awaiting approval"
              action={
                <ApprovalButton linkTo="/owner/target-change-requests" />
              }
            />
            <StatCard
              label="STOCK ESCALATIONS"
              value="2 pending >4hrs"
              caption="HANDLED BY EACH BRANCH'S TEAM"
              dot="#B91C1C"
            />
          </div>

          {/* Zone 6: Revenue Performance Chart */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-1">
              Revenue Performance
            </h2>
            <RevenueChart
              branches={branches}
              monthlyData={data.monthlyRevenue}
              target={data.orgTarget}
            />
          </div>

          {/* Zone 7: Recent Activity */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground mb-1">
              Recent Activity
            </h2>
            <div className="flex justify-between items-center mb-2">
              <a href="/owner/audit-log" className="text-[12px] font-[600] text-[#2563EB] uppercase">
                VIEW ALL AUDIT LOG ?
              </a>
            </div>
            <div className="space-y-2">
              {data.recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}




