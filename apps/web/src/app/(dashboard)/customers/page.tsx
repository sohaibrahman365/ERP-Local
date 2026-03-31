"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Badge, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@wise/ui";
import { api } from "@/lib/api";
import { Plus } from "lucide-react";

export default function CustomersPage() {
  const { data } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => (await api.get("/customers?pageSize=50")).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Customer management and 360 profiles</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Add Customer</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Lifetime Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.data ?? []).map((c: { id: string; fullName: string; email: string; phone: string; segment: string; lifetimeValue: number }) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.fullName}</TableCell>
                  <TableCell>{c.email ?? "-"}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell><Badge variant="secondary">{c.segment}</Badge></TableCell>
                  <TableCell>PKR {Number(c.lifetimeValue).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
