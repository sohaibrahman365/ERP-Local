"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Label,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@wise/ui";
import { api } from "@/lib/api";
import { Users, UserX, Clock, CalendarOff, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "ON_LEAVE";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    fullName: string;
    employeeId?: string;
  };
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workingHours: number | null;
  overtimeHours: number | null;
  status: AttendanceStatus;
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  onLeave: number;
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PRESENT: "success",
  ABSENT: "destructive",
  LATE: "warning",
  HALF_DAY: "secondary",
  ON_LEAVE: "default",
};

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHours(hours: number | null): string {
  if (hours === null || hours === undefined) return "-";
  return `${Number(hours).toFixed(1)}h`;
}

function todayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AttendancePage() {
  const [date, setDate] = useState(todayString());

  const { data, isLoading } = useQuery({
    queryKey: ["attendance", date],
    queryFn: async () => {
      const { data } = await api.get(`/hr/attendance?pageSize=50&date=${date}`);
      return data;
    },
  });

  const records: AttendanceRecord[] = data?.data ?? [];

  // Compute summary from records
  const summary: AttendanceSummary = records.reduce(
    (acc: AttendanceSummary, r: AttendanceRecord) => {
      switch (r.status) {
        case "PRESENT":
          acc.present++;
          break;
        case "ABSENT":
          acc.absent++;
          break;
        case "LATE":
          acc.late++;
          break;
        case "ON_LEAVE":
        case "HALF_DAY":
          acc.onLeave++;
          break;
      }
      return acc;
    },
    { present: 0, absent: 0, late: 0, onLeave: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Daily attendance tracking and overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="attendance-date" className="text-sm whitespace-nowrap">
            Date
          </Label>
          <Input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Present</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.present}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Absent</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.absent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.late}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">On Leave</CardTitle>
            <CalendarOff className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.onLeave}</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Working Hours</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No attendance records for this date
                  </TableCell>
                </TableRow>
              )}
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.employee?.fullName ?? "-"}
                  </TableCell>
                  <TableCell>{formatTime(record.checkIn)}</TableCell>
                  <TableCell>{formatTime(record.checkOut)}</TableCell>
                  <TableCell>{formatHours(record.workingHours)}</TableCell>
                  <TableCell>{formatHours(record.overtimeHours)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[record.status] ?? "secondary"}>
                      {record.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
