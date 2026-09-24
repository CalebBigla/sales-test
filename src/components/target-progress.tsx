import type { TargetWithProgress } from "@/lib/sales.functions";

export function TargetProgress({ target }: { target: TargetWithProgress }) {
  const progressClass = target.isBehindPace
    ? "bg-destructive"
    : target.percentage >= 100
      ? "bg-success"
      : "bg-primary";

  const statusText = target.isBehindPace
    ? "Behind pace"
    : target.percentage >= 100
      ? "Target achieved"
      : "On track";

  const statusColor = target.isBehindPace
    ? "text-destructive"
    : target.percentage >= 100
      ? "text-success"
      : "text-primary";

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-body font-medium text-card-foreground">{target.userName}</h3>
          <p className="text-caption text-muted-foreground">
            {new Date(target.periodStart).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-body font-medium text-card-foreground">
            ${target.achievedAmount.toLocaleString()} / ${target.targetAmount.toLocaleString()}
          </p>
          <p className={`text-caption font-medium ${statusColor}`}>
            {target.percentage.toFixed(1)}% · {statusText}
          </p>
        </div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${progressClass}`}
          style={{ width: `${Math.min(100, target.percentage)}%` }}
        />
      </div>
      {target.remaining > 0 && (
        <p className="text-caption mt-1 text-muted-foreground">
          ${target.remaining.toLocaleString()} remaining
        </p>
      )}
    </div>
  );
}

export function TargetProgressCompact({ target }: { target: TargetWithProgress }) {
  const progressClass = target.isBehindPace
    ? "bg-destructive"
    : target.percentage >= 100
      ? "bg-success"
      : "bg-primary";

  return (
    <div className="rounded-md border border-border bg-card p-2">
      <div className="flex items-center justify-between">
        <p className="text-caption text-muted-foreground">Monthly Target</p>
        <p className="text-caption font-medium text-card-foreground">
          {target.percentage.toFixed(0)}%
        </p>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all ${progressClass}`}
          style={{ width: `${Math.min(100, target.percentage)}%` }}
        />
      </div>
      <p className="text-caption mt-1 text-muted-foreground">
        ${target.achievedAmount.toLocaleString()} / ${target.targetAmount.toLocaleString()}
      </p>
    </div>
  );
}
