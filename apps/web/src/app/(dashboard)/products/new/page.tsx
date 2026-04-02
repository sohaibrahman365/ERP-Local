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
  CardDescription,
  CardContent,
  Input,
  Label,
  Select,
  Textarea,
  Badge,
} from "@wise/ui";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

const ITEM_TYPES = [
  { value: "INVENTORY", label: "Inventory", description: "Physical goods tracked in stock" },
  { value: "SERVICE", label: "Service", description: "Intangible services billed by time or unit" },
  { value: "RAW_MATERIAL", label: "Raw Material", description: "Inputs for manufacturing or assembly" },
  { value: "CONSUMABLE", label: "Consumable", description: "Items consumed during operations" },
  { value: "BUNDLE", label: "Bundle", description: "A kit of multiple items sold together" },
] as const;

const UOM_OPTIONS = [
  "PCS", "KG", "GM", "LTR", "ML", "MTR", "CM",
  "SQM", "SQFT", "HR", "MIN", "SET", "BOX",
  "CARTON", "PAIR", "DOZEN", "UNIT",
] as const;

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
      itemType: "INVENTORY",
      uom: "PCS",
      taxRatePct: 17,
      status: "DRAFT",
      isFeatured: false,
      isPurchasable: true,
      isSellable: true,
      isTrackInventory: true,
      warrantyMonths: 0,
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/products/categories?pageSize=100");
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
      toast.success("Item created successfully");
      router.push("/products");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create item";
      toast.error(message);
    },
  });

  const onSubmit = (data: CreateProductInput) => {
    createProduct.mutate(data);
  };

  const selectedStatus = watch("status");
  const selectedItemType = watch("itemType");
  const isService = selectedItemType === "SERVICE";
  const isBundle = selectedItemType === "BUNDLE";
  const isTrackInventory = watch("isTrackInventory");

  // Auto-set isTrackInventory=false when SERVICE is selected
  const handleItemTypeChange = (value: CreateProductInput["itemType"]) => {
    setValue("itemType", value, { shouldValidate: true });
    if (value === "SERVICE") {
      setValue("isTrackInventory", false);
    } else if (value === "INVENTORY" || value === "RAW_MATERIAL") {
      setValue("isTrackInventory", true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Item</h1>
          <p className="text-muted-foreground">
            Add a new item to the catalog
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Item Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Item Type</CardTitle>
            <CardDescription>Select what kind of item you are creating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {ITEM_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleItemTypeChange(type.value)}
                  className={`flex flex-col items-start p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedItemType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="font-medium text-sm">{type.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {type.description}
                  </span>
                </button>
              ))}
            </div>
            {errors.itemType && (
              <p className="text-sm text-destructive mt-2">
                {errors.itemType.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter item name"
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
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  placeholder="e.g. 8901234567890"
                  {...register("barcode")}
                />
                {errors.barcode && (
                  <p className="text-sm text-destructive">
                    {errors.barcode.message}
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

              <div className="space-y-2">
                <Label htmlFor="uom">Unit of Measure *</Label>
                <Select
                  value={watch("uom") ?? "PCS"}
                  onChange={(e) =>
                    setValue("uom", e.target.value as CreateProductInput["uom"], {
                      shouldValidate: true,
                    })
                  }
                >
                  {UOM_OPTIONS.map((uom) => (
                    <option key={uom} value={uom}>
                      {uom}
                    </option>
                  ))}
                </Select>
                {errors.uom && (
                  <p className="text-sm text-destructive">
                    {errors.uom.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">
                  {isService ? "Rate (PKR) *" : "Base Price (PKR) *"}
                </Label>
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
                <Label htmlFor="compareAtPrice">Compare At Price (PKR)</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("compareAtPrice", { valueAsNumber: true })}
                />
                {errors.compareAtPrice && (
                  <p className="text-sm text-destructive">
                    {errors.compareAtPrice.message}
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

        {/* Inventory Settings — hidden for SERVICE */}
        {!isService && (
          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  id="isTrackInventory"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  {...register("isTrackInventory")}
                />
                <Label htmlFor="isTrackInventory">Track Inventory</Label>
              </div>

              {isTrackInventory && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reorderPoint">Reorder Point</Label>
                    <Input
                      id="reorderPoint"
                      type="number"
                      placeholder="0"
                      {...register("reorderPoint", { valueAsNumber: true })}
                    />
                    {errors.reorderPoint && (
                      <p className="text-sm text-destructive">
                        {errors.reorderPoint.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reorderQty">Reorder Quantity</Label>
                    <Input
                      id="reorderQty"
                      type="number"
                      placeholder="0"
                      {...register("reorderQty", { valueAsNumber: true })}
                    />
                    {errors.reorderQty && (
                      <p className="text-sm text-destructive">
                        {errors.reorderQty.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leadTimeDays">Lead Time (Days)</Label>
                    <Input
                      id="leadTimeDays"
                      type="number"
                      placeholder="0"
                      {...register("leadTimeDays", { valueAsNumber: true })}
                    />
                    {errors.leadTimeDays && (
                      <p className="text-sm text-destructive">
                        {errors.leadTimeDays.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Flags */}
        <Card>
          <CardHeader>
            <CardTitle>Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <input
                  id="isPurchasable"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  {...register("isPurchasable")}
                />
                <Label htmlFor="isPurchasable">Is Purchasable</Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isSellable"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  {...register("isSellable")}
                />
                <Label htmlFor="isSellable">Is Sellable</Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isFeatured"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  {...register("isFeatured")}
                />
                <Label htmlFor="isFeatured">Featured Item</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bundle info text */}
        {isBundle && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Info className="h-5 w-5 mt-0.5 shrink-0" />
                <p>
                  Add bundle components after creating the item. You will be able
                  to select products and set quantities on the item detail page.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shortDesc">Short Description</Label>
              <Textarea
                id="shortDesc"
                placeholder="Brief description (max 500 chars)"
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
                placeholder="Detailed description"
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

        {/* Settings */}
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
            Create Item
          </Button>
        </div>
      </form>
    </div>
  );
}
