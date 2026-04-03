"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Textarea,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@wise/ui";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  isHeader: boolean;
}

interface JournalLine {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

export default function NewJournalEntryPage() {
  const router = useRouter();

  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: "", debitAmount: 0, creditAmount: 0, description: "" },
    { accountId: "", debitAmount: 0, creditAmount: 0, description: "" },
  ]);

  const { data: accountsData } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await api.get("/finance/accounts?pageSize=200");
      return data;
    },
  });

  const accounts: Account[] = (accountsData?.data ?? []).filter((a: Account) => !a.isHeader);

  const createEntry = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/finance/journal-entries", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Journal entry created successfully");
      router.push("/finance/journal-entries");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to create journal entry";
      toast.error(message);
    },
  });

  function addLine() {
    setLines((prev) => [...prev, { accountId: "", debitAmount: 0, creditAmount: 0, description: "" }]);
  }

  function removeLine(index: number) {
    if (lines.length <= 2) {
      toast.error("A journal entry must have at least 2 lines");
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof JournalLine, value: string | number) {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const updated = { ...line, [field]: value };
        // Auto-clear the opposite side
        if (field === "debitAmount" && Number(value) > 0) updated.creditAmount = 0;
        if (field === "creditAmount" && Number(value) > 0) updated.debitAmount = 0;
        return updated;
      })
    );
  }

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debitAmount), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.creditAmount), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    const validLines = lines.filter((l) => l.accountId && (l.debitAmount > 0 || l.creditAmount > 0));
    if (validLines.length < 2) {
      toast.error("At least 2 valid lines are required");
      return;
    }

    if (!isBalanced) {
      toast.error("Total debits must equal total credits");
      return;
    }

    createEntry.mutate({
      entryDate,
      description,
      lines: validLines,
    });
  }

  function getAccountLabel(accountId: string): string {
    const acc = accounts.find((a) => a.id === accountId);
    return acc ? `${acc.code} - ${acc.name}` : "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/journal-entries">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Journal Entry</h1>
          <p className="text-muted-foreground">Create a new general ledger journal entry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Entry Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entryDate">Entry Date *</Label>
                <Input
                  id="entryDate"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                rows={2}
                placeholder="e.g. Record office rent payment for April 2026"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Journal Lines</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-1" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Account *</TableHead>
                  <TableHead>Line Description</TableHead>
                  <TableHead className="w-[150px] text-right">Debit (PKR)</TableHead>
                  <TableHead className="w-[150px] text-right">Credit (PKR)</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={line.accountId}
                        onChange={(e) => updateLine(index, "accountId", e.target.value)}
                      >
                        <option value="">Select account...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </option>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Optional"
                        value={line.description}
                        onChange={(e) => updateLine(index, "description", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="text-right"
                        value={line.debitAmount || ""}
                        onChange={(e) => updateLine(index, "debitAmount", Number(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="text-right"
                        value={line.creditAmount || ""}
                        onChange={(e) => updateLine(index, "creditAmount", Number(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="border-t-2 font-bold bg-muted/50">
                  <TableCell colSpan={2} className="text-right">
                    Totals
                  </TableCell>
                  <TableCell className="text-right">
                    PKR {totalDebit.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    PKR {totalCredit.toLocaleString()}
                  </TableCell>
                  <TableCell />
                </TableRow>
                {!isBalanced && totalDebit + totalCredit > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-destructive text-sm">
                      Difference: PKR {Math.abs(totalDebit - totalCredit).toLocaleString()} —
                      Entry must balance (debits = credits)
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/finance/journal-entries">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={createEntry.isPending || !isBalanced}>
            {createEntry.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Journal Entry
          </Button>
        </div>
      </form>
    </div>
  );
}
