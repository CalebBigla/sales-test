import { Link } from "@tanstack/react-router";
import { Branch } from "@/hooks/useBranches";

interface BranchCardProps {
  branch?: Branch;
  onClick?: () => void;
  skeleton?: boolean;
}

export default function BranchCard({ branch, onClick, skeleton }: BranchCardProps) {
  if (skeleton) {
    return (
      <div
        className="bg-card rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-all duration-200"
      >
        <div className="p-4">
          {/* Badge placeholder */}
          <div className="absolute top-2 right-2">
            <span className="w-2 h-2 rounded-full bg-[#E5E9F0]"></span>
          </div>
          <div className="space-y-3">
            {/* Branch name placeholder */}
            <div className="h-4 w-32 bg-[#E5E9F0] rounded"></div>
            {/* Revenue placeholder */}
            <div className="h-4 w-24 bg-[#E5E9F0] rounded"></div>
            {/* Submissions placeholder */}
            <div className="flex justify-between items-center">
              <div className="h-4 w-1/2 bg-[#E5E9F0] rounded"></div>
              <div className="h-4 w-1/3 bg-[#E5E9F0] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure branch is defined (should be when !skeleton)
  if (!branch) {
    // Fallback to skeleton if branch is undefined (should not happen in normal flow)
    return (
      <div
        className="bg-card rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-all duration-200"
      >
        <div className="p-4">
          <div className="text-center text-[64748B] italic">Loading...</div>
        </div>
      </div>
    );
  }

  // Validate required fields exist - DEFENSIVE RENDERING
  const hasRequiredFields = 
    typeof branch.revenue === 'number' &&
    typeof branch.salesCount === 'number' &&
    typeof branch.submissionsToday === 'number' &&
    typeof branch.totalRepsToday === 'number';

  if (!hasRequiredFields) {
    console.error('BranchCard received incomplete branch data:', branch);
    // Return skeleton UI instead of crashing
    return (
      <div
        className="bg-card rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-all duration-200"
      >
        <div className="p-4">
          <div className="space-y-3">
            {/* Branch name placeholder */}
            <div className="h-4 w-32 bg-[#E5E9F0] rounded"></div>
            {/* Revenue placeholder */}
            <div className="h-4 w-24 bg-[#E5E9F0] rounded"></div>
            {/* Submissions placeholder */}
            <div className="flex justify-between items-center">
              <div className="h-4 w-1/2 bg-[#E5E9F0] rounded"></div>
              <div className="h-4 w-1/3 bg-[#E5E9F0] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Null-safe target handling (target can be null)
  const percentage = branch.target && branch.target > 0
    ? Math.round((branch.revenue / branch.target) * 100)
    : 0;

  let statusText = "";
  let statusColor: "green" | "amber" | "red" = "green";
  if (percentage >= 100) {
    statusText = `On Target (${percentage}%)`;
    statusColor = "green";
  } else if (percentage >= 80) {
    statusText = `At Risk (${percentage}%)`;
    statusColor = "amber";
  } else {
    statusText = `Behind (${percentage}%)`;
    statusColor = "red";
  }

  // Branch color for avatar dot: Yaba = blue, Ajah = green
  const branchColor = branch.color || "#2563EB";

  // Compute status badge className
  let statusClassName = "";
  if (statusText) {
    const bgColor =
      statusColor === "green"
        ? "#059669"
        : statusColor === "amber"
        ? "#B45309"
        : "#B91C1C";
    statusClassName = statusColor === "green" ? "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-success/10 text-success" : statusColor === "amber" ? "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-warning/10 text-warning-foreground" : "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-danger/10 text-danger";
  }

  return (
    <div
      className="bg-card rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={onClick}
    >
      <div className="p-4 relative">
        {/* Status badge at top-right */}
        <div className="absolute top-2 right-2">
          <span className={statusClassName}>
            {statusText}
          </span>
        </div>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-base font-semibold text-foreground">{branch.name}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-base font-medium text-foreground">
            ₦{branch.revenue.toLocaleString()} of ₦{branch.target?.toLocaleString() ?? 'No target'}
          </p>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            TODAY'S SUBMISSIONS: {branch.submissionsToday}/{branch.totalRepsToday} REPS
          </div>
          <Link
            to={`/owner/branches/${branch.id}`}
            className="text-sm font-semibold text-primary hover:underline underline-offset-4"
            onClick={(e) => e.stopPropagation()}
          >
            View Detail →
          </Link>
        </div>
      </div>
    </div>
  );
}



