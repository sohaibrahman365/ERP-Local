"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  recordInstallmentPaymentSchema,
  type CreateBookingInput,
} from "@wise/shared";
import { PAYMENT_METHODS } from "@wise/shared";
import { z } from "zod";
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
} from "@wise/ui";
import { api } from "@/lib/api";
import { ArrowLeft, ChevronDown, ChevronRight, CreditCard } from "lucide-react";
import Link from "next/link";

type RecordPaymentInput = z.infer<typeof recordInstallmentPaymentSchema>;

interface Installment {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: string;
}

interface BookingUnit {
  id: string;
  unitNumber: string;
  project?: {
    id: string;
    name: string;
  };
}

interface BookingCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  unitId: string;
  customerId: string;
  totalAmount: number;
  downPayment: number;
  status: string;
  bookingDate: string;
  unit?: BookingUnit;
  customer?: BookingCustomer;
  installments?: Installment[];
}

const STATUS_VARIANT: Record<string, "success" | "secondary" | "destructive" | "outline"> = {
  CONFIRMED: "success",
  PENDING: "secondary",
  CANCELLED: "destructive",
  COMPLETED: "success",
  ACTIVE: "success",
};

const INSTALLMENT_STATUS_VARIANT: Record<string, "success" | "secondary" | "destructive" | "outline"> = {
  PAID: "success",
  PENDING: "secondary",
  OVERDUE: "destructive",
  PARTIAL: "outline",
};

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["re-bookings", page],
    queryFn: async () => {
      const { data } = await api.get(
        `/real-estate/bookings?page=${page}&pageSize=${pageSize}`
      );
      return data;
    },
  });

  const bookings: Booking[] = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, pageSize, total: 0, totalPages: 1 };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecordPaymentInput>({
    resolver: zodResolver(recordInstallmentPaymentSchema),
  });

  const recordPayment = useMutation({
    mutationFn: async (payload: RecordPaymentInput) => {
      if (!selectedBookingId || !selectedInstallment) return;
      const { data } = await api.post(
        `/real-estate/bookings/${selectedBookingId}/installments/${selectedInstallment.id}/pay`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      setPaymentDialogOpen(false);
      setSelectedInstallment(null);
      setSelectedBookingId(null);
      reset();
      queryClient.invalidateQueries({ queryKey: ["re-bookings"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to record payment";
      toast.error(message);
    },
  });

  const onPaymentSubmit = (data: RecordPaymentInput) => {
    recordPayment.mutate(data);
  };

  const toggleExpandBooking = (bookingId: string) => {
    setExpandedBookingId((prev) => (prev === bookingId ? null : bookingId));
  };

  const openPaymentDialog = (booking: Booking, installment: Installment) => {
    setSelectedBookingId(booking.id);
    setSelectedInstallment(installment);
    const remaining = installment.amountDue - installment.amountPaid;
    reset({
      amountPaid: remaining > 0 ? remaining : installment.amountDue,
      paymentMethod: "BANK_TRANSFER",
      paymentRef: "",
      notes: "",
    });
    setPaymentDialogOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/real-estate">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">
            Real estate unit bookings and installment tracking
          </p>
        </div>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            Click a row to expand and view the installment schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Booking #</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Down Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const isExpanded = expandedBookingId === booking.id;
                const installments = booking.installments ?? [];

                return (
                  <TableRow key={booking.id} className="group">
                    <TableCell colSpan={8} className="p-0">
                      {/* Booking Row */}
                      <button
                        type="button"
                        className="w-full text-left hover:bg-muted/50 transition-colors"
                        onClick={() => toggleExpandBooking(booking.id)}
                      >
                        <div className="flex items-center px-4 py-3">
                          <div className="w-10 flex items-center justify-center">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 grid grid-cols-7 gap-4 items-center">
                            <span className="font-medium">
                              {booking.bookingNumber ?? booking.id.slice(0, 8)}
                            </span>
                            <span>
                              {booking.unit?.project?.name ?? "-"}{" "}
                              {booking.unit?.unitNumber
                                ? `- ${booking.unit.unitNumber}`
                                : ""}
                            </span>
                            <span>
                              {booking.customer
                                ? `${booking.customer.firstName} ${booking.customer.lastName}`
                                : booking.customerId.slice(0, 8)}
                            </span>
                            <span className="font-medium">
                              PKR{" "}
                              {Number(booking.totalAmount).toLocaleString()}
                            </span>
                            <span>
                              PKR{" "}
                              {Number(booking.downPayment).toLocaleString()}
                            </span>
                            <span>
                              <Badge
                                variant={
                                  STATUS_VARIANT[booking.status] ?? "secondary"
                                }
                              >
                                {booking.status}
                              </Badge>
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(booking.bookingDate)}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Expanded Installment Schedule */}
                      {isExpanded && (
                        <div className="border-t bg-muted/30 px-4 py-4">
                          {installments.length > 0 ? (
                            <div className="rounded-md border bg-background">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Amount Due</TableHead>
                                    <TableHead>Amount Paid</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                      Action
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {installments.map((inst) => {
                                    const remaining =
                                      inst.amountDue - inst.amountPaid;
                                    const canPay =
                                      remaining > 0 &&
                                      inst.status !== "PAID";

                                    return (
                                      <TableRow key={inst.id}>
                                        <TableCell className="font-medium">
                                          {inst.installmentNumber}
                                        </TableCell>
                                        <TableCell>
                                          {formatDate(inst.dueDate)}
                                        </TableCell>
                                        <TableCell>
                                          PKR{" "}
                                          {Number(
                                            inst.amountDue
                                          ).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                          PKR{" "}
                                          {Number(
                                            inst.amountPaid
                                          ).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              INSTALLMENT_STATUS_VARIANT[
                                                inst.status
                                              ] ?? "secondary"
                                            }
                                          >
                                            {inst.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {canPay && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                openPaymentDialog(
                                                  booking,
                                                  inst
                                                )
                                              }
                                            >
                                              <CreditCard className="h-3 w-3 mr-1" />
                                              Record Payment
                                            </Button>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No installment schedule generated for this
                              booking
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && bookings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No bookings yet
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading bookings...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {meta.page} of {meta.totalPages} ({meta.total} total
            bookings)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Installment Payment</DialogTitle>
            <DialogDescription>
              {selectedInstallment && (
                <>
                  Installment #{selectedInstallment.installmentNumber} - Due:{" "}
                  {formatDate(selectedInstallment.dueDate)} - Remaining: PKR{" "}
                  {(
                    selectedInstallment.amountDue -
                    selectedInstallment.amountPaid
                  ).toLocaleString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onPaymentSubmit)}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="amountPaid">Amount (PKR) *</Label>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                {...register("amountPaid", { valueAsNumber: true })}
              />
              {errors.amountPaid && (
                <p className="text-sm text-destructive">
                  {errors.amountPaid.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={watch("paymentMethod") ?? "BANK_TRANSFER"}
                onChange={(e) =>
                  setValue("paymentMethod", e.target.value, { shouldValidate: true })
                }
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
              {errors.paymentMethod && (
                <p className="text-sm text-destructive">
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentRef">Payment Reference</Label>
              <Input
                id="paymentRef"
                placeholder="e.g. Cheque #, Transaction ID"
                {...register("paymentRef")}
              />
              {errors.paymentRef && (
                <p className="text-sm text-destructive">
                  {errors.paymentRef.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Optional notes"
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">
                  {errors.notes.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPaymentDialogOpen(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={recordPayment.isPending}>
                {recordPayment.isPending ? "Processing..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
