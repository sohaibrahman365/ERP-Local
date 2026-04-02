"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@wise/ui";
import { api } from "@/lib/api";
import { Plus, Search, Package } from "lucide-react";
import Link from "next/link";

type ItemType = "INVENTORY" | "SERVICE" | "RAW_MATERIAL" | "CONSUMABLE" | "BUNDLE";
type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "OUT_OF_STOCK";

const ITEM_TYPE_TABS: { label: string; value: ItemType | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Inventory", value: "INVENTORY" },
  { label: "Service", value: "SERVICE" },
  { label: "Raw Material", value: "RAW_MATERIAL" },
  { label: "Consumable", value: "CONSUMABLE" },
  { label: "Bundle", value: "BUNDLE" },
];

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

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  itemType: ItemType;
  uom: string;
  basePrice: number;
  costPrice: number | null;
  status: ProductStatus;
  category?: { name: string };
}

export default function ProductsPage() {
  const [itemTypeFilter, setItemTypeFilter] = useState<ItemType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const queryParams = new URLSearchParams({ pageSize: "50" });
  if (itemTypeFilter !== "ALL") queryParams.set("itemType", itemTypeFilter);
  if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
  if (search.trim()) queryParams.set("search", search.trim());

  const { data, isLoading } = useQuery({
    queryKey: ["products", itemTypeFilter, statusFilter, search],
    queryFn: async () => {
      const { data } = await api.get(`/products?${queryParams.toString()}`);
      return data;
    },
  });

  const products: ProductRow[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Item Master</h1>
          <p className="text-muted-foreground">
            Manage products, services, and materials across all verticals
          </p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="space-y-4">
        {/* Item Type Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {ITEM_TYPE_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={itemTypeFilter === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => setItemTypeFilter(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Search + Status */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProductStatus | "ALL")}
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Item Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead className="text-right">Base Price (PKR)</TableHead>
                <TableHead className="text-right">Cost Price (PKR)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="cursor-pointer">
                  <TableCell className="font-mono text-sm">
                    {product.sku}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/products/${product.id}`}
                      className="hover:underline"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ITEM_TYPE_BADGE_VARIANT[product.itemType] ?? "secondary"}>
                      {ITEM_TYPE_LABEL[product.itemType] ?? product.itemType}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.category?.name ?? "-"}</TableCell>
                  <TableCell>{product.uom ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {Number(product.basePrice).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.costPrice != null
                      ? Number(product.costPrice).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "ACTIVE"
                          ? "success"
                          : product.status === "OUT_OF_STOCK"
                          ? "destructive"
                          : product.status === "ARCHIVED"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {product.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-10 w-10 text-muted-foreground/50" />
                      <p className="text-sm font-medium">No items found</p>
                      <p className="text-xs">
                        {search || itemTypeFilter !== "ALL" || statusFilter !== "ALL"
                          ? "Try adjusting your filters or search query"
                          : "Get started by adding your first item"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
