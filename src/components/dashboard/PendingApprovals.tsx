interface PendingApprovalsProps {
  approvalsData: {
    count: number;
    handledBy: string;
  };
  className?: string;
}

export function PendingApprovals({ approvalsData, className = "" }: PendingApprovalsProps) {
  const { count, handledBy } = approvalsData;

  // Determine urgency based on count
  const getUrgencyStyle = (count: number) => {
    if (count === 0) return { bg: "#059669/10", text: "#059669", icon: "✓" }; // green
    if (count <= 3) return { bg: "#B45309/10", text: "#B45309", icon: "!" }; // amber
    return { bg: "#B91C1C/10", text: "#B91C1C", icon: "!" }; // red
  };

  const { bg, text, icon } = getUrgencyStyle(count);

  return (
    <div className={`bg-white rounded-xl border border-[#CBD5E1] shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[24px] font-[700] text-[#12233D] flex items-center space-x-3">
            <span className={`w-6 h-6 rounded flex items-center justify-center ${bg}`}>
              <span className={`text-[14px] font-[700] ${text}`}>{icon}</span>
            </span>
            <div className="space-y-1">
              <p className="text-[24px] font-[700] text-[#12233D]">
                {count}
              </p>
              <p className="text-[14px] font-[400] text-[#64748B]">
                stock requests waiting for action
              </p>
            </div>
          </p>
        </div>
        <p className="text-[12px] font-[400] text-[#64748B] flex items-center space-x-2">
          Handled by your team
          <span className="ml-2 text-[10px] font-[500] text-[#64748B]">({handledBy})</span>
        </p>
      </div>
    </div>
  );
}