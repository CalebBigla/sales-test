import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Clock3,
  Package,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState, type ElementType } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useBranches } from "@/hooks/useBranches";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

export const Route = createFileRoute("/owner/dashboard")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: OwnerDashboard,
});

const branchColors = ["#2563EB", "#059669", "#0EA5E9", "#0D9488"];
const naira = (value: number) => `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

type Approval = {
  id: string;
  rep: string;
  branch: string;
  currentTarget: number;
  proposedTarget: number;
  manager: string;
};

const initialApprovals: Approval[] = [
  { id: "1", rep: "David Okafor", branch: "Yaba", currentTarget: 250000, proposedTarget: 300000, manager: "Ada Nwosu" },
  { id: "2", rep: "Ibrahim Musa", branch: "Ajah", currentTarget: 220000, proposedTarget: 260000, manager: "Tunde Adebayo" },
];

function OwnerDashboard() {
  const { branches, loading: branchesLoading } = useBranches();
  const { data, loading: activityLoading, error: activityError } = useDashboardData();
  const metrics = useDashboardMetrics();
  const [period, setPeriod] = useState("Month");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [approvals, setApprovals] = useState(initialApprovals);
  const [pendingDecision, setPendingDecision] = useState<{ approval: Approval; action: "approve" | "reject" } | null>(null);

  const staff = metrics.staffBreakdown;
  const submissions = useMemo(
    () => branches.reduce((total, branch) => total + branch.submissionsToday, 0),
    [branches],
  );
  const totalReps = useMemo(
    () => branches.reduce((total, branch) => total + branch.totalRepsToday, 0),
    [branches],
  );
  const submissionRate = totalReps ? Math.round((submissions / totalReps) * 100) : 0;
  const revenue = metrics.totalRevenue;
  const target = metrics.totalTarget;
  const percentage = target ? Math.round((revenue / target) * 100) : 0;
  const updatedAt = new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" }).format(new Date());

  function resolveApproval() {
    if (!pendingDecision) return;
    setApprovals((current) => current.filter((item) => item.id !== pendingDecision.approval.id));
    setPendingDecision(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="min-h-screen lg:ml-[240px]">
        <DashboardHeader period={period} onPeriodChange={setPeriod} updatedAt={updatedAt} />
        <main className="mx-auto max-w-[1440px] p-4 sm:p-5 lg:p-6">
          <div className="space-y-5">
            <KpiCard
              hero
              loading={metrics.loading}
              label={`Revenue this ${period}`}
              value={target ? naira(revenue) : "No sales recorded yet"}
              detail={target ? `${percentage}% of ${naira(target)} target` : "No target set yet"}
              progress={percentage}
              footer={target ? `${naira(Math.max(target - revenue, 0))} remaining` : undefined}
              icon={TrendingUp}
            />

            <section className="grid gap-4 md:grid-cols-2">
              <KpiCard
                loading={branchesLoading}
                label="Total branches"
                value={branches.length.toString()}
                detail={branches.length ? branches.map((branch) => branch.name).join(" · ") : "No branches added yet"}
                icon={Package}
                link={{ label: "View branches", to: "/owner/branches" }}
              />
              <KpiCard
                loading={metrics.loading}
                label="Total staff"
                value={metrics.totalStaff.toString()}
                detail={`${staff.managers} Managers · ${staff.storekeepers} Storekeepers · ${staff.salesReps} Sales Reps`}
                icon={Users}
                link={{ label: "View team", to: "/owner/team" }}
              />
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <OperationalPanel
                loading={branchesLoading}
                icon={AlertTriangle}
                iconClass="bg-red-50 text-[#B91C1C]"
                title="Stock escalations"
                value="2 pending >4hrs"
                description="Requests awaiting branch action."
                tags={["Yaba", "Ajah"]}
                caption="Handled by each branch's team."
              />
              <OperationalPanel
                loading={branchesLoading}
                icon={Package}
                iconClass="bg-amber-50 text-[#B45309]"
                title="Inventory health"
                value="5 products need attention"
                description={`across ${branches.length} ${branches.length === 1 ? "branch" : "branches"}.`}
                link={{ label: "View inventory", to: "/owner/inventory" }}
              />
              <OperationalPanel
                icon={Target}
                iconClass="bg-blue-50 text-[#2563EB]"
                title="Target change requests"
                value={approvals.length ? `${approvals.length} awaiting approval` : "No requests awaiting review"}
                description="Manager-proposed changes require your decision."
                onAction={approvals.length ? () => setReviewOpen(true) : undefined}
                actionLabel="Review"
              />
              <OperationalPanel
                loading={branchesLoading}
                icon={Clock3}
                iconClass="bg-emerald-50 text-[#059669]"
                title="Daily submissions"
                value={totalReps ? `${submissionRate}% org-wide (${submissions}/${totalReps})` : "No reps to report"}
                description={totalReps > submissions ? "Pending: Blessing, Emeka, Ibrahim" : "All sales reps have submitted today."}
                link={{ label: "View team", to: "/owner/team" }}
              />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
              <ActivityFeed loading={activityLoading} error={activityError} activity={data?.recentActivity ?? []} />
              <TeamSnapshotCard loading={metrics.loading} branches={branches} />
            </section>
          </div>
        </main>
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Target change requests</DialogTitle>
            <DialogDescription>Review manager proposals before changing a sales rep's target.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
            {approvals.map((approval, index) => (
              <div key={approval.id} className="rounded-lg border border-border p-3 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{approval.rep}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">Requested by {approval.manager}</p>
                  </div>
                  <BranchTag name={approval.branch} color={branchColors[index % branchColors.length]} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {naira(approval.currentTarget)} current target <span className="px-1">→</span>
                  <span className="font-semibold text-foreground">{naira(approval.proposedTarget)} proposed target</span>
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => setPendingDecision({ approval, action: "approve" })}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPendingDecision({ approval, action: "reject" })}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {!approvals.length && <EmptyState title="No target changes awaiting approval" />}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingDecision)} onOpenChange={(open) => !open && setPendingDecision(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{pendingDecision?.action === "approve" ? "Approve" : "Reject"} target change?</DialogTitle>
            <DialogDescription>
              {pendingDecision?.approval.rep}'s target will {pendingDecision?.action === "approve" ? "change to" : "remain at"} {naira(pendingDecision?.action === "approve" ? pendingDecision.approval.proposedTarget : pendingDecision?.approval.currentTarget ?? 0)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDecision(null)}>Cancel</Button>
            <Button variant={pendingDecision?.action === "reject" ? "destructive" : "default"} onClick={resolveApproval}>
              Confirm {pendingDecision?.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DashboardHeader({ period, onPeriodChange, updatedAt }: { period: string; onPeriodChange: (value: string) => void; updatedAt: string }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Last updated today at {updatedAt}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5" aria-label="Dashboard period">
            {["Day", "Week", "Month", "Quarter"].map((item) => (
              <button key={item} onClick={() => onPeriodChange(item)} className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3 ${period === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {item}
              </button>
            ))}
          </div>
          <button aria-label="Notifications" className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#B91C1C]" />
          </button>
        </div>
      </div>
    </header>
  );
}

function KpiCard({ hero = false, loading, label, value, detail, progress, footer, icon: Icon, link }: { hero?: boolean; loading?: boolean; label: string; value: string; detail: string; progress?: number; footer?: string; icon: ElementType; link?: { label: string; to: "/owner/branches" | "/owner/team" } }) {
  if (loading) return <Card><CardContent className={hero ? "p-6" : "p-5"}><Skeleton className="h-4 w-28" /><Skeleton className="mt-4 h-9 w-52" /><Skeleton className="mt-4 h-2 w-full" /></CardContent></Card>;
  return (
    <Card className={hero ? "border-primary/20 bg-gradient-to-br from-card to-primary/[0.03]" : ""}>
      <CardContent className={hero ? "p-5 sm:p-6" : "p-5"}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">{label}</p>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
        </div>
        <p className={`${hero ? "mt-3 text-3xl sm:text-4xl" : "mt-3 text-2xl"} font-bold tracking-tight text-foreground`}>{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        {progress !== undefined && <><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${Math.min(progress, 100)}%` }} /></div>{footer && <p className="mt-2 text-right text-xs text-muted-foreground">{footer}</p>}</>}
        {link && <Link to={link.to} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{link.label}<ArrowRight className="h-3.5 w-3.5" /></Link>}
      </CardContent>
    </Card>
  );
}

function OperationalPanel({ loading, icon: Icon, iconClass, title, value, description, caption, tags, link, onAction, actionLabel }: { loading?: boolean; icon: ElementType; iconClass: string; title: string; value: string; description: string; caption?: string; tags?: string[]; link?: { label: string; to: "/owner/inventory" | "/owner/team" }; onAction?: () => void; actionLabel?: string }) {
  if (loading) return <Card><CardContent className="p-5"><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="mt-4 h-5 w-3/4" /><Skeleton className="mt-2 h-4 w-full" /></CardContent></Card>;
  return <Card><CardContent className="p-5"><span className={`grid h-9 w-9 place-items-center rounded-lg ${iconClass}`}><Icon className="h-4 w-4" /></span><p className="mt-4 text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">{title}</p><p className="mt-2 font-semibold text-foreground">{value}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p>{tags && <div className="mt-3 flex flex-wrap gap-1.5">{tags.map((tag, index) => <BranchTag key={tag} name={tag} color={branchColors[index % branchColors.length]} />)}</div>}{caption && <p className="mt-3 text-xs text-muted-foreground">{caption}</p>}{link && <Link to={link.to} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{link.label}<ArrowRight className="h-3.5 w-3.5" /></Link>}{onAction && <button onClick={onAction} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{actionLabel}<ArrowRight className="h-3.5 w-3.5" /></button>}</CardContent></Card>;
}

function ActivityFeed({ loading, error, activity }: { loading: boolean; error: string | null; activity: Array<{ id: string; actor: string; branch: string; action: string; amount?: number; timestamp: string }> }) {
  return <Card><CardContent className="p-0"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold text-foreground">Recent activity</h2><p className="mt-0.5 text-sm text-muted-foreground">Latest activity across your branches</p></div><Link to="/owner/audit-log" className="text-sm font-semibold text-primary hover:underline">View full log <ArrowRight className="inline h-3.5 w-3.5" /></Link></div>{loading ? <div className="space-y-4 p-5">{[1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-10 w-full" />)}</div> : error ? <RetryState /> : activity.length ? <ul className="divide-y divide-border">{activity.slice(0, 5).map((item, index) => <li key={item.id} className="flex items-center gap-3 px-5 py-3.5"><ActivityIcon action={item.action} /><div className="min-w-0 flex-1"><p className="text-sm text-foreground"><span className="font-semibold">{item.actor}</span> {item.action}{item.amount ? ` · ${naira(item.amount)}` : ""}</p><p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(item.timestamp)}</p></div><BranchTag name={item.branch} color={branchColors[index % branchColors.length]} /></li>)}</ul> : <EmptyState title="No activity recorded yet" />}</CardContent></Card>;
}

function TeamSnapshotCard({ loading, branches }: { loading: boolean; branches: Array<{ name: string; revenue: number; target: number | null }> }) {
  const reps = [{ name: "David Okafor", branch: "Yaba", percent: 118 }, { name: "Chiamaka Obi", branch: "Yaba", percent: 104 }, { name: "Ibrahim Musa", branch: "Ajah", percent: 91 }, { name: "Blessing Ade", branch: "Ajah", percent: 76 }, { name: "Emeka Ibe", branch: "Yaba", percent: 68 }, { name: "Tomiwa Cole", branch: "Ajah", percent: 54 }];
  if (loading) return <Card><CardContent className="space-y-4 p-5"><Skeleton className="h-5 w-40" />{[1, 2, 3].map((item) => <Skeleton key={item} className="h-9 w-full" />)}</CardContent></Card>;
  if (!branches.length) return <Card><CardContent className="p-5"><h2 className="font-semibold">Team performance</h2><EmptyState title="No team performance to show yet" /></CardContent></Card>;
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-foreground">Team performance</h2><p className="mt-0.5 text-sm text-muted-foreground">Top and bottom reps by target progress</p></div><Link to="/owner/team" className="text-sm font-semibold text-primary hover:underline">View full team</Link></div><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><PerformanceList label="Top 3" reps={reps.slice(0, 3)} /><PerformanceList label="Bottom 3" reps={reps.slice(-3)} /></div><Link to="/owner/team" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">View stock in the field <ArrowRight className="h-3.5 w-3.5" /></Link></CardContent></Card>;
}

function PerformanceList({ label, reps }: { label: string; reps: Array<{ name: string; branch: string; percent: number }> }) { return <div><p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">{label}</p><div className="mt-2 space-y-2">{reps.map((rep, index) => <div key={rep.name} className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{rep.name}</p><BranchTag name={rep.branch} color={branchColors[index % branchColors.length]} /></div><span className={`text-sm font-bold ${rep.percent >= 100 ? "text-[#059669]" : rep.percent >= 80 ? "text-[#B45309]" : "text-[#B91C1C]"}`}>{rep.percent}% <span className="text-xs font-medium">{rep.percent >= 100 ? "On target" : rep.percent >= 80 ? "At risk" : "Behind"}</span></span></div>)}</div></div>; }

function BranchTag({ name, color }: { name: string; color: string }) { return <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color, backgroundColor: `${color}14` }}>{name}</span>; }
function ActivityIcon({ action }: { action: string }) { const Icon = action.includes("sale") ? TrendingUp : action.includes("fulfilled") ? Package : action.includes("target") ? Target : action.includes("onboarded") ? Users : AlertTriangle; return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>; }
function EmptyState({ title }: { title: string }) { return <div className="p-6 text-center text-sm text-muted-foreground">{title}</div>; }
function RetryState() { return <div className="p-6 text-center"><p className="text-sm text-muted-foreground">We couldn't load this section.</p><button onClick={() => window.location.reload()} className="mt-2 text-sm font-semibold text-primary hover:underline">Try again</button></div>; }
function relativeTime(timestamp: string) { const minutes = Math.max(1, Math.round((Date.now() - new Date(timestamp).getTime()) / 60000)); return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`; }
