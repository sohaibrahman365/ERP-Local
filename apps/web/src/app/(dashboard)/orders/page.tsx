"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@wise/ui";
import { api } from "@/lib/api";

const statusColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  DELIVERED: "success",
  CONFIRMED: "default",
  PROCESSING: "warning",
  SHIPPED: "default",
  CANCELLED: "destructive",
  PENDING_PAYMENT: "secondary",
};

export default function OrdersPage() {
  const { data } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await api.get("/orders?pageSize=50");
      return data;
    },
  });

  const orders = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders and fulfillment</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order: { id: string; orderNumber: string; customer?: { fullName: string }; totalAmount: number; status: string; paymentStatus: string; createdAt: string }) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.customer?.fullName ?? "-"}</TableCell>
                  <TableCell>PKR {Number(order.totalAmount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[order.status] ?? "secondary"}>{order.status.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.paymentStatus === "PAID" ? "success" : "warning"}>{order.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No orders yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
