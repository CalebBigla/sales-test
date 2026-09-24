import { Link } from "@tanstack/react-router";

interface RepListProps {
  teamData: {
    top: Array<{ name: string; percentage: number }>;
    bottom: Array<{ name: string; percentage: number }>;
  };
}

export function RepList({ teamData }: RepListProps) {
  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return "#059669"; // green
    if (percentage >= 80) return "#B45309"; // amber
    return "#B91C1C"; // red
  };

  const getStatusLabel = (percentage: number) => {
    if (percentage >= 100) return "Exceeding Target";
    if (percentage >= 80) return "On Track";
    return "Needs Improvement";
  };

  return (
    <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-lg p-6">
      <h2 className="mb-5 text-[18px] font-[600] text-[#12233D] flex items-center space-x-2">
        <span className="h-4 w-4 rounded bg-[#2563EB]/10 flex items-center justify-center text-[10px] text-[#2563EB]">
          {"•"}
        </span>
        Team Performance
      </h2>

      {/* Top 3 */}
      <div className="mb-5">
        <h3 className="text-[14px] font-[600] text-[#334155] mb-3">Top Performers</h3>
        <div className="space-y-3">
          {teamData.top.map((rep, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(rep.percentage)}`}></div>
                <div>
                  <span className="text-[14px] font-[600] text-[#334155]">{rep.name}</span>
                  <p className="text-[12px] font-[400] text-[#64748B]">#{index + 1}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <span
                  className={`text-[18px] font-[700] ${getStatusColor(rep.percentage)}`}
                >
                  {rep.percentage}%
                </span>
                <p className="text-[12px] font-[400] text-[#64748B]">
                  {getStatusLabel(rep.percentage)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 3 */}
      <div>
        <h3 className="text-[14px] font-[600] text-[#334155] mb-3">Needs Attention</h3>
        <div className="space-y-3">
          {teamData.bottom.map((rep, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(rep.percentage)}`}></div>
                <div>
                  <span className="text-[14px] font-[600] text-[#334155]">{rep.name}</span>
                  <p className="text-[12px] font-[400] text-[#64748B]">#{index + 1}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <span
                  className={`text-[18px] font-[700] ${getStatusColor(rep.percentage)}`}
                >
                  {rep.percentage}%
                </span>
                <p className="text-[12px] font-[400] text-[#64748B]">
                  {getStatusLabel(rep.percentage)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-6 pt-4 border-t border-[#CBD5E1]">
        <Link to="/owner/team" className="text-[14px] font-[600] text-[#2563EB] flex items-center space-x-1 hover:underline transition-colors">
          View full team →
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}