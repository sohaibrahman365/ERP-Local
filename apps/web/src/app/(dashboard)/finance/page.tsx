"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@wise/ui";
import { api } from "@/lib/api";
import { DollarSign, FileText, CreditCard, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function FinancePage() {
  const { data: plData } = useQuery({
    queryKey: ["profit-loss"],
    queryFn: async () => (await api.get("/finance/reports/profit-loss")).data,
  });

  const pl = plData?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finance</h1>
        <p className="text-muted-foreground">Accounting, invoicing, and financial reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">PKR {(pl?.totalRevenue ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">PKR {(pl?.totalExpenses ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">PKR {(pl?.netIncome ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
            <FileText className="h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/finance/invoices/new">
              <Button variant="outline" size="sm" className="w-full">New Invoice</Button>
            </Link>
            <Link href="/finance/payments">
              <Button variant="outline" size="sm" className="w-full">Record Payment</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
