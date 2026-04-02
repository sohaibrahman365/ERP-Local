"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Badge, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@wise/ui";
import { api } from "@/lib/api";
import { Plus } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PAID: "success", SENT: "default", PARTIAL: "warning", OVERDUE: "destructive", DRAFT: "secondary", VOIDED: "secondary",
};

export default function InvoicesPage() {
  const { data } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => (await api.get("/finance/invoices?pageSize=50")).data,
  });

  const invoices = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage sales and purchase invoices</p>
        </div>
        <Link href="/finance/invoices/new">
          <Button><Plus className="h-4 w-4 mr-2" />New Invoice</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv: { id: string; invoiceNumber: string; type: string; invoiceDate: string; dueDate: string; totalAmount: number; amountPaid: number; status: string }) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell><Badge variant="outline">{inv.type}</Badge></TableCell>
                  <TableCell>{new Date(inv.invoiceDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>PKR {Number(inv.totalAmount).toLocaleString()}</TableCell>
                  <TableCell>PKR {Number(inv.amountPaid).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[inv.status] ?? "secondary"}>{inv.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No invoices yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
