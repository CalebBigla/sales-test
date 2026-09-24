/**
 * Report Export Component
 * Allows exporting reports in CSV format (PDF/Excel coming soon)
 */

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { exportReportCSV } from "../lib/notifications.functions";
import { generateReport } from "../lib/sales.functions";
import { Download, FileSpreadsheet, FileText, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function ReportExport() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleExportCSV = async () => {
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select both start and end dates",
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Start date must be before end date",
      });
      return;
    }

    setExporting(true);
    try {
      const csvData = await exportReportCSV({
        data: {
          periodStart: format(startDate, "yyyy-MM-dd"),
          periodEnd: format(endDate, "yyyy-MM-dd"),
          reportType,
        },
      });

      // Create download link
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-report-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Report exported successfully",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export report",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async () => {
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select both start and end dates",
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Start date must be before end date",
      });
      return;
    }

    setExporting(true);
    try {
      const reportData = await generateReport({
        data: {
          periodStart: format(startDate, "yyyy-MM-dd"),
          periodEnd: format(endDate, "yyyy-MM-dd"),
          reportType,
        },
      });

      // Create download link
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-report-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Report exported successfully",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export report",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleQuickExport = (type: "this-month" | "last-month" | "this-year") => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (type) {
      case "this-month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "last-month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "this-year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }

    setStartDate(start);
    setEndDate(end);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Reports</CardTitle>
        <CardDescription>Generate and download sales reports in various formats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Export Buttons */}
        <div className="space-y-2">
          <Label>Quick Export</Label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickExport("this-month")}>
              This Month
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickExport("last-month")}>
              Last Month
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickExport("this-year")}>
              This Year
            </Button>
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Report Type */}
        <div className="space-y-2">
          <Label>Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Buttons */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExportCSV} disabled={exporting || !startDate || !endDate}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportJSON}
              disabled={exporting || !startDate || !endDate}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="outline" disabled title="PDF export coming soon">
              <Download className="mr-2 h-4 w-4" />
              Export PDF (Coming Soon)
            </Button>
          </div>
        </div>

        {startDate && endDate && (
          <div className="text-sm text-muted-foreground">
            Exporting data from {format(startDate, "PPP")} to {format(endDate, "PPP")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
