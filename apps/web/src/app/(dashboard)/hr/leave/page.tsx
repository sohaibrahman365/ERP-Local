"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@wise/ui";
import { api } from "@/lib/api";
import { Check, X, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LeaveType = "ANNUAL" | "SICK" | "CASUAL" | "MATERNITY" | "PATERNITY" | "UNPAID";
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    fullName: string;
  };
  user?: {
    fullName: string;
  };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: LeaveStatus;
  createdAt: string;
}

interface LeaveBalance {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    fullName: string;
  };
  user?: {
    fullName: string;
  };
  leaveType: LeaveType;
  totalEntitled: number;
  used: number;
  remaining: number;
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

const LEAVE_TYPE_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  ANNUAL: "default",
  SICK: "destructive",
  CASUAL: "secondary",
  MATERNITY: "success",
  PATERNITY: "success",
  UNPAID: "outline",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LeavePage() {
  const [activeTab, setActiveTab] = useState("requests");
  const queryClient = useQueryClient();

  // Fetch leave requests
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      const { data } = await api.get("/hr/leave-requests?pageSize=50");
      return data;
    },
  });

  // Fetch leave balances
  const { data: balancesData, isLoading: balancesLoading } = useQuery({
    queryKey: ["leave-balances"],
    queryFn: async () => {
      const { data } = await api.get("/hr/leave-balances");
      return data;
    },
  });

  const requests: LeaveRequest[] = requestsData?.data ?? [];
  const balances: LeaveBalance[] = balancesData?.data ?? [];

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data } = await api.put(`/hr/leave-requests/${requestId}/approve`);
      return data;
    },
    onSuccess: () => {
      toast.success("Leave request approved");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to approve leave request";
      toast.error(message);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data } = await api.put(`/hr/leave-requests/${requestId}/reject`);
      return data;
    },
    onSuccess: () => {
      toast.success("Leave request rejected");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to reject leave request";
      toast.error(message);
    },
  });

  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <p className="text-muted-foreground">Review leave requests and view employee balances</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
        </TabsList>

        {/* ---- Requests Tab ---- */}
        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requestsLoading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!requestsLoading && requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No leave requests found
                      </TableCell>
                    </TableRow>
                  )}
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.employee?.fullName ?? request.user?.fullName ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={LEAVE_TYPE_COLORS[request.leaveType] ?? "secondary"}>
                          {request.leaveType}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>{Number(request.totalDays)}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={request.reason ?? ""}>
                        {request.reason ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[request.status] ?? "secondary"}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isMutating}
                              onClick={() => approveMutation.mutate(request.id)}
                            >
                              {approveMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isMutating}
                              onClick={() => rejectMutation.mutate(request.id)}
                            >
                              {rejectMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3 mr-1" />
                              )}
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Balances Tab ---- */}
        <TabsContent value="balances">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balancesLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!balancesLoading && balances.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No leave balances found
                      </TableCell>
                    </TableRow>
                  )}
                  {balances.map((balance) => (
                    <TableRow key={balance.id}>
                      <TableCell className="font-medium">
                        {balance.employee?.fullName ?? balance.user?.fullName ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={LEAVE_TYPE_COLORS[balance.leaveType] ?? "secondary"}>
                          {balance.leaveType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{Number(balance.totalEntitled)}</TableCell>
                      <TableCell className="text-right">{Number(balance.used)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(balance.remaining)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
