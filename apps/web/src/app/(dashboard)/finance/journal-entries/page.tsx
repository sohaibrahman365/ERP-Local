"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  Badge,
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
} from "@wise/ui";
import { api } from "@/lib/api";
import { Plus, Eye } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string | null;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  createdAt: string;
  lines?: JournalLine[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  DRAFT: "secondary",
  APPROVED: "default",
  POSTED: "success",
  VOIDED: "destructive",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function JournalEntriesPage() {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // ---- Fetch journal entries ----
  const { data, isLoading } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: async () => {
      const { data } = await api.get("/finance/journal-entries?pageSize=50");
      return data;
    },
  });

  const entries: JournalEntry[] = data?.data ?? [];

  function openDetail(entry: JournalEntry) {
    setSelectedEntry(entry);
    setDetailDialogOpen(true);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Journal Entries</h1>
          <p className="text-muted-foreground">
            View and manage general ledger journal entries
          </p>
        </div>
        <Link href="/finance/journal-entries/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </Link>
      </div>

      {/* Journal Entries Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Total Debit (PKR)</TableHead>
                <TableHead className="text-right">Total Credit (PKR)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {entry.entryNumber}
                  </TableCell>
                  <TableCell>{formatDate(entry.entryDate)}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {entry.description}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    PKR {Number(entry.totalDebit).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    PKR {Number(entry.totalCredit).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[entry.status] ?? "secondary"}>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetail(entry)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && entries.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No journal entries yet
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading journal entries...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Entry Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent
          className="max-w-2xl"
          onClose={() => setDetailDialogOpen(false)}
        >
          <DialogHeader>
            <DialogTitle>
              Journal Entry {selectedEntry?.entryNumber}
            </DialogTitle>
            <DialogDescription>
              {selectedEntry && (
                <>
                  {formatDate(selectedEntry.entryDate)} &mdash;{" "}
                  <Badge
                    variant={
                      STATUS_COLORS[selectedEntry.status] ?? "secondary"
                    }
                  >
                    {selectedEntry.status}
                  </Badge>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4 py-2">
              {/* Description */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm">{selectedEntry.description}</p>
              </div>

              {/* Lines Table */}
              {selectedEntry.lines && selectedEntry.lines.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">
                          Debit (PKR)
                        </TableHead>
                        <TableHead className="text-right">
                          Credit (PKR)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEntry.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-mono text-sm">
                            {line.accountCode} - {line.accountName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {line.description || "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {Number(line.debit) > 0
                              ? `PKR ${Number(line.debit).toLocaleString()}`
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {Number(line.credit) > 0
                              ? `PKR ${Number(line.credit).toLocaleString()}`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals row */}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell colSpan={2} className="text-right">
                          Totals
                        </TableCell>
                        <TableCell className="text-right">
                          PKR{" "}
                          {Number(
                            selectedEntry.totalDebit
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          PKR{" "}
                          {Number(
                            selectedEntry.totalCredit
                          ).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Debit
                      </p>
                      <p className="text-lg font-bold">
                        PKR{" "}
                        {Number(
                          selectedEntry.totalDebit
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Credit
                      </p>
                      <p className="text-lg font-bold">
                        PKR{" "}
                        {Number(
                          selectedEntry.totalCredit
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Detailed journal lines are not available for this entry.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
