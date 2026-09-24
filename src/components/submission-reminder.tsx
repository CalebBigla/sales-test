import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMySales } from "@/lib/sales.functions";
import { AlertCircle, X } from "lucide-react";

export function SubmissionReminderBanner() {
  const [dismissed, setDismissed] = useState(false);
  const fetchSales = useServerFn(listMySales);
  const sales = useQuery({ queryKey: ["my-sales"], queryFn: () => fetchSales() });

  if (dismissed || sales.isPending) return null;

  const today = new Date().toDateString();
  const hasSubmittedToday = (sales.data ?? []).some(
    (sale) => new Date(sale.soldAt).toDateString() === today,
  );

  if (hasSubmittedToday) return null;

  return (
    <div className="mt-3 flex items-start gap-3 rounded-xl border-2 border-warning bg-gradient-to-r from-warning/20 to-warning/10 p-4 shadow-sm animate-pulse-slow">
      <AlertCircle className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-body font-semibold text-warning-foreground">
          Daily sales not submitted yet
        </p>
        <p className="text-caption mt-1 text-muted-foreground">
          Remember to log today's sales before end of day to maintain your submission compliance
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="rounded-lg p-1 hover:bg-warning/20 transition-colors flex-shrink-0"
        aria-label="Dismiss reminder"
      >
        <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
      </button>
    </div>
  );
}
