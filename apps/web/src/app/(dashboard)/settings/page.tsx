"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@wise/ui";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export default function SettingsPage() {
  const { user, tenant } = useAuthStore();

  const { data: tenantData } = useQuery({
    queryKey: ["tenant-settings"],
    queryFn: async () => (await api.get("/admin/tenant")).data,
  });

  const t = tenantData?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Tenant and account configuration</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{t?.name ?? tenant?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium">{t?.plan ?? tenant?.plan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{t?.status ?? "ACTIVE"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user?.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">{user?.role ?? "Admin"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
