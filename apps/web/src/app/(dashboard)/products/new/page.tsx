"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProductSchema, type CreateProductInput } from "@wise/shared";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Label,
  Select,
  Textarea,
} from "@wise/ui";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      taxRatePct: 17,
      status: "DRAFT",
      isFeatured: false,
      warrantyMonths: 0,
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories?pageSize=100");
      return data;
    },
  });

  const categories: Category[] = categoriesData?.data ?? [];

  const createProduct = useMutation({
    mutationFn: async (payload: CreateProductInput) => {
      const { data } = await api.post("/products", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Product created successfully");
      router.push("/products");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create product";
      toast.error(message);
    },
  });

  const onSubmit = (data: CreateProductInput) => {
    createProduct.mutate(data);
  };

  const selectedStatus = watch("status");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Product</h1>
          <p className="text-muted-foreground">
            Add a new product to the catalog
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  placeholder="e.g. WM-ELEC-001"
                  {...register("sku")}
                />
                {errors.sku && (
                  <p className="text-sm text-destructive">
                    {errors.sku.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  value={watch("categoryId") ?? ""}
                  onChange={(e) =>
                    setValue("categoryId", e.target.value, { shouldValidate: true })
                  }
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-destructive">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g. Samsung"
                  {...register("brand")}
                />
                {errors.brand && (
                  <p className="text-sm text-destructive">
                    {errors.brand.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price (PKR) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("basePrice", { valueAsNumber: true })}
                />
                {errors.basePrice && (
                  <p className="text-sm text-destructive">
                    {errors.basePrice.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (PKR)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("costPrice", { valueAsNumber: true })}
                />
                {errors.costPrice && (
                  <p className="text-sm text-destructive">
                    {errors.costPrice.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRatePct">Tax Rate (%)</Label>
                <Input
                  id="taxRatePct"
                  type="number"
                  step="0.01"
                  placeholder="17"
                  {...register("taxRatePct", { valueAsNumber: true })}
                />
                {errors.taxRatePct && (
                  <p className="text-sm text-destructive">
                    {errors.taxRatePct.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shortDesc">Short Description</Label>
              <Textarea
                id="shortDesc"
                placeholder="Brief product description (max 500 chars)"
                rows={2}
                {...register("shortDesc")}
              />
              {errors.shortDesc && (
                <p className="text-sm text-destructive">
                  {errors.shortDesc.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="longDesc">Long Description</Label>
              <Textarea
                id="longDesc"
                placeholder="Detailed product description"
                rows={5}
                {...register("longDesc")}
              />
              {errors.longDesc && (
                <p className="text-sm text-destructive">
                  {errors.longDesc.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={selectedStatus ?? "DRAFT"}
                  onChange={(e) =>
                    setValue(
                      "status",
                      e.target.value as CreateProductInput["status"],
                      { shouldValidate: true }
                    )
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive">
                    {errors.status.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="warrantyMonths">Warranty (Months)</Label>
                <Input
                  id="warrantyMonths"
                  type="number"
                  placeholder="0"
                  {...register("warrantyMonths", { valueAsNumber: true })}
                />
                {errors.warrantyMonths && (
                  <p className="text-sm text-destructive">
                    {errors.warrantyMonths.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-8">
                <input
                  id="isFeatured"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  {...register("isFeatured")}
                />
                <Label htmlFor="isFeatured">Featured Product</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Link href="/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createProduct.isPending}>
            {createProduct.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Create Product
          </Button>
        </div>
      </form>
    </div>
  );
}
