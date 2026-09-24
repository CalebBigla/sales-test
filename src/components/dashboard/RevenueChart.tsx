import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  branches: Array<{ id: string; name: string; color: string }>;
  monthlyData: Array<{
    month: string;
    yaba: number;
    ajah: number;
  }>;
  target: number; // org target per month (could be array, but we'll assume constant for simplicity)
  skeleton?: boolean;
  className?: string;
}

export default function RevenueChart({
  branches,
  monthlyData,
  target,
  skeleton,
  className = "",
}: RevenueChartProps) {
  if (skeleton) {
    return (
      <div className={`w-full ${className}`}>
        <div className="h-4 w-full bg-[#E5E9F0] rounded"></div>
        <div className="h-4 w-full bg-[#E5E9F0] rounded mt-2"></div>
        <div className="h-4 w-full bg-[#E5E9F0] rounded mt-2"></div>
      </div>
    );
  }

  // Prepare data for recharts: we need an array of objects with month, yaba, ajah, target
  const chartData = monthlyData.map((d) => ({
    month: d.month,
    yaba: d.yaba,
    ajah: d.ajah,
    target: target,
  }));

  // Get branch colors
  const yabaBranch = branches.find((b) => b.name.toLowerCase() === "yaba");
  const ajahBranch = branches.find((b) => b.name.toLowerCase() === "ajah");
  const yabaColor = yabaBranch?.color ?? "#2563EB";
  const ajahColor = ajahBranch?.color ?? "#059669";

  // Compute max value for Y-axis domain
  const allValues = chartData.flatMap((d) => [d.yaba, d.ajah, d.target]);
  const maxY = Math.max(...allValues);
  const niceMaxY = Math.ceil(maxY / 200000) * 200000; // round up to nearest 200k

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={false} axisLine={false} tickLine={false}></XAxis>
          <YAxis
            tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
            domain={[0, niceMaxY]}
          />
          <Tooltip
            formatter={(value) => `₦${value}`}
            labelFormatter={(value) => value}
            containerStyle={{ backgroundColor: "#fff", borderColor: "#E5E9F0" }}
          />
          <Legend verticalAlign="top" height={36} />
          {/* Yaba line */}
          <Line
            type="monotone"
            dataKey="yaba"
            stroke={yabaColor}
            strokeWidth={2}
            dot={false}
            name="Yaba"
          />
          {/* Ajah line */}
          <Line
            type="monotone"
            dataKey="ajah"
            stroke={ajahColor}
            strokeWidth={2}
            dot={false}
            name="Ajah"
          />
          {/* Target line (dashed) */}
          <Line
            type="monotone"
            dataKey="target"
            stroke="#64748B"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Target"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}