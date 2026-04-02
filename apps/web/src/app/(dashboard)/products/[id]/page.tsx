"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProductSchema, type UpdateProductInput } from "@wise/shared";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@wise/ui";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, Package, ImageIcon, Plus, Trash2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type ItemType = "INVENTORY" | "SERVICE" | "RAW_MATERIAL" | "CONSUMABLE" | "BUNDLE";

const ITEM_TYPE_BADGE_VARIANT: Record<ItemType, "default" | "success" | "warning" | "secondary" | "outline"> = {
  INVENTORY: "default",
  SERVICE: "success",
  RAW_MATERIAL: "warning",
  CONSUMABLE: "secondary",
  BUNDLE: "outline",
};

const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  INVENTORY: "Inventory",
  SERVICE: "Service",
  RAW_MATERIAL: "Raw Material",
  CONSUMABLE: "Consumable",
  BUNDLE: "Bundle",
};

const UOM_OPTIONS = [
  "PCS", "KG", "GM", "LTR", "ML", "MTR", "CM",
  "SQM", "SQFT", "HR", "MIN", "SET", "BOX",
  "CARTON", "PAIR", "DOZEN", "UNIT",
] as const;

interface Category {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  sku: string;
  name: string | null;
  priceOverride: number | null;
  costOverride: number | null;
  attributes: Record<string, unknown> | null;
  barcode: string | null;
}

interface StockEntry {
  id: string;
  locationId: string;
  location?: { name: string };
  quantity: number;
  reservedQty: number;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

interface BundleComponent {
  id: string;
  componentId: string;
  quantity: number;
  sortOrder: number;
  component?: {
    id: string;
    name: string;
    sku: string;
  };
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  itemType: ItemType;
  uom: string;
  categoryId: string;
  category?: Category;
  brand: string | null;
  shortDesc: string | null;
  longDesc: string | null;
  basePrice: number;
  costPrice: number | null;
  compareAtPrice: number | null;
  taxRatePct: number;
  taxInclusive: boolean;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "OUT_OF_STOCK";
  isFeatured: boolean;
  isRefurbished: boolean;
  refurbishGrade: string | null;
  warrantyMonths: number;
  isTrackInventory: boolean;
  isPurchasable: boolean;
  isSellable: boolean;
  reorderPoint: number | null;
  reorderQty: number | null;
  leadTimeDays: number | null;
  variants?: Variant[];
  stock?: StockEntry[];
  images?: ProductImage[];
  bundleItems?: BundleComponent[];
  createdAt: string;
  updatedAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, "success" | "secondary" | "destructive" | "outline"> = {
    ACTIVE: "success",
    DRAFT: "secondary",
    ARCHIVED: "outline",
    OUT_OF_STOCK: "destructive",
  };
  return (
    <Badge variant={variantMap[status] ?? "secondary"}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function DetailsTab({
  product,
  categories,
}: {
  product: Product;
  categories: Category[];
}) {
  const queryClient = useQueryClient();
  const isService = product.itemType === "SERVICE";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProductInput>({
    resolver: zodResolver(updateProductSchema),
  });

  useEffect(() => {
    reset({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      brand: product.brand ?? undefined,
      uom: product.uom as UpdateProductInput["uom"],
      basePrice: Number(product.basePrice),
      costPrice: product.costPrice ? Number(product.costPrice) : undefined,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
      taxRatePct: Number(product.taxRatePct),
      shortDesc: product.shortDesc ?? undefined,
      longDesc: product.longDesc ?? undefined,
      status: product.status,
      isFeatured: product.isFeatured,
      isPurchasable: product.isPurchasable,
      isSellable: product.isSellable,
      isTrackInventory: product.isTrackInventory,
      reorderPoint: product.reorderPoint ?? undefined,
      reorderQty: product.reorderQty ?? undefined,
      leadTimeDays: product.leadTimeDays ?? undefined,
      warrantyMonths: product.warrantyMonths,
    });
  }, [product, reset]);

  const updateProduct = useMutation({
    mutationFn: async (payload: UpdateProductInput) => {
      const { data } = await api.patch(`/products/${product.id}`, payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Item updated successfully");
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update item";
      toast.error(message);
    },
  });

  const onSubmit = (data: UpdateProductInput) => {
    updateProduct.mutate(data);
  };

  const selectedStatus = watch("status");
  const isTrackInventory = watch("isTrackInventory");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item Type</Label>
              <div>
                <Badge variant={ITEM_TYPE_BADGE_VARIANT[product.itemType] ?? "secondary"}>
                  {ITEM_TYPE_LABEL[product.itemType] ?? product.itemType}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-uom">Unit of Measure</Label>
              <Select
                value={watch("uom") ?? product.uom}
                onChange={(e) =>
                  setValue("uom", e.target.value as UpdateProductInput["uom"], {
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
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
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
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
              <Label htmlFor="edit-categoryId">Category</Label>
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
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                placeholder="e.g. Samsung"
                {...register("brand")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-basePrice">
                {isService ? "Rate (PKR)" : "Base Price (PKR)"}
              </Label>
              <Input
                id="edit-basePrice"
                type="number"
                step="0.01"
                {...register("basePrice", { valueAsNumber: true })}
              />
              {errors.basePrice && (
                <p className="text-sm text-destructive">
                  {errors.basePrice.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-costPrice">Cost Price (PKR)</Label>
              <Input
                id="edit-costPrice"
                type="number"
                step="0.01"
                {...register("costPrice", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-compareAtPrice">Compare At Price (PKR)</Label>
              <Input
                id="edit-compareAtPrice"
                type="number"
                step="0.01"
                {...register("compareAtPrice", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-taxRatePct">Tax Rate (%)</Label>
              <Input
                id="edit-taxRatePct"
                type="number"
                step="0.01"
                {...register("taxRatePct", { valueAsNumber: true })}
              />
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
                id="edit-isTrackInventory"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...register("isTrackInventory")}
              />
              <Label htmlFor="edit-isTrackInventory">Track Inventory</Label>
            </div>

            {isTrackInventory && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-reorderPoint">Reorder Point</Label>
                  <Input
                    id="edit-reorderPoint"
                    type="number"
                    placeholder="0"
                    {...register("reorderPoint", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-reorderQty">Reorder Quantity</Label>
                  <Input
                    id="edit-reorderQty"
                    type="number"
                    placeholder="0"
                    {...register("reorderQty", { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-leadTimeDays">Lead Time (Days)</Label>
                  <Input
                    id="edit-leadTimeDays"
                    type="number"
                    placeholder="0"
                    {...register("leadTimeDays", { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-shortDesc">Short Description</Label>
            <Textarea
              id="edit-shortDesc"
              placeholder="Brief description"
              rows={2}
              {...register("shortDesc")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-longDesc">Long Description</Label>
            <Textarea
              id="edit-longDesc"
              placeholder="Detailed description"
              rows={5}
              {...register("longDesc")}
            />
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
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={selectedStatus ?? "DRAFT"}
                onChange={(e) =>
                  setValue(
                    "status",
                    e.target.value as UpdateProductInput["status"],
                    { shouldValidate: true }
                  )
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-warrantyMonths">Warranty (Months)</Label>
              <Input
                id="edit-warrantyMonths"
                type="number"
                {...register("warrantyMonths", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <input
                id="edit-isPurchasable"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...register("isPurchasable")}
              />
              <Label htmlFor="edit-isPurchasable">Is Purchasable</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="edit-isSellable"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...register("isSellable")}
              />
              <Label htmlFor="edit-isSellable">Is Sellable</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="edit-isFeatured"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...register("isFeatured")}
              />
              <Label htmlFor="edit-isFeatured">Featured Item</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4">
        <Button type="submit" disabled={updateProduct.isPending || !isDirty}>
          {updateProduct.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}

function VariantsTab({ product }: { product: Product }) {
  const variants = product.variants ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variants</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price Override</TableHead>
              <TableHead>Cost Override</TableHead>
              <TableHead>Barcode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell className="font-mono text-sm">
                  {variant.sku}
                </TableCell>
                <TableCell>{variant.name ?? "-"}</TableCell>
                <TableCell>
                  {variant.priceOverride != null
                    ? `PKR ${Number(variant.priceOverride).toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell>
                  {variant.costOverride != null
                    ? `PKR ${Number(variant.costOverride).toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell>{variant.barcode ?? "-"}</TableCell>
              </TableRow>
            ))}
            {variants.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No variants configured
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function StockTab({ product }: { product: Product }) {
  const stockEntries = product.stock ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock by Location</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">Reserved</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  {entry.location?.name ?? entry.locationId}
                </TableCell>
                <TableCell className="text-right">
                  {entry.quantity - entry.reservedQty}
                </TableCell>
                <TableCell className="text-right">
                  {entry.reservedQty}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {entry.quantity}
                </TableCell>
              </TableRow>
            ))}
            {stockEntries.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                    <span>No stock entries found</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ImagesTab({ product }: { product: Product }) {
  const images = product.images ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Images</CardTitle>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-3 text-muted-foreground/50" />
            <p>No images uploaded</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
              >
                <img
                  src={image.url}
                  alt={image.alt ?? product.name}
                  className="h-full w-full object-cover"
                />
                {image.isPrimary && (
                  <Badge className="absolute top-2 left-2" variant="default">
                    Primary
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BundleComponentsTab({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComponentId, setSelectedComponentId] = useState("");
  const [componentQty, setComponentQty] = useState(1);

  const bundleItems: BundleComponent[] = product.bundleItems ?? [];

  // Search products for the add-component dialog
  const { data: searchData } = useQuery({
    queryKey: ["products-search", searchQuery],
    queryFn: async () => {
      const { data } = await api.get(
        `/products?pageSize=20&search=${encodeURIComponent(searchQuery)}`
      );
      return data;
    },
    enabled: dialogOpen && searchQuery.length >= 2,
  });

  const searchResults: { id: string; name: string; sku: string }[] = (
    searchData?.data ?? []
  ).filter(
    (p: { id: string }) =>
      p.id !== product.id &&
      !bundleItems.some((bi) => bi.componentId === p.id)
  );

  const addComponent = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/products/${product.id}/bundle-items`, {
        items: [{ componentId: selectedComponentId, quantity: componentQty }],
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Component added");
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
      setDialogOpen(false);
      setSearchQuery("");
      setSelectedComponentId("");
      setComponentQty(1);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to add component";
      toast.error(message);
    },
  });

  const removeComponent = useMutation({
    mutationFn: async (componentItemId: string) => {
      await api.delete(`/products/${product.id}/bundle-items/${componentItemId}`);
    },
    onSuccess: () => {
      toast.success("Component removed");
      queryClient.invalidateQueries({ queryKey: ["product", product.id] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to remove component";
      toast.error(message);
    },
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bundle Components</CardTitle>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Component
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundleItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.component?.name ?? "-"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.component?.sku ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeComponent.mutate(item.id)}
                      disabled={removeComponent.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {bundleItems.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                      <span>No components added yet</span>
                      <span className="text-xs">
                        Click "Add Component" to build this bundle
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Component Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bundle Component</DialogTitle>
            <DialogDescription>
              Search for a product to add as a component of this bundle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedComponentId("");
                }}
                className="pl-9"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedComponentId(p.id)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors ${
                      selectedComponentId === p.id ? "bg-primary/10 text-primary" : ""
                    }`}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {p.sku}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No matching products found
              </p>
            )}

            {selectedComponentId && (
              <div className="space-y-2">
                <Label htmlFor="component-qty">Quantity</Label>
                <Input
                  id="component-qty"
                  type="number"
                  min={1}
                  step={1}
                  value={componentQty}
                  onChange={(e) => setComponentQty(Number(e.target.value) || 1)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setSearchQuery("");
                setSelectedComponentId("");
                setComponentQty(1);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => addComponent.mutate()}
              disabled={!selectedComponentId || addComponent.isPending}
            >
              {addComponent.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Add Component
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params.id;
  const [activeTab, setActiveTab] = useState("details");

  const { data: productData, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data } = await api.get(`/products/${productId}`);
      return data;
    },
    enabled: !!productId,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/products/categories?pageSize=100");
      return data;
    },
  });

  const product: Product | undefined = productData?.data;
  const categories: Category[] = categoriesData?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Item Not Found</h1>
            <p className="text-muted-foreground">
              The requested item does not exist or has been deleted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isBundle = product.itemType === "BUNDLE";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <Badge variant={ITEM_TYPE_BADGE_VARIANT[product.itemType] ?? "secondary"}>
                {ITEM_TYPE_LABEL[product.itemType] ?? product.itemType}
              </Badge>
              <StatusBadge status={product.status} />
            </div>
            <p className="text-muted-foreground">
              SKU: {product.sku}
              {product.uom ? ` | UOM: ${product.uom}` : ""}
              {product.brand ? ` | Brand: ${product.brand}` : ""}
            </p>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>
            Created: {new Date(product.createdAt).toLocaleDateString("en-PK")}
          </p>
          <p>
            Updated: {new Date(product.updatedAt).toLocaleDateString("en-PK")}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          {isBundle && (
            <TabsTrigger value="bundle">Bundle Components</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <DetailsTab product={product} categories={categories} />
        </TabsContent>

        <TabsContent value="variants" className="mt-6">
          <VariantsTab product={product} />
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <StockTab product={product} />
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <ImagesTab product={product} />
        </TabsContent>

        {isBundle && (
          <TabsContent value="bundle" className="mt-6">
            <BundleComponentsTab product={product} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
