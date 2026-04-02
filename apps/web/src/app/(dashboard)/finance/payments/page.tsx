"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DialogFooter,
  Input,
  Label,
  Select,
  Textarea,
} from "@wise/ui";
import { api } from "@/lib/api";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Payment {
  id: string;
  paymentDate: string;
  referenceNumber: string;
  invoiceNumber: string;
  amount: number;
  method: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface PaymentFormState {
  invoiceReference: string;
  amount: string;
  method: string;
  paymentDate: string;
  referenceNumber: string;
  notes: string;
}

interface PaymentPayload {
  invoiceReference: string;
  amount: number;
  method: string;
  paymentDate: string;
  referenceNumber: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const METHOD_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  CASH: "success",
  BANK_TRANSFER: "default",
  CHEQUE: "secondary",
  JAZZCASH: "warning",
  EASYPAISA: "warning",
  CREDIT_CARD: "outline",
};

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  COMPLETED: "success",
  PENDING: "warning",
  FAILED: "destructive",
  REFUNDED: "secondary",
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "JAZZCASH", label: "JazzCash" },
  { value: "EASYPAISA", label: "Easypaisa" },
  { value: "CREDIT_CARD", label: "Credit Card" },
];

function todayISO(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState<PaymentFormState>({
    invoiceReference: "",
    amount: "",
    method: "BANK_TRANSFER",
    paymentDate: todayISO(),
    referenceNumber: "",
    notes: "",
  });

  // ---- Fetch payments ----
  const { data, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data } = await api.get("/finance/payments?pageSize=50");
      return data;
    },
  });

  const payments: Payment[] = data?.data ?? [];

  // ---- Record payment mutation ----
  const recordPayment = useMutation({
    mutationFn: async (payload: PaymentPayload) => {
      const { data } = await api.post("/finance/payments", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to record payment";
      toast.error(message);
    },
  });

  function resetForm() {
    setForm({
      invoiceReference: "",
      amount: "",
      method: "BANK_TRANSFER",
      paymentDate: todayISO(),
      referenceNumber: "",
      notes: "",
    });
  }

  function updateField<K extends keyof PaymentFormState>(
    key: K,
    value: PaymentFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const amount = parseFloat(form.amount);
    if (!form.invoiceReference.trim()) {
      toast.error("Invoice reference is required");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const payload: PaymentPayload = {
      invoiceReference: form.invoiceReference,
      amount,
      method: form.method,
      paymentDate: form.paymentDate,
      referenceNumber: form.referenceNumber,
      notes: form.notes,
    };

    recordPayment.mutate(payload);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Track and record payment transactions
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Amount (PKR)</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Date(payment.paymentDate).toLocaleDateString("en-PK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {payment.referenceNumber || "-"}
                  </TableCell>
                  <TableCell>{payment.invoiceNumber || "-"}</TableCell>
                  <TableCell className="font-medium">
                    PKR {Number(payment.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={METHOD_COLORS[payment.method] ?? "secondary"}>
                      {payment.method.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[payment.status] ?? "secondary"}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && payments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No payments recorded yet
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading payments...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter the payment details below to record a new transaction.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invoiceReference">Invoice Reference *</Label>
              <Input
                id="invoiceReference"
                placeholder="e.g. INV-2026-0001"
                value={form.invoiceReference}
                onChange={(e) =>
                  updateField("invoiceReference", e.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PKR) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => updateField("amount", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Payment Method *</Label>
                <Select
                  id="method"
                  value={form.method}
                  onChange={(e) => updateField("method", e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => updateField("paymentDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  placeholder="Cheque #, Transaction ID"
                  value={form.referenceNumber}
                  onChange={(e) =>
                    updateField("referenceNumber", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Optional payment notes..."
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={recordPayment.isPending}>
                {recordPayment.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
