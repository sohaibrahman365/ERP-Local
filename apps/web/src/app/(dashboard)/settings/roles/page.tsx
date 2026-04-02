"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@wise/ui";
import { api } from "@/lib/api";
import { Plus, Shield, ChevronDown, ChevronUp, Users, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  createdAt: string;
}

interface CreateRolePayload {
  name: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupPermissions(permissions: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const perm of permissions) {
    const module = perm.split(":")[0] ?? "other";
    if (!groups[module]) groups[module] = [];
    groups[module]!.push(perm);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Query
  const { data: rolesData, isLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data } = await api.get("/admin/roles");
      return data;
    },
  });

  const roles: Role[] = rolesData?.data ?? [];

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (payload: CreateRolePayload) => {
      const { data } = await api.post("/admin/roles", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Role created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create role";
      toast.error(message);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRoleMutation.mutate({ name, description });
  };

  const toggleExpanded = (roleId: string) => {
    setExpandedRole((prev) => (prev === roleId ? null : roleId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="text-muted-foreground">
            Manage roles and permission assignments
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Roles List */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && roles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No roles defined yet. Create your first role to get started.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {roles.map((role) => {
          const isExpanded = expandedRole === role.id;
          const grouped = groupPermissions(role.permissions ?? []);
          const moduleNames = Object.keys(grouped).sort();

          return (
            <Card key={role.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {role.name}
                        {role.isSystem && (
                          <Badge variant="outline" className="text-xs">
                            System
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {role.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        {role.userCount} {role.userCount === 1 ? "user" : "users"}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {(role.permissions ?? []).length} permissions
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpanded(role.id)}
                      className="h-8 w-8"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (role.permissions ?? []).length > 0 && (
                <CardContent className="pt-0">
                  <div className="border-t pt-4 space-y-3">
                    {moduleNames.map((mod) => (
                      <div key={mod}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                          {mod}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(grouped[mod] ?? []).map((perm) => (
                            <Badge
                              key={perm}
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              {isExpanded && (role.permissions ?? []).length === 0 && (
                <CardContent className="pt-0">
                  <div className="border-t pt-4 text-sm text-muted-foreground">
                    No permissions assigned to this role.
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Create Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
            <DialogDescription>
              Create a new role. You can assign permissions after creation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  placeholder="e.g. Sales Manager"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDescription">Description</Label>
                <Textarea
                  id="roleDescription"
                  placeholder="Brief description of this role's responsibilities"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRoleMutation.isPending}>
                {createRoleMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Role"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
