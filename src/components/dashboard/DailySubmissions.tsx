import { Link } from "@tanstack/react-router";

interface DailySubmissionsProps {
  submissionsData: {
    submitted: number;
    total: number;
    notSubmitted: Array<{ name: string; reason: string }>;
  };
}

export function DailySubmissions({ submissionsData }: DailySubmissionsProps) {
  const { submitted, total, notSubmitted } = submissionsData;
  const percentage = Math.round((submitted /total * 100);

  // Determine submission status
  const getSubmissionStatus = (pct: number) => {
    if (pct === 100) return { color: "#059669", label: "All Submitted" }; // green
    if (pct >= 80) return { color: "#B45309", label: "Most Submitted" }; // amber
    return { color: "#B91C1C", label: "Needs Attention" }; // red
  };

  const { color: statusColor, label: statusLabel } = getSubmissionStatus(percentage);

  return (
    <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-lg p-6">
      <h2 className="mb-5 text-[18px] font-[600] text-[#12233D] flex items-center space-x-2">
        <span className="h-4 w-4 rounded bg-[#2563EB]/10 flex items-center justify-center text-[10px] text-[#2563EB]">
          {"•"}
        </span>
        Daily Submissions
      </h2>

      {/* Main status */}
      <div className="mb-5">
        <div className="flex items-center space-x-4">
          <div className={`w-8 h-8 rounded-full ${statusColor}/20 flex items-center justify-center`}>
            <span className="text-[12px] font-[700] text-[#12233D]">
              {submitted}/{total}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[24px] font-[700] text-[#12233D]">
              {submitted}/{total} reps submitted today
            </p>
            <p className="text-[14px] font-[400] text-[#64748B] flex items-center space-x-2">
              {percentage}%
              <span className={`text-[12px] font-[500] ${statusColor}`}>• {statusLabel}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Not submitted list */}
      {notSubmitted.length > 0 && (
        <div className="mb-5">
          <h3 className="text-[14px] font-[600] text-[#334155] mb-3">Pending Submissions</h3>
          <div className="space-y-2">
            {notSubmitted.slice(0, 3).map((rep, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-[#B91C1C]/20">
                    <span className="text-[10px] font-[600] text-[#B91C1C]">!</span>
                  </div>
                  <div>
                    <span className="text-[14px] font-[600] text-[#334155]">{rep.name}</span>
                    <p className="text-[12px] font-[400] text-[#64748B]">{rep.reason}</p>
                  </div>
                </div>
                <div className="text-[12px] font-[400] text-[#64748B]">
                  Rep #{total - notSubmitted.length + index + 1} of {total}
                </div>
              </div>
            ))}
            {notSubmitted.length > 3 && (
              <div className="text-center text-[12px] font-[400] text-[#64748B] mt-3">
                +{notSubmitted.length - 3} more reps pending submission
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer link */}
      <div className="mt-4 pt-3 border-t border-[#CBD5E1]">
        <Link to="/owner/submissions" className="text-[14px] font-[600] text-[#2563EB] flex items-center space-x-1 hover:underline transition-colors">
          View submission details →
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}