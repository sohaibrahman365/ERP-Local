"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@wise/ui";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, Users, DollarSign, TrendingDown, Wallet } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PayrollStatus = "DRAFT" | "PROCESSING" | "COMPLETED" | "CANCELLED";

interface Payslip {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    fullName: string;
    employeeId?: string;
  };
  basicSalary: number;
  allowances: number;
  grossPay: number;
  tax: number;
  eobi: number;
  otherDeductions: number;
  netPay: number;
}

interface PayrollDetail {
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
  payslips: Payslip[];
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  DRAFT: "secondary",
  PROCESSING: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PayrollDetailPage() {
  const params = useParams<{ id: string }>();
  const payrollId = params.id;

  const { data: payroll, isLoading, isError } = useQuery<PayrollDetail>({
    queryKey: ["payroll", payrollId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: PayrollDetail }>(
        `/hr/payroll/${payrollId}`
      );
      return data.data;
    },
    enabled: !!payrollId,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (isError || !payroll) {
    return (
      <div className="space-y-4">
        <Link href="/hr/payroll" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Payroll
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Payroll run not found or an error occurred.
          </CardContent>
        </Card>
      </div>
    );
  }

  const payslips: Payslip[] = payroll.payslips ?? [];
  const periodLabel = `${MONTH_NAMES[payroll.month] ?? payroll.month} ${payroll.year}`;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/hr/payroll" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Payroll
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll: {periodLabel}</h1>
          <p className="text-muted-foreground">
            {payroll.runDate
              ? `Run on ${new Date(payroll.runDate).toLocaleDateString("en-PK", { dateStyle: "long" })}`
              : "Not yet processed"}
          </p>
        </div>
        <Badge variant={STATUS_COLORS[payroll.status] ?? "secondary"} className="text-sm">
          {payroll.status}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{payroll.totalEmployees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Gross Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">PKR {Number(payroll.grossTotal).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Deductions</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">PKR {Number(payroll.deductionsTotal).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Net Pay</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">PKR {Number(payroll.netTotal).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payslips ({payslips.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Basic Salary</TableHead>
                <TableHead className="text-right">Allowances</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">EOBI</TableHead>
                <TableHead className="text-right">Other Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No payslips generated for this run
                  </TableCell>
                </TableRow>
              )}
              {payslips.map((slip) => (
                <TableRow key={slip.id}>
                  <TableCell className="font-medium">
                    {slip.employee?.fullName ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    PKR {Number(slip.basicSalary).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    PKR {Number(slip.allowances).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    PKR {Number(slip.grossPay).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    PKR {Number(slip.tax).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    PKR {Number(slip.eobi).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    PKR {Number(slip.otherDeductions).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    PKR {Number(slip.netPay).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
