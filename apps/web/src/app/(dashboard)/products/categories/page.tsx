"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCategorySchema, type CreateCategoryInput } from "@wise/shared";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Label,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@wise/ui";
import { api } from "@/lib/api";
import { Plus, Tags, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  vertical: string;
  parentId: string | null;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
}

const VERTICAL_LABEL: Record<string, string> = {
  ECOMMERCE: "E-Commerce",
  AUTOMOTIVE: "Automotive",
  REALESTATE: "Real Estate",
};

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/products/categories?pageSize=100");
      return data;
    },
  });

  const categories: Category[] = data?.data ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      vertical: "ECOMMERCE",
      sortOrder: 0,
    },
  });

  const createCategory = useMutation({
    mutationFn: async (payload: CreateCategoryInput) => {
      const { data } = await api.post("/products/categories", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Category created");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDialogOpen(false);
      reset();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create category";
      toast.error(message);
    },
  });

  const onSubmit = (data: CreateCategoryInput) => {
    createCategory.mutate(data);
  };

  const selectedVertical = watch("vertical");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories across verticals
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Vertical</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tags className="h-4 w-4 text-muted-foreground" />
                      {cat.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {cat.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {VERTICAL_LABEL[cat.vertical] ?? cat.vertical}
                    </Badge>
                  </TableCell>
                  <TableCell>{cat.sortOrder}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(cat.createdAt).toLocaleDateString("en-PK")}
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Tags className="h-10 w-10 text-muted-foreground/50" />
                      <p className="text-sm font-medium">No categories yet</p>
                      <p className="text-xs">Add a category to get started</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new product category.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Mobile Phones"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug *</Label>
              <Input
                id="cat-slug"
                placeholder="e.g. mobile-phones"
                {...register("slug")}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-vertical">Vertical *</Label>
              <Select
                value={selectedVertical}
                onChange={(e) =>
                  setValue(
                    "vertical",
                    e.target.value as CreateCategoryInput["vertical"],
                    { shouldValidate: true }
                  )
                }
              >
                <option value="ECOMMERCE">E-Commerce</option>
                <option value="AUTOMOTIVE">Automotive</option>
                <option value="REALESTATE">Real Estate</option>
              </Select>
              {errors.vertical && (
                <p className="text-sm text-destructive">
                  {errors.vertical.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-parentId">Parent Category</Label>
              <Select
                value={watch("parentId") ?? ""}
                onChange={(e) =>
                  setValue(
                    "parentId",
                    e.target.value || undefined,
                    { shouldValidate: true }
                  )
                }
              >
                <option value="">None (Top Level)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-sortOrder">Sort Order</Label>
                <Input
                  id="cat-sortOrder"
                  type="number"
                  {...register("sortOrder", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-icon">Icon</Label>
                <Input
                  id="cat-icon"
                  placeholder="e.g. smartphone"
                  {...register("icon")}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCategory.isPending}>
                {createCategory.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
