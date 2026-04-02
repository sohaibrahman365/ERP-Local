"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
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
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

type UnitStatus = "AVAILABLE" | "RESERVED" | "BOOKED" | "SOLD" | "CANCELLED";

interface Unit {
  id: string;
  unitNumber: string;
  unitType: string;
  floorNumber: number;
  towerBlock?: string;
  carpetAreaSqft?: number;
  coveredAreaSqft?: number;
  facing?: string;
  totalPrice: number;
  status: UnitStatus;
  features?: string[];
  notes?: string;
}

interface InstallmentPlan {
  id: string;
  name: string;
  downPaymentPct: number;
  numInstallments: number;
  frequency: string;
  possessionPaymentPct: number;
  notes?: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  city?: string;
  totalTowers?: number;
  totalFloors?: number;
  totalUnits?: number;
  projectType: string;
  status: string;
  constructionPct: number;
  launchDate?: string;
  expectedCompletion?: string;
  amenities?: string[];
  units?: Unit[];
  installmentPlans?: InstallmentPlan[];
}

const STATUS_COLORS: Record<UnitStatus, string> = {
  AVAILABLE: "bg-green-500",
  RESERVED: "bg-yellow-500",
  BOOKED: "bg-blue-500",
  SOLD: "bg-red-500",
  CANCELLED: "bg-gray-400",
};

const STATUS_BADGE_VARIANT: Record<UnitStatus, "success" | "secondary" | "destructive" | "outline"> = {
  AVAILABLE: "success",
  RESERVED: "secondary",
  BOOKED: "secondary",
  SOLD: "destructive",
  CANCELLED: "outline",
};

const UNIT_TYPE_LABELS: Record<string, string> = {
  APT_1BED: "1-Bed Apartment",
  APT_2BED: "2-Bed Apartment",
  APT_3BED: "3-Bed Apartment",
  PENTHOUSE: "Penthouse",
  STUDIO: "Studio",
  SHOP_SMALL: "Shop (Small)",
  SHOP_MEDIUM: "Shop (Medium)",
  SHOP_LARGE: "Shop (Large)",
  SHOWROOM: "Showroom",
  OFFICE: "Office",
  PARKING: "Parking",
};

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  HALF_YEARLY: "Half-Yearly",
  YEARLY: "Yearly",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["re-project", projectId],
    queryFn: async () => {
      const { data } = await api.get(`/real-estate/projects/${projectId}`);
      return data;
    },
    enabled: !!projectId,
  });

  const project: Project | null = data?.data ?? null;

  const createBookingMutation = useMutation({
    mutationFn: async (unitId: string) => {
      const { data } = await api.post("/real-estate/bookings", {
        unitId,
        bookingDate: new Date().toISOString(),
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Unit booking initiated. Complete details in the bookings page.");
      setDialogOpen(false);
      setSelectedUnit(null);
      queryClient.invalidateQueries({ queryKey: ["re-project", projectId] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to initiate booking";
      toast.error(message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Link href="/real-estate">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const units = project.units ?? [];
  const installmentPlans = project.installmentPlans ?? [];

  // Group units by floor
  const unitsByFloor = units.reduce<Record<number, Unit[]>>((acc, unit) => {
    const floor = unit.floorNumber;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(unit);
    return acc;
  }, {});

  const floorNumbers = Object.keys(unitsByFloor)
    .map(Number)
    .sort((a, b) => b - a); // Top floor first

  // Stats
  const totalUnits = units.length;
  const availableUnits = units.filter((u) => u.status === "AVAILABLE").length;
  const bookedUnits = units.filter((u) => u.status === "BOOKED").length;
  const soldUnits = units.filter((u) => u.status === "SOLD").length;

  const handleUnitClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setDialogOpen(true);
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
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{project.projectType}</Badge>
                <Badge
                  variant={
                    project.status === "LAUNCHED" ||
                    project.status === "COMPLETED"
                      ? "success"
                      : "secondary"
                  }
                >
                  {project.status.replace(/_/g, " ")}
                </Badge>
                {project.city && (
                  <Badge variant="outline">{project.city}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <Link href="/real-estate/bookings">
          <Button variant="outline">View Bookings</Button>
        </Link>
      </div>

      {/* Construction Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Construction Progress</span>
            <span className="font-bold text-primary">
              {Number(project.constructionPct)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${Number(project.constructionPct)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            {project.launchDate && (
              <span>
                Launched:{" "}
                {new Date(project.launchDate).toLocaleDateString("en-PK")}
              </span>
            )}
            {project.expectedCompletion && (
              <span>
                Expected:{" "}
                {new Date(project.expectedCompletion).toLocaleDateString(
                  "en-PK"
                )}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Units</p>
            <p className="text-3xl font-bold">{totalUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-3xl font-bold text-green-600">
              {availableUnits}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Booked</p>
            <p className="text-3xl font-bold text-blue-600">{bookedUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Sold</p>
            <p className="text-3xl font-bold text-red-600">{soldUnits}</p>
          </CardContent>
        </Card>
      </div>

      {/* Unit Availability Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Unit Availability</CardTitle>
          <CardDescription>
            Click on a unit to view details or initiate a booking
          </CardDescription>
          <div className="flex flex-wrap gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-xs text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-xs text-muted-foreground">Reserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-xs text-muted-foreground">Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-xs text-muted-foreground">Sold</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-400" />
              <span className="text-xs text-muted-foreground">Cancelled</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {floorNumbers.length > 0 ? (
            <div className="space-y-3">
              {floorNumbers.map((floor) => (
                <div key={floor} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-20 text-right text-muted-foreground">
                    Floor {floor}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(unitsByFloor[floor] ?? [])
                      .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
                      .map((unit) => (
                        <button
                          key={unit.id}
                          onClick={() => handleUnitClick(unit)}
                          className={`w-14 h-10 rounded-md text-xs font-medium text-white flex items-center justify-center transition-opacity hover:opacity-80 ${
                            STATUS_COLORS[unit.status] ?? "bg-gray-400"
                          }`}
                          title={`${unit.unitNumber} - ${unit.status}`}
                        >
                          {unit.unitNumber}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No units have been added to this project yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Installment Plans */}
      {installmentPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Installment Plans</CardTitle>
            <CardDescription>
              Available payment plans for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Down Payment</TableHead>
                  <TableHead>Installments</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Possession Payment</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installmentPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.downPaymentPct}%</TableCell>
                    <TableCell>{plan.numInstallments}</TableCell>
                    <TableCell>
                      {FREQUENCY_LABELS[plan.frequency] ?? plan.frequency}
                    </TableCell>
                    <TableCell>{plan.possessionPaymentPct}%</TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.notes ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Description & Amenities */}
      {(project.description || (project.amenities && project.amenities.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>About the Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
            {project.amenities && project.amenities.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {project.amenities.map((amenity, idx) => (
                    <Badge key={idx} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unit Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          {selectedUnit && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Unit {selectedUnit.unitNumber}
                </DialogTitle>
                <DialogDescription>
                  {UNIT_TYPE_LABELS[selectedUnit.unitType] ??
                    selectedUnit.unitType}{" "}
                  - Floor {selectedUnit.floorNumber}
                  {selectedUnit.towerBlock
                    ? ` - Tower ${selectedUnit.towerBlock}`
                    : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      STATUS_BADGE_VARIANT[selectedUnit.status] ?? "secondary"
                    }
                  >
                    {selectedUnit.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-lg font-bold">
                    PKR {Number(selectedUnit.totalPrice).toLocaleString()}
                  </span>
                </div>
                {selectedUnit.carpetAreaSqft && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Carpet Area
                    </span>
                    <span>{selectedUnit.carpetAreaSqft} sq ft</span>
                  </div>
                )}
                {selectedUnit.coveredAreaSqft && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Covered Area
                    </span>
                    <span>{selectedUnit.coveredAreaSqft} sq ft</span>
                  </div>
                )}
                {selectedUnit.facing && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Facing
                    </span>
                    <span>{selectedUnit.facing}</span>
                  </div>
                )}
                {selectedUnit.features && selectedUnit.features.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">
                      Features
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedUnit.features.map((f, i) => (
                        <Badge key={i} variant="outline">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedUnit.notes && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">
                      Notes
                    </span>
                    <p className="text-sm">{selectedUnit.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Close
                </Button>
                {selectedUnit.status === "AVAILABLE" && (
                  <Button
                    onClick={() => createBookingMutation.mutate(selectedUnit.id)}
                    disabled={createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending
                      ? "Booking..."
                      : "Book Unit"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
