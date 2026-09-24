import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTargets, setTarget } from "@/lib/sales.functions";
import { TargetProgress } from "@/components/target-progress";

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-3 rounded-lg border border-border bg-card p-3">
      <h2 className="text-heading text-card-foreground">{title}</h2>
      {subtitle && <p className="text-caption mt-1 text-muted-foreground">{subtitle}</p>}
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function TargetsManager() {
  const queryClient = useQueryClient();
  const fetchTargets = useServerFn(listTargets);
  const updateTarget = useServerFn(setTarget);

  const targets = useQuery({ queryKey: ["all-targets"], queryFn: () => fetchTargets() });

  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return updateTarget({
        data: {
          userId,
          periodStart: periodStart.toISOString().split("T")[0],
          periodEnd: periodEnd.toISOString().split("T")[0],
          targetAmount: Number(targetAmount),
        },
      });
    },
    onMutate: () => setFormError(null),
    onError: (error) =>
      setFormError(error instanceof Error ? error.message : "Could not set target"),
    onSuccess: () => {
      setUserId("");
      setTargetAmount("");
      setShowForm(false);
      void queryClient.invalidateQueries({ queryKey: ["all-targets"] });
    },
  });

  // Get current month targets
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentTargets = (targets.data ?? []).filter((t) => t.periodStart.startsWith(currentMonth));
  const otherTargets = (targets.data ?? []).filter((t) => !t.periodStart.startsWith(currentMonth));

  // Get unique users from targets
  const users = Array.from(
    new Map(
      (targets.data ?? []).map((t) => [t.userId, { id: t.userId, name: t.userName }]),
    ).values(),
  );

  return (
    <>
      <Panel
        title="Team targets"
        subtitle="Monthly sales targets with real-time progress. Behind pace = >20% behind expected."
      >
        {targets.isPending ? (
          <p className="text-caption text-muted-foreground">Loading targets…</p>
        ) : currentTargets.length === 0 ? (
          <p className="text-caption text-muted-foreground">No targets set for this month yet.</p>
        ) : (
          <div className="grid gap-2">
            {currentTargets.map((t) => (
              <TargetProgress key={t.id} target={t} />
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-caption rounded-md bg-primary px-3 py-1 font-medium text-primary-foreground"
          >
            {showForm ? "Cancel" : "Set target"}
          </button>
        </div>

        {showForm && (
          <form
            className="mt-3 grid gap-2 rounded-md border border-border p-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <label className="text-caption text-muted-foreground sm:col-span-2">
              Sales rep
              <select
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="text-body mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-foreground"
              >
                <option value="">Choose a rep…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-caption text-muted-foreground">
              Target amount ($)
              <input
                required
                type="number"
                min={0}
                step={0.01}
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                className="text-body mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-foreground"
              />
            </label>
            <div className="flex items-end sm:col-span-3">
              <button
                disabled={save.isPending}
                className="text-caption rounded-md bg-primary px-3 py-1 font-medium text-primary-foreground disabled:opacity-50"
              >
                {save.isPending ? "Saving…" : "Set target"}
              </button>
            </div>
            {formError && (
              <p className="text-caption text-destructive sm:col-span-3">{formError}</p>
            )}
            <p className="text-caption text-muted-foreground sm:col-span-3">
              Setting a target for the current month (
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}).
            </p>
          </form>
        )}
      </Panel>

      {otherTargets.length > 0 && (
        <Panel title="Past targets">
          <div className="grid gap-2">
            {otherTargets.slice(0, 10).map((t) => (
              <TargetProgress key={t.id} target={t} />
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
