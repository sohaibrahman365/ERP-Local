"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@wise/ui";
import { api } from "@/lib/api";

interface TrialBalanceRow {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  balance: number;
}

const TYPE_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  ASSET: "default",
  LIABILITY: "destructive",
  EQUITY: "secondary",
  REVENUE: "success",
  COGS: "warning",
  EXPENSE: "warning",
  OTHER_INCOME: "success",
  OTHER_EXPENSE: "destructive",
};

export default function TrialBalancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["trial-balance"],
    queryFn: async () => {
      const { data } = await api.get("/finance/reports/trial-balance");
      return data;
    },
  });

  const rows: TrialBalanceRow[] = data?.data ?? [];
  const activeRows = rows.filter((r) => r.debit > 0 || r.credit > 0);
  const totalDebit = activeRows.reduce((sum, r) => sum + Math.max(r.balance, 0), 0);
  const totalCredit = activeRows.reduce((sum, r) => sum + Math.abs(Math.min(r.balance, 0)), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trial Balance</h1>
        <p className="text-muted-foreground">
          Summary of all account balances from posted journal entries
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Debit (PKR)</TableHead>
                <TableHead className="text-right">Credit (PKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRows.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell className="font-mono font-medium">{row.code}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <Badge variant={TYPE_COLORS[row.type] ?? "secondary"}>
                        {row.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.balance > 0 ? `PKR ${row.balance.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {row.balance < 0 ? `PKR ${Math.abs(row.balance).toLocaleString()}` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && activeRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No posted journal entries yet. Post journal entries to see the trial balance.
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading trial balance...
                  </TableCell>
                </TableRow>
              )}
              {/* Totals */}
              {activeRows.length > 0 && (
                <TableRow className="border-t-2 font-bold bg-muted/50">
                  <TableCell colSpan={3} className="text-right">Totals</TableCell>
                  <TableCell className="text-right">PKR {totalDebit.toLocaleString()}</TableCell>
                  <TableCell className="text-right">PKR {totalCredit.toLocaleString()}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
