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
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId: string | null;
  parent?: { id: string; code: string; name: string } | null;
  isHeader: boolean;
  normalBalance: string;
  currency: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

interface AccountFormState {
  code: string;
  name: string;
  type: string;
  parentId: string;
  isHeader: boolean;
  normalBalance: string;
  currency: string;
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
  { value: "COGS", label: "Cost of Goods Sold" },
  { value: "EXPENSE", label: "Expense" },
  { value: "OTHER_INCOME", label: "Other Income" },
  { value: "OTHER_EXPENSE", label: "Other Expense" },
];

const TYPE_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  ASSET: "default",
  LIABILITY: "destructive",
  EQUITY: "secondary",
  REVENUE: "success",
  COGS: "warning",
  EXPENSE: "warning",
  OTHER_INCOME: "success",
  OTHER_EXPENSE: "destructive",
};

const DEBIT_TYPES = ["ASSET", "COGS", "EXPENSE", "OTHER_EXPENSE"];

function defaultNormalBalance(type: string): "DEBIT" | "CREDIT" {
  return DEBIT_TYPES.includes(type) ? "DEBIT" : "CREDIT";
}

const EMPTY_FORM: AccountFormState = {
  code: "",
  name: "",
  type: "ASSET",
  parentId: "",
  isHeader: false,
  normalBalance: "DEBIT",
  currency: "PKR",
  description: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChartOfAccountsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  const [form, setForm] = useState<AccountFormState>({ ...EMPTY_FORM });

  // ---- Fetch accounts ----
  const { data, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await api.get("/finance/accounts?pageSize=200");
      return data;
    },
  });

  const accounts: Account[] = data?.data ?? [];

  // ---- Create account mutation ----
  const createAccount = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/finance/accounts", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Account created successfully");
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to create account";
      toast.error(message);
    },
  });

  // ---- Update account mutation ----
  const updateAccount = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const { data } = await api.patch(`/finance/accounts/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Account updated successfully");
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update account";
      toast.error(message);
    },
  });

  // ---- Delete account mutation ----
  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/finance/accounts/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Account deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingAccount(null);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to delete account";
      toast.error(message);
    },
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingAccount(null);
    setForm({ ...EMPTY_FORM });
  }

  function openCreate() {
    setEditingAccount(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  }

  function openEdit(account: Account) {
    setEditingAccount(account);
    setForm({
      code: account.code,
      name: account.name,
      type: account.type,
      parentId: account.parentId ?? "",
      isHeader: account.isHeader,
      normalBalance: account.normalBalance,
      currency: account.currency ?? "PKR",
      description: account.description ?? "",
    });
    setDialogOpen(true);
  }

  function openDelete(account: Account) {
    setDeletingAccount(account);
    setDeleteDialogOpen(true);
  }

  function updateField<K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "type") {
        next.normalBalance = defaultNormalBalance(value as string);
      }
      return next;
    });
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

    const payload: Record<string, unknown> = {
      code: form.code,
      name: form.name,
      type: form.type,
      parentId: form.parentId || undefined,
      isHeader: form.isHeader,
      normalBalance: form.normalBalance,
      currency: form.currency,
      description: form.description || undefined,
    };

    if (editingAccount) {
      updateAccount.mutate({ id: editingAccount.id, payload });
    } else {
      createAccount.mutate(payload);
    }
  }

  function getParentAccountName(account: Account): string {
    if (account.parent) {
      return `${account.parent.code} - ${account.parent.name}`;
    }
    return "-";
  }

  const isPending = createAccount.isPending || updateAccount.isPending;

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
        <Button onClick={openCreate}>
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
                <TableHead>Normal Balance</TableHead>
                <TableHead>Parent Account</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono font-medium">
                    {account.code}
                  </TableCell>
                  <TableCell className="font-medium">
                    {account.isHeader ? (
                      <span className="font-bold">{account.name}</span>
                    ) : (
                      account.name
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={TYPE_COLORS[account.type] ?? "secondary"}>
                      {account.type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.normalBalance === "DEBIT" ? "outline" : "secondary"}>
                      {account.normalBalance}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getParentAccountName(account)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(account)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDelete(account)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No accounts found. Create your first account to get started.
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading accounts...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Account Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent onClose={closeDialog}>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
            <DialogDescription>
              {editingAccount
                ? "Update account details in the chart of accounts."
                : "Create a new account in the chart of accounts."}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="normalBalance">Normal Balance *</Label>
                <Select
                  id="normalBalance"
                  value={form.normalBalance}
                  onChange={(e) => updateField("normalBalance", e.target.value)}
                >
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Credit</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={form.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Account</Label>
              <Select
                id="parentId"
                value={form.parentId}
                onChange={(e) => updateField("parentId", e.target.value)}
              >
                <option value="">None (Top-level account)</option>
                {accounts
                  .filter((acc) => acc.id !== editingAccount?.id)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHeader"
                checked={form.isHeader}
                onChange={(e) => updateField("isHeader", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isHeader">Header account (grouping only, no transactions)</Label>
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
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingAccount ? "Update Account" : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !open && setDeleteDialogOpen(false)}>
        <DialogContent onClose={() => setDeleteDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete account{" "}
              <strong>{deletingAccount?.code} - {deletingAccount?.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteAccount.isPending}
              onClick={() => deletingAccount && deleteAccount.mutate(deletingAccount.id)}
            >
              {deleteAccount.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
