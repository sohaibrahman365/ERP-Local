"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@wise/ui";
import { api } from "@/lib/api";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const { data } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await api.get("/products?pageSize=50");
      return data;
    },
  });

  const products = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage inventory across all verticals</p>
        </div>
        <Link href="/products/new">
          <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: { id: string; name: string; sku: string; basePrice: number; status: string; category?: { name: string } }) => (
                <TableRow key={product.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/products/${product.id}`} className="hover:underline">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>PKR {Number(product.basePrice).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === "ACTIVE" ? "success" : "secondary"}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.category?.name ?? "-"}</TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No products yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
