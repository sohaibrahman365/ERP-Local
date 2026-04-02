"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@wise/ui";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  ShoppingCart,
  Wallet,
  CreditCard,
  Crown,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Address {
  id: string;
  label: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateProvince: string | null;
  postalCode: string | null;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
}

interface Lead {
  id: string;
  title: string;
  status: string;
  source: string | null;
  value: number | null;
  assignedTo: string | null;
  createdAt: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user: { fullName: string } | null;
}

interface Customer {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  whatsapp: string | null;
  segment: string;
  loyaltyTier: string | null;
  loyaltyPoints: number;
  lifetimeValue: number;
  totalOrders: number;
  outstandingBalance: number;
  currency: string;
  createdAt: string;
  addresses: Address[];
  orders: CustomerOrder[];
  leads: Lead[];
  activities: Activity[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORDER_STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  DELIVERED: "success",
  CONFIRMED: "default",
  PROCESSING: "warning",
  SHIPPED: "default",
  CANCELLED: "destructive",
  PENDING_PAYMENT: "secondary",
};

const LEAD_STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  NEW: "secondary",
  CONTACTED: "default",
  QUALIFIED: "warning",
  NEGOTIATION: "warning",
  WON: "success",
  LOST: "destructive",
};

const ACTIVITY_TYPE_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  CALL: "default",
  EMAIL: "secondary",
  MEETING: "warning",
  NOTE: "outline",
  TASK: "success",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const [activeTab, setActiveTab] = useState("orders");

  const {
    data: customer,
    isLoading,
    isError,
  } = useQuery<Customer>({
    queryKey: ["customers", customerId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Customer }>(
        `/customers/${customerId}`
      );
      return data.data;
    },
    enabled: !!customerId,
  });

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error
  if (isError || !customer) {
    return (
      <div className="space-y-4">
        <Link
          href="/customers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Customer not found or an error occurred.
          </CardContent>
        </Card>
      </div>
    );
  }

  const orders = customer.orders ?? [];
  const addresses = customer.addresses ?? [];
  const leads = customer.leads ?? [];
  const activities = customer.activities ?? [];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/customers"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{customer.fullName}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {customer.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-4 w-4" /> {customer.email}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Phone className="h-4 w-4" /> {customer.phone}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
            <p className="text-2xl font-bold">{customer.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
            <p className="text-2xl font-bold">
              PKR {Number(customer.lifetimeValue).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Outstanding</p>
            </div>
            <p className="text-2xl font-bold">
              PKR {Number(customer.outstandingBalance ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loyalty Tier</p>
            </div>
            <p className="text-2xl font-bold">
              {customer.loyaltyTier ?? "Standard"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="addresses">
            Addresses ({addresses.length})
          </TabsTrigger>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="activity">
            Activity ({activities.length})
          </TabsTrigger>
        </TabsList>

        {/* ==================== ORDERS TAB ==================== */}
        <TabsContent value="orders">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Order History</CardTitle>
              <CardDescription>
                All orders placed by {customer.fullName}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No orders yet
                      </TableCell>
                    </TableRow>
                  )}
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ORDER_STATUS_COLORS[order.status] ?? "secondary"
                          }
                        >
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.paymentStatus === "PAID" ? "success" : "warning"
                          }
                        >
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        PKR {Number(order.totalAmount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ADDRESSES TAB ==================== */}
        <TabsContent value="addresses">
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {addresses.length === 0 && (
              <Card className="md:col-span-2">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No addresses on file
                </CardContent>
              </Card>
            )}
            {addresses.map((address) => (
              <Card key={address.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {address.label || "Address"}
                    </CardTitle>
                    {address.isDefault && (
                      <Badge variant="success" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p>
                    {address.city}
                    {address.stateProvince ? `, ${address.stateProvince}` : ""}
                    {address.postalCode ? ` ${address.postalCode}` : ""}
                  </p>
                  <p className="text-muted-foreground">{address.country}</p>
                  {address.phone && (
                    <p className="text-muted-foreground">
                      Phone: {address.phone}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ==================== LEADS TAB ==================== */}
        <TabsContent value="leads">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Associated Leads</CardTitle>
              <CardDescription>
                CRM leads linked to {customer.fullName}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No leads associated
                      </TableCell>
                    </TableRow>
                  )}
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            LEAD_STATUS_COLORS[lead.status] ?? "secondary"
                          }
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.source ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        {lead.value != null
                          ? `PKR ${Number(lead.value).toLocaleString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ACTIVITY TAB ==================== */}
        <TabsContent value="activity">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Activity Log</CardTitle>
              <CardDescription>
                Recent interactions and activities for {customer.fullName}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No activity recorded
                      </TableCell>
                    </TableRow>
                  )}
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <Badge
                          variant={
                            ACTIVITY_TYPE_COLORS[activity.type] ?? "secondary"
                          }
                        >
                          {activity.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {activity.description}
                      </TableCell>
                      <TableCell>
                        {activity.user?.fullName ?? "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
