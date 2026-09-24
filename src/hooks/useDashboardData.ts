import { useState, useEffect } from "react";

export interface DashboardData {
  totalStaff: number;
  revenue: number;
  target: number;
  monthlyRevenue: Array<{
    month: string;
    yaba: number;
    ajah: number;
  }>;
  orgTarget: number; // maybe same as target? We'll keep.
  recentActivity: Array<{
    id: string;
    actor: string;
    branch: "Yaba" | "Ajah";
    action: string;
    amount?: number;
    timestamp: string;
  }>;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      try {
        const now = new Date();
        
        // Stub data as per spec
        const mockData: DashboardData = {
          totalStaff: 13,
          revenue: 3050000,
          target: 3800000,
          monthlyRevenue: [
            { month: "Jan", yaba: 150000, ajah: 120000 },
            { month: "Feb", yaba: 180000, ajah: 140000 },
            { month: "Mar", yaba: 210000, ajah: 160000 },
            { month: "Apr", yaba: 240000, ajah: 180000 },
            { month: "May", yaba: 270000, ajah: 200000 },
            { month: "Jun", yaba: 300000, ajah: 220000 },
          ],
          orgTarget: 3800000,
          recentActivity: [
            {
              id: "1",
              actor: "David",
              branch: "Yaba",
              action: "logged a sale",
              amount: 45000,
              timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 mins ago
            },
            {
              id: "2",
              actor: "Blessing",
              branch: "Ajah",
              action: "stock request fulfilled",
              timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(), // 25 mins ago
            },
            {
              id: "3",
              actor: "Emeka",
              branch: "Yaba",
              action: "target updated",
              timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour ago
            },
            {
              id: "4",
              actor: "Ibrahim",
              branch: "Ajah",
              action: "user onboarded",
              timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            },
            {
              id: "5",
              actor: "Sarah",
              branch: "Yaba",
              action: "request escalated",
              timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
            },
          ],
        };
        setData(mockData);
        setLoading(false);
      } catch (e) {
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    }, 500);
  }, []);

  return { data, loading, error };
}
