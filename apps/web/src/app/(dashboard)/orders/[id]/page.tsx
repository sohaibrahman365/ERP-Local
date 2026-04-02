"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Textarea,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@wise/ui";
import { api } from "@/lib/api";
import { ArrowLeft, Truck, Package, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrderStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED"
  | "CANCELLED"
  | "ON_HOLD";

type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED";

interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
  };
}

interface Shipment {
  id: string;
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: string;
  weightKg: number | null;
  shippingCost: number | null;
  codAmount: number | null;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

interface Customer {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  type: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  channel: string;
  subtotalAmount: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes: string | null;
  internalNotes: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  items: OrderItem[];
  shipments: Shipment[];
}

// ---------------------------------------------------------------------------
// Status workflow helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  DRAFT: "secondary",
  PENDING_PAYMENT: "warning",
  CONFIRMED: "default",
  PROCESSING: "warning",
  PACKED: "default",
  SHIPPED: "default",
  OUT_FOR_DELIVERY: "default",
  DELIVERED: "success",
  RETURN_REQUESTED: "warning",
  RETURNED: "destructive",
  REFUNDED: "destructive",
  CANCELLED: "destructive",
  ON_HOLD: "secondary",
};

const PAYMENT_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  UNPAID: "destructive",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  REFUNDED: "secondary",
};

interface StatusAction {
  label: string;
  nextStatus: OrderStatus;
  variant: "default" | "destructive" | "outline" | "secondary";
  icon?: React.ReactNode;
}

function getAvailableActions(status: OrderStatus): StatusAction[] {
  const actions: StatusAction[] = [];

  switch (status) {
    case "DRAFT":
    case "PENDING_PAYMENT":
      actions.push({
        label: "Confirm Order",
        nextStatus: "CONFIRMED",
        variant: "default",
        icon: <CheckCircle className="h-4 w-4 mr-2" />,
      });
      break;
    case "CONFIRMED":
      actions.push({
        label: "Start Processing",
        nextStatus: "PROCESSING",
        variant: "default",
        icon: <Package className="h-4 w-4 mr-2" />,
      });
      break;
    case "PROCESSING":
      actions.push({
        label: "Mark as Packed",
        nextStatus: "PACKED",
        variant: "default",
        icon: <Package className="h-4 w-4 mr-2" />,
      });
      break;
    case "PACKED":
      actions.push({
        label: "Ship Order",
        nextStatus: "SHIPPED",
        variant: "default",
        icon: <Truck className="h-4 w-4 mr-2" />,
      });
      break;
    case "SHIPPED":
      actions.push({
        label: "Out for Delivery",
        nextStatus: "OUT_FOR_DELIVERY",
        variant: "default",
        icon: <Truck className="h-4 w-4 mr-2" />,
      });
      break;
    case "OUT_FOR_DELIVERY":
      actions.push({
        label: "Mark Delivered",
        nextStatus: "DELIVERED",
        variant: "default",
        icon: <CheckCircle className="h-4 w-4 mr-2" />,
      });
      break;
    default:
      break;
  }

  // Cancel is available for any non-terminal status
  const terminalStatuses: OrderStatus[] = ["DELIVERED", "RETURNED", "REFUNDED", "CANCELLED"];
  if (!terminalStatuses.includes(status)) {
    actions.push({
      label: "Cancel Order",
      nextStatus: "CANCELLED",
      variant: "destructive",
      icon: <XCircle className="h-4 w-4 mr-2" />,
    });
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const orderId = params.id;

  // ---- Fetch Order --------------------------------------------------------

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery<Order>({
    queryKey: ["orders", orderId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Order }>(`/orders/${orderId}`);
      return data.data;
    },
    enabled: !!orderId,
  });

  // ---- Status Mutation ----------------------------------------------------

  const statusMutation = useMutation({
    mutationFn: async ({
      status,
      internalNotes,
      cancellationReason: reason,
    }: {
      status: OrderStatus;
      internalNotes?: string;
      cancellationReason?: string;
    }) => {
      const { data } = await api.patch(`/orders/${orderId}/status`, {
        status,
        internalNotes: internalNotes || undefined,
        cancellationReason: reason || undefined,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Order status updated to ${variables.status.replace(/_/g, " ")}`);
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setCancelDialogOpen(false);
      setCancellationReason("");
      setInternalNote("");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update order status";
      toast.error(message);
    },
  });

  // ---- Handlers -----------------------------------------------------------

  function handleStatusChange(nextStatus: OrderStatus) {
    if (nextStatus === "CANCELLED") {
      setCancelDialogOpen(true);
      return;
    }
    statusMutation.mutate({ status: nextStatus, internalNotes: internalNote || undefined });
  }

  function handleConfirmCancel() {
    statusMutation.mutate({
      status: "CANCELLED",
      cancellationReason: cancellationReason || undefined,
      internalNotes: internalNote || undefined,
    });
  }

  // ---- Loading / Error States ---------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <Link href="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Order not found or an error occurred.
          </CardContent>
        </Card>
      </div>
    );
  }

  const actions = getAvailableActions(order.status);

  // ---- Render -------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
      </Link>

      {/* ---------- Order Header ---------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-PK", { dateStyle: "long" })}
            {" via "}
            <span className="capitalize">{order.channel.toLowerCase()}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={STATUS_COLORS[order.status] ?? "secondary"}>
            {order.status.replace(/_/g, " ")}
          </Badge>
          <Badge variant={PAYMENT_COLORS[order.paymentStatus] ?? "secondary"}>
            {order.paymentStatus.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      {/* ---------- Status Actions ---------- */}
      {actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
            <CardDescription>Update the order status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Optional internal note for the next action */}
              <div className="space-y-1.5">
                <Label htmlFor="internalNote">Internal Note (optional)</Label>
                <Textarea
                  id="internalNote"
                  placeholder="Add an internal note for this status change..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.nextStatus}
                    variant={action.variant}
                    disabled={statusMutation.isPending}
                    onClick={() => handleStatusChange(action.nextStatus)}
                  >
                    {statusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      action.icon
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------- Customer Info ---------- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Name: </span>
              <Link href={`/customers/${order.customer.id}`} className="font-medium hover:underline">
                {order.customer.fullName}
              </Link>
            </div>
            {order.customer.email && (
              <div>
                <span className="text-muted-foreground">Email: </span>
                {order.customer.email}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Phone: </span>
              {order.customer.phone}
            </div>
            <div>
              <span className="text-muted-foreground">Type: </span>
              <Badge variant="outline" className="text-xs">{order.customer.type}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* ---------- Order Totals ---------- */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">PKR {Number(order.subtotalAmount).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tax</dt>
                <dd className="font-medium">PKR {Number(order.taxAmount).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-medium">PKR {Number(order.shippingAmount).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="font-medium text-red-600">
                  -PKR {Number(order.discountAmount).toLocaleString()}
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-4 border-t pt-2 mt-2">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="text-xl font-bold">PKR {Number(order.totalAmount).toLocaleString()}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* ---------- Order Items Table ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.product.sku}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">PKR {Number(item.unitPrice).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-red-600">
                    {Number(item.discountAmount) > 0
                      ? `-PKR ${Number(item.discountAmount).toLocaleString()}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">PKR {Number(item.taxAmount).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    PKR {Number(item.totalAmount).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {order.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No items
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ---------- Shipments ---------- */}
      {order.shipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shipments ({order.shipments.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.shipments.map((shipment) => (
              <div
                key={shipment.id}
                className="rounded-md border p-4 space-y-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={shipment.status === "DELIVERED" ? "success" : "default"}>
                    {shipment.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(shipment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
                  {shipment.courier && (
                    <div>
                      <span className="text-muted-foreground">Courier: </span>
                      {shipment.courier}
                    </div>
                  )}
                  {shipment.trackingNumber && (
                    <div>
                      <span className="text-muted-foreground">Tracking: </span>
                      {shipment.trackingUrl ? (
                        <a
                          href={shipment.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {shipment.trackingNumber}
                        </a>
                      ) : (
                        shipment.trackingNumber
                      )}
                    </div>
                  )}
                  {shipment.weightKg != null && (
                    <div>
                      <span className="text-muted-foreground">Weight: </span>
                      {shipment.weightKg} kg
                    </div>
                  )}
                  {shipment.shippingCost != null && (
                    <div>
                      <span className="text-muted-foreground">Cost: </span>
                      PKR {Number(shipment.shippingCost).toLocaleString()}
                    </div>
                  )}
                  {shipment.codAmount != null && Number(shipment.codAmount) > 0 && (
                    <div>
                      <span className="text-muted-foreground">COD: </span>
                      PKR {Number(shipment.codAmount).toLocaleString()}
                    </div>
                  )}
                  {shipment.estimatedDelivery && (
                    <div>
                      <span className="text-muted-foreground">ETA: </span>
                      {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                    </div>
                  )}
                  {shipment.shippedAt && (
                    <div>
                      <span className="text-muted-foreground">Shipped: </span>
                      {new Date(shipment.shippedAt).toLocaleDateString()}
                    </div>
                  )}
                  {shipment.deliveredAt && (
                    <div>
                      <span className="text-muted-foreground">Delivered: </span>
                      {new Date(shipment.deliveredAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ---------- Internal Notes ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {order.internalNotes ? (
            <p className="text-sm whitespace-pre-wrap">{order.internalNotes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No internal notes.</p>
          )}
          {order.cancellationReason && (
            <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/5 p-3">
              <p className="text-sm font-medium text-destructive">Cancellation Reason</p>
              <p className="text-sm mt-1">{order.cancellationReason}</p>
            </div>
          )}
          {order.notes && (
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">Customer Notes</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Cancel Dialog ---------- */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent onClose={() => setCancelDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel order <strong>{order.orderNumber}</strong>? This
              action cannot be undone.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="cancelReason">Cancellation Reason</Label>
              <Textarea
                id="cancelReason"
                placeholder="Provide a reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Order
            </Button>
            <Button
              variant="destructive"
              disabled={statusMutation.isPending}
              onClick={handleConfirmCancel}
            >
              {statusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
