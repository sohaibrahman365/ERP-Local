"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
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
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface InvoiceFormState {
  type: "SALES" | "PURCHASE";
  invoiceDate: string;
  dueDate: string;
  customerReference: string;
  notes: string;
  terms: string;
  lineItems: LineItem[];
}

interface InvoicePayload {
  type: string;
  invoiceDate: string;
  dueDate: string;
  customerReference: string;
  notes: string;
  terms: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    lineTotal: number;
  }[];
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function createEmptyLine(): LineItem {
  return {
    id: generateId(),
    description: "",
    quantity: 1,
    unitPrice: 0,
    taxRate: 17,
  };
}

function calcLineTotal(item: LineItem): number {
  const net = item.quantity * item.unitPrice;
  return net + net * (item.taxRate / 100);
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

function thirtyDaysLaterISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0] ?? "";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewInvoicePage() {
  const router = useRouter();

  const [form, setForm] = useState<InvoiceFormState>({
    type: "SALES",
    invoiceDate: todayISO(),
    dueDate: thirtyDaysLaterISO(),
    customerReference: "",
    notes: "",
    terms: "",
    lineItems: [createEmptyLine()],
  });

  // ---- Derived calculations ----
  const subtotal = form.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const taxTotal = form.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100),
    0
  );

  const total = subtotal + taxTotal;

  // ---- Field updaters ----
  function updateField<K extends keyof InvoiceFormState>(
    key: K,
    value: InvoiceFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateLineItem(id: string, field: keyof LineItem, value: string | number) {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addLineItem() {
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, createEmptyLine()],
    }));
  }

  function removeLineItem(id: string) {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.length > 1
        ? prev.lineItems.filter((item) => item.id !== id)
        : prev.lineItems,
    }));
  }

  // ---- Mutation ----
  const createInvoice = useMutation({
    mutationFn: async (payload: InvoicePayload) => {
      const { data } = await api.post("/finance/invoices", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Invoice created successfully");
      router.push("/finance/invoices");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create invoice";
      toast.error(message);
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.customerReference.trim()) {
      toast.error("Customer / vendor reference is required");
      return;
    }

    if (form.lineItems.some((li) => !li.description.trim())) {
      toast.error("All line items must have a description");
      return;
    }

    const payload: InvoicePayload = {
      type: form.type,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      customerReference: form.customerReference,
      notes: form.notes,
      terms: form.terms,
      lineItems: form.lineItems.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        taxRate: li.taxRate,
        lineTotal: calcLineTotal(li),
      })),
      subtotal,
      taxTotal,
      totalAmount: total,
    };

    createInvoice.mutate(payload);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/finance/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Invoice</h1>
          <p className="text-muted-foreground">
            Create a new sales or purchase invoice
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>
              Enter the basic invoice information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Invoice Type *</Label>
                <Select
                  id="type"
                  value={form.type}
                  onChange={(e) =>
                    updateField("type", e.target.value as "SALES" | "PURCHASE")
                  }
                >
                  <option value="SALES">Sales Invoice</option>
                  <option value="PURCHASE">Purchase Invoice</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date *</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) => updateField("invoiceDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => updateField("dueDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerReference">
                  {form.type === "SALES" ? "Customer" : "Vendor"} Reference *
                </Label>
                <Input
                  id="customerReference"
                  placeholder={
                    form.type === "SALES"
                      ? "Customer name or ID"
                      : "Vendor name or ID"
                  }
                  value={form.customerReference}
                  onChange={(e) =>
                    updateField("customerReference", e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>
                  Add items to the invoice. GST at 17% is applied by default.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Line
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Description</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="w-[140px]">Unit Price (PKR)</TableHead>
                  <TableHead className="w-[100px]">Tax %</TableHead>
                  <TableHead className="w-[140px] text-right">
                    Line Total (PKR)
                  </TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(item.id, "description", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(
                            item.id,
                            "quantity",
                            Math.max(1, Number(e.target.value))
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(
                            item.id,
                            "unitPrice",
                            Math.max(0, Number(e.target.value))
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.taxRate}
                        onChange={(e) =>
                          updateLineItem(
                            item.id,
                            "taxRate",
                            Math.max(0, Number(e.target.value))
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {calcLineTotal(item).toLocaleString("en-PK", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={form.lineItems.length <= 1}
                        onClick={() => removeLineItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals */}
            <div className="flex justify-end p-4 border-t">
              <div className="w-[300px] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    PKR{" "}
                    {subtotal.toLocaleString("en-PK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>
                    PKR{" "}
                    {taxTotal.toLocaleString("en-PK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-2">
                  <span>Total</span>
                  <span>
                    PKR{" "}
                    {total.toLocaleString("en-PK", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes & Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Notes &amp; Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Internal notes or additional information..."
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Terms &amp; Conditions</Label>
                <Textarea
                  id="terms"
                  rows={4}
                  placeholder="Payment terms, late fee policy, etc."
                  value={form.terms}
                  onChange={(e) => updateField("terms", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/finance/invoices">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createInvoice.isPending}>
            {createInvoice.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Create Invoice
          </Button>
        </div>
      </form>
    </div>
  );
}
