import { useState, useEffect } from "react";

export interface Branch {
  id: string;
  name: string;
  color: string; // for chart
  revenue: number;
  salesCount: number;
  target: number | null;
  submissionsToday: number;
  totalRepsToday: number;
}

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => {
      try {
        const mockBranches: Branch[] = [
          {
            id: "yaba",
            name: "Yaba",
            color: "#2563EB",
            revenue: 1850000,
            salesCount: 145,
            target: 2000000,
            submissionsToday: 12,
            totalRepsToday: 8
          },
          {
            id: "ajah",
            name: "Ajah",
            color: "#059669",
            revenue: 1200000,
            salesCount: 98,
            target: 1800000,
            submissionsToday: 7,
            totalRepsToday: 5
          }
        ];
        setBranches(mockBranches);
        setLoading(false);
      } catch (e) {
        setError("Failed to load branches");
        setLoading(false);
      }
    }, 500);
  }, []);

  return { branches, loading, error };
}
