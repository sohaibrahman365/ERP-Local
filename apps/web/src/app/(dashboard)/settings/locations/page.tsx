"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  Badge,
  Input,
  Label,
  Select,
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
import { Plus, Loader2, MapPin } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LocationType = "WAREHOUSE" | "OFFICE" | "STORE" | "FACTORY";

interface Location {
  id: string;
  name: string;
  type: LocationType;
  address: string | null;
  city: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
}

interface CreateLocationPayload {
  name: string;
  type: LocationType;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOCATION_TYPE_COLORS: Record<LocationType, "default" | "success" | "warning" | "secondary"> = {
  WAREHOUSE: "default",
  OFFICE: "success",
  STORE: "warning",
  FACTORY: "secondary",
};

const LOCATION_TYPES: LocationType[] = ["WAREHOUSE", "OFFICE", "STORE", "FACTORY"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType | "">("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Pakistan");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Query
  const { data: locData, isLoading } = useQuery({
    queryKey: ["admin-locations"],
    queryFn: async () => {
      const { data } = await api.get("/admin/locations");
      return data;
    },
  });

  const locations: Location[] = locData?.data ?? [];

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (payload: CreateLocationPayload) => {
      const { data } = await api.post("/admin/locations", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Location created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-locations"] });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create location";
      toast.error(message);
    },
  });

  const resetForm = () => {
    setName("");
    setType("");
    setAddress("");
    setCity("");
    setCountry("Pakistan");
    setLatitude("");
    setLongitude("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;
    createLocationMutation.mutate({
      name,
      type,
      address,
      city,
      country,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-muted-foreground">
            Manage warehouses, offices, stores, and factories
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Locations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && locations.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No locations found
                  </TableCell>
                </TableRow>
              )}
              {locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{loc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        LOCATION_TYPE_COLORS[loc.type] ?? "secondary"
                      }
                    >
                      {loc.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {loc.address ?? "-"}
                  </TableCell>
                  <TableCell>{loc.city ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={loc.isActive ? "success" : "secondary"}>
                      {loc.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Location Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
            <DialogDescription>
              Add a new warehouse, office, store, or factory location.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="locName">Location Name</Label>
                <Input
                  id="locName"
                  placeholder="e.g. Lahore Main Warehouse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locType">Type</Label>
                <Select
                  id="locType"
                  value={type}
                  onChange={(e) => setType(e.target.value as LocationType)}
                  required
                >
                  <option value="">Select type</option>
                  {LOCATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locAddress">Address</Label>
                <Input
                  id="locAddress"
                  placeholder="Street address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="locCity">City</Label>
                  <Input
                    id="locCity"
                    placeholder="e.g. Lahore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locCountry">Country</Label>
                  <Input
                    id="locCountry"
                    placeholder="e.g. Pakistan"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="locLat">Latitude</Label>
                  <Input
                    id="locLat"
                    type="number"
                    step="any"
                    placeholder="e.g. 31.5204"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locLng">Longitude</Label>
                  <Input
                    id="locLng"
                    type="number"
                    step="any"
                    placeholder="e.g. 74.3587"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLocationMutation.isPending}
              >
                {createLocationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Location"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
