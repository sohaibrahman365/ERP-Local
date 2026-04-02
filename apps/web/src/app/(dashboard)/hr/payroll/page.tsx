"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Label,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@wise/ui";
import { api } from "@/lib/api";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PayrollStatus = "DRAFT" | "PROCESSING" | "COMPLETED" | "CANCELLED";

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  runDate: string | null;
  totalEmployees: number;
  grossTotal: number;
  deductionsTotal: number;
  netTotal: number;
  status: PayrollStatus;
  createdAt: string;
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  DRAFT: "secondary",
  PROCESSING: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function getMonthName(month: number): string {
  return MONTHS.find((m) => m.value === month)?.label ?? String(month);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Fetch payroll runs
  const { data, isLoading } = useQuery({
    queryKey: ["payroll"],
    queryFn: async () => {
      const { data } = await api.get("/hr/payroll?pageSize=50");
      return data;
    },
  });

  const payrollRuns: PayrollRun[] = data?.data ?? [];

  // Create payroll run mutation
  const createMutation = useMutation({
    mutationFn: async (payload: { month: number; year: number }) => {
      const { data } = await api.post("/hr/payroll", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Payroll run created successfully");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to create payroll run";
      toast.error(message);
    },
  });

  function handleCreatePayroll() {
    createMutation.mutate({ month: selectedMonth, year: selectedYear });
  }

  // Generate year options (current year +/- 2)
  const currentYear = currentDate.getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll</h1>
          <p className="text-muted-foreground">Manage payroll runs and generate payslips</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Run Payroll
        </Button>
      </div>

      {/* Payroll Runs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Run Date</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead className="text-right">Gross Total</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && payrollRuns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No payroll runs yet
                  </TableCell>
                </TableRow>
              )}
              {payrollRuns.map((run) => (
                <TableRow key={run.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <Link href={`/hr/payroll/${run.id}`} className="hover:underline">
                      {getMonthName(run.month)} {run.year}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {run.runDate ? new Date(run.runDate).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="text-right">{run.totalEmployees}</TableCell>
                  <TableCell className="text-right">
                    PKR {Number(run.grossTotal).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    PKR {Number(run.deductionsTotal).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    PKR {Number(run.netTotal).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[run.status] ?? "secondary"}>
                      {run.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Payroll Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Run Payroll</DialogTitle>
            <DialogDescription>
              Select the month and year for this payroll run
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payroll-month">Month</Label>
              <Select
                id="payroll-month"
                value={String(selectedMonth)}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payroll-year">Year</Label>
              <Select
                id="payroll-year"
                value={String(selectedYear)}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayroll} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Payroll Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
