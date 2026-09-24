import { useMemo } from "react";
import { useBranches } from "./useBranches";

export interface DashboardMetrics {
  totalRevenue: number;
  totalTarget: number;
  totalSalesCount: number;
  revenuePercentage: number;
  totalStaff: number;
  staffBreakdown: {
    managers: number;
    storekeepers: number;
    salesReps: number;
  };
  loading: boolean;
  error: string | null;
}

export function useDashboardMetrics(): DashboardMetrics {
  const { branches, loading, error } = useBranches();

  const metrics = useMemo(() => {
    // Aggregate branch metrics
    const totalRevenue = branches.reduce((sum, branch) => sum + branch.revenue, 0);
    const totalTarget = branches.reduce((sum, branch) => sum + (branch.target || 0), 0);
    const totalSalesCount = branches.reduce((sum, branch) => sum + branch.salesCount, 0);
    const revenuePercentage = totalTarget > 0 ? (totalRevenue / totalTarget) * 100 : 0;

    // Mock staff counts - in production, this would query the profiles table
    // For now, using mock data that matches the actual team structure
    const totalStaff = 13; // 2 managers + 2 storekeepers + 9 sales reps
    const staffBreakdown = {
      managers: 2,
      storekeepers: 2,
      salesReps: 9,
    };

    return {
      totalRevenue,
      totalTarget,
      totalSalesCount,
      revenuePercentage,
      totalStaff,
      staffBreakdown,
    };
  }, [branches]);

  return {
    ...metrics,
    loading,
    error,
  };
}
