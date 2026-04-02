"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
} from "@wise/ui";
import { api } from "@/lib/api";
import { ArrowLeft, Building2, Loader2, MapPin, TrendingUp } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UnitStatus = "AVAILABLE" | "BOOKED" | "SOLD" | "RESERVED";

interface Unit {
  id: string;
  unitNumber: string;
  unitType: string;
  floorNumber: number;
  carpetAreaSqft: number | null;
  coveredAreaSqft: number | null;
  totalPrice: number;
  status: UnitStatus;
}

interface Booking {
  id: string;
  customer: { fullName: string } | null;
  unit: { unitNumber: string } | null;
  bookingDate: string;
  installmentPlan: { name: string } | null;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  totalUnits: number | null;
  projectType: string;
  status: string;
  constructionPct: number;
  launchDate: string | null;
  expectedCompletion: string | null;
  units: Unit[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UNIT_STATUS_BADGE: Record<UnitStatus, "success" | "default" | "destructive" | "warning"> = {
  AVAILABLE: "success",
  BOOKED: "default",
  SOLD: "destructive",
  RESERVED: "warning",
};

const BOOKING_STATUS_BADGE: Record<string, "success" | "default" | "destructive" | "warning" | "secondary"> = {
  ACTIVE: "success",
  CONFIRMED: "success",
  PENDING: "warning",
  CANCELLED: "destructive",
  COMPLETED: "default",
};

const UNIT_TYPE_LABELS: Record<string, string> = {
  APT_1BED: "1-Bed Apartment",
  APT_2BED: "2-Bed Apartment",
  APT_3BED: "3-Bed Apartment",
  PENTHOUSE: "Penthouse",
  STUDIO: "Studio",
  SHOP_SMALL: "Shop (S)",
  SHOP_MEDIUM: "Shop (M)",
  SHOP_LARGE: "Shop (L)",
  SHOWROOM: "Showroom",
  OFFICE: "Office",
  PARKING: "Parking",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [activeTab, setActiveTab] = useState("units");

  // Fetch project with units
  const {
    data: projectData,
    isLoading: projectLoading,
    isError: projectError,
  } = useQuery<Project>({
    queryKey: ["re-project-detail", projectId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Project }>(
        `/real-estate/projects/${projectId}`
      );
      return data.data;
    },
    enabled: !!projectId,
  });

  // Fetch bookings for this project
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["re-project-bookings", projectId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Booking[] }>(
        `/real-estate/bookings?projectId=${projectId}`
      );
      return data.data;
    },
    enabled: !!projectId,
  });

  // Loading
  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error
  if (projectError || !projectData) {
    return (
      <div className="space-y-4">
        <Link
          href="/real-estate"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Project not found or an error occurred.
          </CardContent>
        </Card>
      </div>
    );
  }

  const project = projectData;
  const units = project.units ?? [];
  const bookings = bookingsData ?? [];

  // Unit stats
  const totalUnits = units.length;
  const soldUnits = units.filter((u) => u.status === "SOLD").length;
  const bookedUnits = units.filter((u) => u.status === "BOOKED").length;
  const availableUnits = units.filter((u) => u.status === "AVAILABLE").length;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/real-estate"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Projects
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">
              {project.city ?? "Location not set"}
              {project.address ? ` - ${project.address}` : ""}
            </p>
          </div>
        </div>
        <Badge
          variant={
            project.status === "COMPLETED" || project.status === "LAUNCHED"
              ? "success"
              : "secondary"
          }
          className="w-fit"
        >
          {project.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Location</p>
            </div>
            <p className="text-lg font-bold">{project.city ?? "-"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Units</p>
            <p className="text-2xl font-bold">{totalUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Sold</p>
            <p className="text-2xl font-bold text-red-600">{soldUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-green-600">{availableUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Progress</p>
            </div>
            <p className="text-2xl font-bold">
              {Number(project.constructionPct)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="units">Units ({totalUnits})</TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings ({bookings.length})
          </TabsTrigger>
        </TabsList>

        {/* ==================== UNITS TAB ==================== */}
        <TabsContent value="units">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Project Units</CardTitle>
              <CardDescription>
                All units in {project.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Area (sq ft)</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No units added to this project yet
                      </TableCell>
                    </TableRow>
                  )}
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">
                        {unit.unitNumber}
                      </TableCell>
                      <TableCell>
                        {UNIT_TYPE_LABELS[unit.unitType] ?? unit.unitType}
                      </TableCell>
                      <TableCell>{unit.floorNumber}</TableCell>
                      <TableCell>
                        {unit.coveredAreaSqft ?? unit.carpetAreaSqft ?? "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        PKR {Number(unit.totalPrice).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            UNIT_STATUS_BADGE[unit.status] ?? "secondary"
                          }
                        >
                          {unit.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== BOOKINGS TAB ==================== */}
        <TabsContent value="bookings">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Project Bookings</CardTitle>
              <CardDescription>
                Bookings for units in {project.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {bookingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Booking Date</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No bookings for this project yet
                        </TableCell>
                      </TableRow>
                    )}
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.customer?.fullName ?? "-"}
                        </TableCell>
                        <TableCell>
                          {booking.unit?.unitNumber ?? "-"}
                        </TableCell>
                        <TableCell>
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {booking.installmentPlan?.name ?? "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          PKR {Number(booking.totalAmount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          PKR {Number(booking.paidAmount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              BOOKING_STATUS_BADGE[booking.status] ?? "secondary"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
