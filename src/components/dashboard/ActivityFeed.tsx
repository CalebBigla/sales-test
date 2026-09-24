import { Link } from "@tanstack/react-router";

interface ActivityFeedProps {
  activityData: Array<{
    id: number;
    actor: string;
    action: string;
    amount: number | null;
    timestamp: Date;
    type: "sale" | "target" | "stock_approval" | "stock_rejected" | "stock_fulfilled" | "user_invite" | "user_deactivate";
  }>;
}

export function ActivityFeed({ activityData }: ActivityFeedProps) {
  // Get status color and icon based on type
  const getActivityStatus = (type: string) => {
    switch (type) {
      case "sale":
        return { color: "#059669", icon: "💰", label: "Sale Recorded" }; // green
      case "target":
        return { color: "#2563EB", icon: "🎯", label: "Target Updated" }; // blue
      case "stock_approval":
        return { color: "#059669", icon: "✅", label: "Stock Approved" }; // green
      case "stock_rejected":
        return { color: "#B91C1C", icon: "❌", label: "Stock Rejected" }; // red
      case "stock_fulfilled":
        return { color: "#059669", icon: "📦", label: "Stock Fulfilled" }; // green
      case "user_invite":
        return { color: "#2563EB", icon: "👥", label: "User Invited" }; // blue
      case "user_deactivate":
        return { color: "#B91C1C", icon: "🚫", label: "User Deactivated" }; // red
      default:
        return { color: "#64748B", icon: "•", label: "Activity" }; // muted
    }
  };

  // Format time ago
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
      return interval + "y";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
      return interval + "mo";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
      return interval + "d";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
      return interval + "h";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
      return interval + "m";
    }
    return Math.floor(seconds) + "s";
  };

  return (
    <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-lg p-6">
      <h2 className="mb-5 text-[18px] font-[600] text-[#12233D] flex items-center space-x-2">
        <span className="h-4 w-4 rounded bg-[#2563EB]/10 flex items-center justify-center text-[10px] text-[#2563EB]">
          {"•"}
        </span>
        Recent Activity
      </h2>

      <div className="space-y-4">
        {activityData.slice(0, 5).map((activity) => {
          const { color, icon, label } = getActivityStatus(activity.type);
          return (
            <div key={activity.id} className="flex items-start space-x-4">
              {/* Status indicator */}
              <div className="flex-shrink-0 flex items-center">
                <div className={`w-3 h-3 rounded-full ${color}`}></div>
              </div>

              {/* Activity details */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2 text-[14px] font-[500] text-[#334155]">
                  {activity.actor} {activity.action}
                  {activity.amount !== null && (
                    <span className="ml-1 text-[14px] font-[600] text-[#12233D]">
                      {activity.amount.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-[12px] font-[400] text-[#64748B]">
                  {timeAgo(activity.timestamp)} • {label}
                </p>
              </div>
            </div>
          );
        })}

        {/* Show "View full audit link" if there are more than 5 activities */}
        {activityData.length > 5 && (
          <div className="mt-6 pt-4 border-t border-[#CBD5E1] text-center">
            <Link to="/owner/audit-log" className="text-[14px] font-[600] text-[#2563EB] flex items-center space-x-1 hover:underline transition-colors">
              View full audit log →
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}