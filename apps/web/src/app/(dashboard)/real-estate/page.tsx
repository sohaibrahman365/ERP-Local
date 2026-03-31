"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@wise/ui";
import { api } from "@/lib/api";
import { Plus, Building2 } from "lucide-react";

export default function RealEstatePage() {
  const { data: projectsData } = useQuery({
    queryKey: ["re-projects"],
    queryFn: async () => (await api.get("/real-estate/projects")).data,
  });

  const projects = projectsData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OZ Developers</h1>
          <p className="text-muted-foreground">Real estate projects, units, and bookings</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />New Project</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p: { id: string; name: string; status: string; projectType: string; constructionPct: number; totalUnits: number; _count?: { units: number } }) => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>{p.name}</CardTitle>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">{p.projectType}</Badge>
                  <Badge variant={p.status === "LAUNCHED" ? "success" : "secondary"}>{p.status.replace(/_/g, " ")}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Construction</span>
                  <span className="font-medium">{Number(p.constructionPct)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${Number(p.constructionPct)}%` }} />
                </div>
                <p className="text-sm text-muted-foreground">{p._count?.units ?? p.totalUnits ?? 0} units</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {projects.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">No projects yet</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
