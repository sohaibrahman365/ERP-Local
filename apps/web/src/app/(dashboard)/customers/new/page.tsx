"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCustomerSchema, type CreateCustomerInput } from "@wise/shared";
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
  Textarea,
} from "@wise/ui";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateCustomerPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      type: "INDIVIDUAL",
      segment: "NEW",
      currency: "PKR",
      tags: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateCustomerInput) => {
      const { data } = await api.post("/customers", values);
      return data;
    },
    onSuccess: () => {
      toast.success("Customer created successfully");
      router.push("/customers");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create customer";
      toast.error(message);
    },
  });

  function onSubmit(values: CreateCustomerInput) {
    createMutation.mutate(values);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back link */}
      <Link
        href="/customers"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
      </Link>

      <div>
        <h1 className="text-3xl font-bold">New Customer</h1>
        <p className="text-muted-foreground">Add a new customer to the system</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Fill in the details below to create a customer record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ---- Row: Type & Segment ---- */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="type">Customer Type</Label>
                <Select id="type" {...register("type")}>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="BUSINESS">Business</option>
                  <option value="DEALER">Dealer</option>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="segment">Segment</Label>
                <Select id="segment" {...register("segment")}>
                  <option value="NEW">New</option>
                  <option value="RETURNING">Returning</option>
                  <option value="VIP">VIP</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="OVERSEAS">Overseas</option>
                </Select>
                {errors.segment && (
                  <p className="text-sm text-destructive">{errors.segment.message}</p>
                )}
              </div>
            </div>

            {/* ---- Full Name ---- */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="Enter full name"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            {/* ---- Row: Email & Phone ---- */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  placeholder="03001234567"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* ---- WhatsApp ---- */}
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                placeholder="923001234567"
                {...register("whatsapp")}
              />
              {errors.whatsapp && (
                <p className="text-sm text-destructive">{errors.whatsapp.message}</p>
              )}
            </div>

            {/* ---- Row: CNIC & NTN ---- */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cnic">CNIC</Label>
                <Input
                  id="cnic"
                  placeholder="35201-1234567-1"
                  {...register("cnic")}
                />
                {errors.cnic && (
                  <p className="text-sm text-destructive">{errors.cnic.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ntn">NTN (National Tax Number)</Label>
                <Input
                  id="ntn"
                  placeholder="1234567-8"
                  {...register("ntn")}
                />
                {errors.ntn && (
                  <p className="text-sm text-destructive">{errors.ntn.message}</p>
                )}
              </div>
            </div>

            {/* ---- Company Name ---- */}
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Company or business name (if applicable)"
                {...register("companyName")}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            {/* ---- Source ---- */}
            <div className="space-y-1.5">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="e.g., Website, Referral, Walk-in"
                {...register("source")}
              />
              {errors.source && (
                <p className="text-sm text-destructive">{errors.source.message}</p>
              )}
            </div>

            {/* ---- Notes ---- */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this customer..."
                rows={3}
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">{errors.notes.message}</p>
              )}
            </div>

            {/* ---- Actions ---- */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/customers")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Customer
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
