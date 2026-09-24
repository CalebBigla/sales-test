import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ProgressBarProps {
  current: number;
  target: number;
  currency: string;
}

export function ProgressBar({ current, target, currency }: ProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = target - current;

  // Determine progress status for color coding
  const getProgressStatus = (pct: number) => {
    if (pct >= 100) return { color: "#059669", label: "On Target" }; // green
    if (pct >= 80) return { color: "#B45309", label: "Approaching Target" }; // amber
    return { color: "#B91C1C", label: "Needs Attention" }; // red
  };

  const { color: progressColor, label: statusLabel } = getProgressStatus(percentage);

  // Data for the chart: we'll show two bars - one for target (background) and one for current (progress)
  const data = [
    {
      name: "Progress",
      target: 100, // Target is always 100%
      current: percentage,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Main KPI display */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[36px] font-[700] text-[#12233D]">
            {currency}{current.toLocaleString()}
          </p>
          <p className="text-[18px] font-[600] text-[#64748B] flex items-center space-x-2">
            {percentage.toFixed(0)}% of {currency}{target.toLocaleString()} target
            <span className={`text-[12px] font-[500] ${progressColor}`}>
              • {statusLabel}
            </span>
          </p>
        </div>
        {/* Status indicator */}
        <div className={`w-8 h-8 rounded-full ${progressColor}/20 flex items-center justify-center`}>
          <span className={`text-[10px] font-[700] ${progressColor}`}>•</span>
        </div>
      </div>

      {/* Progress Bar using Recharts */}
      <div className="w-full">
        <ResponsiveContainer width="100%" height={40}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            {/* Background bar (target) */}
            <Bar dataKey="target" barSize={20} radius={[4, 4, 4, 4]}>
              <Cell fill="#E2E8F0" />
            </Bar>
            {/* Current progress bar */}
            <Bar dataKey="current" barSize={20} radius={[4, 4, 4, 4]}>
              <Cell fill={progressColor} />
            </Bar>
            {/* XAxis - we don't really need labels but we keep it for structure */}
            <XAxis dataKey="name" tick={false} axisLine={false} tickLine={false} />
            {/* YAxis - show percentage */}
            <YAxis
              domain={[0, 100]}
              tick={{ count: 5 }}
              tickFormatter={(value) => `${value}%`}
              width={40}
              tickLine={false}
              axisLine={false}
              hide={true}
            />
            {/* Tooltip */}
            <Tooltip
              formatter={(value) => `${value}%`}
              labelFormatter={() => "Progress"}
              containerStyle={{ pointerEvents: "none" }}
              contentStyle={{ backgroundColor: "#fff", borderColor: "#CBD5E1" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Remaining amount */}
      <p className="text-[14px] font-[400] text-[#64748B]">
        {currency}{remaining.toLocaleString()} remaining to reach target
      </p>
    </div>
  );
}