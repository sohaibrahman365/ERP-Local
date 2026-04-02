"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Label,
  Select,
} from "@wise/ui";
import { api } from "@/lib/api";
import { Plus, Search, X } from "lucide-react";
import Link from "next/link";

interface VehicleFilters {
  make: string;
  city: string;
  bodyType: string;
  fuelType: string;
  status: string;
  priceMin: string;
  priceMax: string;
}

const INITIAL_FILTERS: VehicleFilters = {
  make: "",
  city: "",
  bodyType: "",
  fuelType: "",
  status: "",
  priceMin: "",
  priceMax: "",
};

interface Vehicle {
  id: string;
  make: string;
  model: string;
  variantName?: string;
  year: number;
  price: number;
  status: string;
  city: string;
  mileageKm?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  condition?: string;
  listingType?: string;
}

export default function VehiclesPage() {
  const [filters, setFilters] = useState<VehicleFilters>(INITIAL_FILTERS);

  const buildQueryString = useCallback((f: VehicleFilters) => {
    const params = new URLSearchParams({ pageSize: "50" });
    if (f.make) params.set("make", f.make);
    if (f.city) params.set("city", f.city);
    if (f.bodyType) params.set("bodyType", f.bodyType);
    if (f.fuelType) params.set("fuelType", f.fuelType);
    if (f.status) params.set("status", f.status);
    if (f.priceMin) params.set("priceMin", f.priceMin);
    if (f.priceMax) params.set("priceMax", f.priceMax);
    return params.toString();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["vehicles", filters],
    queryFn: async () => {
      const qs = buildQueryString(filters);
      const { data } = await api.get(`/vehicles?${qs}`);
      return data;
    },
  });

  const vehicles: Vehicle[] = data?.data ?? [];

  const updateFilter = (key: keyof VehicleFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WiseWheels</h1>
          <p className="text-muted-foreground">
            Vehicle listings and inspections
          </p>
        </div>
        <Link href="/vehicles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search & Filter
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="filter-make" className="text-xs">
                Make
              </Label>
              <Input
                id="filter-make"
                placeholder="e.g. Toyota"
                value={filters.make}
                onChange={(e) => updateFilter("make", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-city" className="text-xs">
                City
              </Label>
              <Input
                id="filter-city"
                placeholder="e.g. Lahore"
                value={filters.city}
                onChange={(e) => updateFilter("city", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-bodyType" className="text-xs">
                Body Type
              </Label>
              <Select
                value={filters.bodyType}
                onChange={(e) =>
                  updateFilter("bodyType", e.target.value)
                }
              >
                <option value="">All Body Types</option>
                <option value="SEDAN">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="HATCHBACK">Hatchback</option>
                <option value="CROSSOVER">Crossover</option>
                <option value="TRUCK">Truck</option>
                <option value="VAN">Van</option>
                <option value="COUPE">Coupe</option>
                <option value="WAGON">Wagon</option>
                <option value="BUS">Bus</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-fuelType" className="text-xs">
                Fuel Type
              </Label>
              <Select
                value={filters.fuelType}
                onChange={(e) =>
                  updateFilter("fuelType", e.target.value)
                }
              >
                <option value="">All Fuel Types</option>
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ELECTRIC">Electric</option>
                <option value="CNG">CNG</option>
                <option value="LPG">LPG</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-status" className="text-xs">
                Status
              </Label>
              <Select
                value={filters.status}
                onChange={(e) =>
                  updateFilter("status", e.target.value)
                }
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SOLD">Sold</option>
                <option value="EXPIRED">Expired</option>
                <option value="DRAFT">Draft</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-priceMin" className="text-xs">
                Min Price (PKR)
              </Label>
              <Input
                id="filter-priceMin"
                type="number"
                placeholder="0"
                value={filters.priceMin}
                onChange={(e) => updateFilter("priceMin", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="filter-priceMax" className="text-xs">
                Max Price (PKR)
              </Label>
              <Input
                id="filter-priceMax"
                type="number"
                placeholder="No limit"
                value={filters.priceMax}
                onChange={(e) => updateFilter("priceMax", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v) => (
          <Card key={v.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {v.year} {v.make} {v.model}
                {v.variantName ? ` ${v.variantName}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">
                  PKR {Number(v.price).toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{v.city}</Badge>
                  <Badge
                    variant={v.status === "ACTIVE" ? "success" : "secondary"}
                  >
                    {v.status}
                  </Badge>
                  {v.fuelType && (
                    <Badge variant="outline">{v.fuelType}</Badge>
                  )}
                  {v.transmission && (
                    <Badge variant="outline">{v.transmission}</Badge>
                  )}
                </div>
                {v.mileageKm != null && (
                  <p className="text-sm text-muted-foreground">
                    {v.mileageKm.toLocaleString()} km
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && vehicles.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              {hasActiveFilters
                ? "No vehicles match your filters"
                : "No vehicle listings yet"}
            </CardContent>
          </Card>
        )}
        {isLoading && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading vehicles...
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
