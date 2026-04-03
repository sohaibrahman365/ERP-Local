"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@wise/ui";
import { api } from "@/lib/api";

interface PLLine {
  code: string;
  name: string;
  amount: number;
}

interface PLData {
  revenue: PLLine[];
  expenses: PLLine[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export default function ProfitLossPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["profit-loss-report"],
    queryFn: async () => {
      const { data } = await api.get("/finance/reports/profit-loss");
      return data;
    },
  });

  const pl: PLData | null = data?.data ?? null;
  const activeRevenue = pl?.revenue.filter((r) => r.amount !== 0) ?? [];
  const activeExpenses = pl?.expenses.filter((r) => r.amount !== 0) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profit & Loss Statement</h1>
        <p className="text-muted-foreground">
          Income and expense summary from posted journal entries
        </p>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading report...
          </CardContent>
        </Card>
      )}

      {pl && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  PKR {pl.totalRevenue.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  PKR {pl.totalExpenses.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${pl.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                  PKR {pl.netIncome.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">Revenue</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount (PKR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRevenue.map((row) => (
                    <TableRow key={row.code}>
                      <TableCell className="font-mono">{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-right font-medium">
                        PKR {row.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {activeRevenue.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No revenue recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="border-t-2 font-bold bg-green-50">
                    <TableCell colSpan={2} className="text-right">Total Revenue</TableCell>
                    <TableCell className="text-right">PKR {pl.totalRevenue.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Expenses Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">Expenses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount (PKR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeExpenses.map((row) => (
                    <TableRow key={row.code}>
                      <TableCell className="font-mono">{row.code}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-right font-medium">
                        PKR {row.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {activeExpenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No expenses recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="border-t-2 font-bold bg-red-50">
                    <TableCell colSpan={2} className="text-right">Total Expenses</TableCell>
                    <TableCell className="text-right">PKR {pl.totalExpenses.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Net Income */}
          <Card className={pl.netIncome >= 0 ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Net Income</span>
                <span className={`text-2xl font-bold ${pl.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                  PKR {pl.netIncome.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
