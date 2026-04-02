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

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parentAccountId: string | null;
  parentAccount?: { id: string; code: string; name: string } | null;
  balance: number;
  description: string | null;
  createdAt: string;
}

interface AccountFormState {
  code: string;
  name: string;
  type: string;
  parentAccountId: string;
  description: string;
}

interface AccountPayload {
  code: string;
  name: string;
  type: string;
  parentAccountId: string | null;
  description: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCOUNT_TYPES = [
  { value: "ASSET", label: "Asset" },
  { value: "LIABILITY", label: "Liability" },
  { value: "EQUITY", label: "Equity" },
  { value: "REVENUE", label: "Revenue" },
  { value: "EXPENSE", label: "Expense" },
];

const TYPE_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  ASSET: "default",
  LIABILITY: "destructive",
  EQUITY: "secondary",
  REVENUE: "success",
  EXPENSE: "warning",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChartOfAccountsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState<AccountFormState>({
    code: "",
    name: "",
    type: "ASSET",
    parentAccountId: "",
    description: "",
  });

  // ---- Fetch accounts ----
  const { data, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await api.get("/finance/accounts?pageSize=100");
      return data;
    },
  });

  const accounts: Account[] = data?.data ?? [];

  // ---- Create account mutation ----
  const createAccount = useMutation({
    mutationFn: async (payload: AccountPayload) => {
      const { data } = await api.post("/finance/accounts", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Account created successfully");
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create account";
      toast.error(message);
    },
  });

  function resetForm() {
    setForm({
      code: "",
      name: "",
      type: "ASSET",
      parentAccountId: "",
      description: "",
    });
  }

  function updateField<K extends keyof AccountFormState>(
    key: K,
    value: AccountFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.code.trim()) {
      toast.error("Account code is required");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Account name is required");
      return;
    }

    const payload: AccountPayload = {
      code: form.code,
      name: form.name,
      type: form.type,
      parentAccountId: form.parentAccountId || null,
      description: form.description,
    };

    createAccount.mutate(payload);
  }

  function getParentAccountName(account: Account): string {
    if (account.parentAccount) {
      return `${account.parentAccount.code} - ${account.parentAccount.name}`;
    }
    return "-";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chart of Accounts</h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s financial accounts
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent Account</TableHead>
                <TableHead className="text-right">Balance (PKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono font-medium">
                    {account.code}
                  </TableCell>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>
                    <Badge variant={TYPE_COLORS[account.type] ?? "secondary"}>
                      {account.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getParentAccountName(account)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    PKR {Number(account.balance).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && accounts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No accounts found. Create your first account to get started.
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading accounts...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
            <DialogDescription>
              Create a new account in the chart of accounts.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Account Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g. 1001"
                  value={form.code}
                  onChange={(e) => updateField("code", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type *</Label>
                <Select
                  id="accountType"
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Cash in Hand"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentAccountId">Parent Account</Label>
              <Select
                id="parentAccountId"
                value={form.parentAccountId}
                onChange={(e) => updateField("parentAccountId", e.target.value)}
              >
                <option value="">None (Top-level account)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Optional account description..."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
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
              <Button type="submit" disabled={createAccount.isPending}>
                {createAccount.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
