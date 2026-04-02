"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@wise/ui";
import { api } from "@/lib/api";
import { UserCog, Clock, CalendarDays } from "lucide-react";
import Link from "next/link";

export default function HrPage() {
  const { data: empData } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => (await api.get("/hr/employees")).data,
  });

  const { data: leaveData } = useQuery({
    queryKey: ["leaves"],
    queryFn: async () => (await api.get("/hr/leave?status=PENDING")).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HR & Payroll</h1>
          <p className="text-muted-foreground">Employee management, attendance, leave, and payroll</p>
        </div>
        <Button>Run Payroll</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Employees</CardTitle>
            <UserCog className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{empData?.data?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending Leaves</CardTitle>
            <CalendarDays className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{leaveData?.data?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Quick Actions</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/hr/attendance">
              <Button variant="outline" size="sm" className="w-full">View Attendance</Button>
            </Link>
            <Link href="/hr/payroll">
              <Button variant="outline" size="sm" className="w-full">Payroll History</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {leaveData?.data?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Pending Leave Requests</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveData.data.map((l: { id: string; user?: { fullName: string }; leaveType: string; totalDays: number; startDate: string; endDate: string; status: string }) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.user?.fullName ?? "-"}</TableCell>
                    <TableCell>{l.leaveType}</TableCell>
                    <TableCell>{Number(l.totalDays)}</TableCell>
                    <TableCell>{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="warning">{l.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
