"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  Badge,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@wise/ui";
import { api } from "@/lib/api";
import { Search, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EmployeeStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";

interface Employee {
  id: string;
  fullName: string;
  employeeId: string;
  department?: {
    id: string;
    name: string;
  };
  departmentName?: string;
  designation: string | null;
  joinDate: string;
  status: EmployeeStatus;
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  ON_LEAVE: "warning",
  TERMINATED: "destructive",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmployeesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data } = await api.get("/hr/employees?pageSize=50");
      return data;
    },
  });

  const allEmployees: Employee[] = data?.data ?? [];

  // Client-side search filter
  const employees = search.trim()
    ? allEmployees.filter((emp) => {
        const term = search.toLowerCase();
        const name = (emp.fullName ?? "").toLowerCase();
        const empId = (emp.employeeId ?? "").toLowerCase();
        const dept = (emp.department?.name ?? emp.departmentName ?? "").toLowerCase();
        const designation = (emp.designation ?? "").toLowerCase();
        return (
          name.includes(term) ||
          empId.includes(term) ||
          dept.includes(term) ||
          designation.includes(term)
        );
      })
    : allEmployees;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Employee directory and profiles</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Employees Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Join Date</TableHead>
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
              {!isLoading && employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search.trim() ? "No employees match your search" : "No employees found"}
                  </TableCell>
                </TableRow>
              )}
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{emp.employeeId}</TableCell>
                  <TableCell>{emp.department?.name ?? emp.departmentName ?? "-"}</TableCell>
                  <TableCell>{emp.designation ?? "-"}</TableCell>
                  <TableCell>{emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[emp.status ?? "ACTIVE"] ?? "secondary"}>
                      {(emp.status ?? "ACTIVE").replace(/_/g, " ")}
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
