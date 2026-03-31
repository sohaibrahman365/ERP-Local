"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@wise/ui";
import { api } from "@/lib/api";
import { Plus } from "lucide-react";

export default function VehiclesPage() {
  const { data } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => (await api.get("/vehicles?pageSize=50")).data,
  });

  const vehicles = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WiseWheels</h1>
          <p className="text-muted-foreground">Vehicle listings and inspections</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Add Vehicle</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v: { id: string; make: string; model: string; year: number; price: number; status: string; city: string; mileageKm: number }) => (
          <Card key={v.id}>
            <CardHeader>
              <CardTitle className="text-lg">{v.year} {v.make} {v.model}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">PKR {Number(v.price).toLocaleString()}</p>
                <div className="flex gap-2">
                  <Badge variant="secondary">{v.city}</Badge>
                  <Badge variant={v.status === "ACTIVE" ? "success" : "secondary"}>{v.status}</Badge>
                </div>
                {v.mileageKm && <p className="text-sm text-muted-foreground">{v.mileageKm.toLocaleString()} km</p>}
              </div>
            </CardContent>
          </Card>
        ))}
        {vehicles.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">No vehicle listings yet</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
