interface Activity {
  id: string;
  actor: string;
  branch: "Yaba" | "Ajah"; // or just string
  action: string;
  amount?: number;
  timestamp: string; // or Date, but we'll use string for simplicity
}

interface ActivityItemProps {
  activity?: Activity;
  skeleton?: boolean;
}

export default function ActivityItem({ activity, skeleton }: ActivityItemProps) {
  // Skeleton state
  if (skeleton) {
    return (
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-3 h-3 rounded-full bg-[#E5E9F0]"></div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-[#E5E9F0] rounded"></div>
          <div className="h-3 w-1/4 bg-[#E5E9F0] rounded"></div>
        </div>
      </div>
    );
  }

  // Guard: ensure activity is defined
  if (!activity) {
    return (
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-3 h-3 rounded-full bg-[#E5E9F0]"></div>
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-[400] text-[#64748B] italic">Loading...</p>
        </div>
      </div>
    );
  }

  // Validate required fields
  const hasRequiredFields = 
    typeof activity.actor === 'string' &&
    typeof activity.branch === 'string' &&
    typeof activity.action === 'string' &&
    typeof activity.timestamp === 'string';

  if (!hasRequiredFields) {
    console.error('ActivityItem received incomplete activity data:', activity);
    // Return skeleton instead of crashing
    return (
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-3 h-3 rounded-full bg-[#E5E9F0]"></div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-[#E5E9F0] rounded"></div>
          <div className="h-3 w-1/4 bg-[#E5E9F0] rounded"></div>
        </div>
      </div>
    );
  }

  // Determine avatar color based on branch
  const avatarColor =
    activity.branch.toLowerCase() === "yaba" ? "#2563EB" : "#059669";

  // Format time ago (simple)
  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const posted = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - posted.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) {
      return interval + " years ago";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
      return interval + " months ago";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
      return interval + " days ago";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
      return interval + " hours ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
      return interval + " minutes ago";
    }
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="flex items-start space-x-3">
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className={`w-3 h-3 rounded-full ${avatarColor}`}></div>
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-[500] text-[#334155]">
          [{activity.branch}] {activity.actor} {activity.action} — {activity.amount !== undefined && activity.amount !== null ? `₦${activity.amount.toLocaleString()}` : ""}
        </p>
        <p className="text-[12px] font-[400] text-[#64748B]">
          {timeAgo(activity.timestamp)}
        </p>
      </div>
    </div>
  );
}
