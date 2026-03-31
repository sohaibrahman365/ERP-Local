"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@wise/ui";
import { api } from "@/lib/api";
import { Package, ShoppingCart, Users, Car, Building2, UserCog } from "lucide-react";

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/stats");
      return data.data;
    },
  });

  const cards = [
    { title: "Total Orders", value: stats?.ecommerce?.totalOrders ?? 0, icon: ShoppingCart, color: "text-blue-600" },
    { title: "Total Products", value: stats?.ecommerce?.totalProducts ?? 0, icon: Package, color: "text-green-600" },
    { title: "Total Customers", value: stats?.ecommerce?.totalCustomers ?? 0, icon: Users, color: "text-purple-600" },
    { title: "Vehicle Listings", value: stats?.automotive?.totalVehicles ?? 0, icon: Car, color: "text-orange-600" },
    { title: "RE Units", value: stats?.realEstate?.totalUnits ?? 0, icon: Building2, color: "text-indigo-600" },
    { title: "Employees", value: stats?.hr?.totalEmployees ?? 0, icon: UserCog, color: "text-pink-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Executive overview across all verticals</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentOrders.map((order: { id: string; orderNumber: string; customer: { fullName: string }; totalAmount: number; status: string }) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{order.customer?.fullName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">PKR {Number(order.totalAmount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
