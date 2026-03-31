import { Router, Request, Response, NextFunction } from "express";
import { checkInSchema, checkOutSchema, createLeaveRequestSchema, approveLeaveSchema, createPayrollRunSchema, updateEmployeeProfileSchema, paginationSchema } from "@wise/shared";
import { calculateIncomeTax, isWithinGeofence } from "@wise/shared";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPaginated, sendError } from "../lib/response";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";

export const hrRouter = Router();

// Attendance
hrRouter.post("/attendance/check-in", authenticate, validate(checkInSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, locationId, notes } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let withinGeofence = true;
    if (locationId) {
      const location = await prisma.location.findUnique({ where: { id: locationId } });
      if (location?.latitude && location?.longitude) {
        withinGeofence = isWithinGeofence(
          latitude, longitude,
          Number(location.latitude), Number(location.longitude),
          location.geoFenceRadiusM
        );
      }
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        tenantId: req.user!.tenantId,
        userId: req.user!.userId,
        date: today,
        checkInTime: new Date(),
        checkInLat: latitude,
        checkInLng: longitude,
        checkInLocationId: locationId,
        isWithinGeofence: withinGeofence,
        status: "PRESENT",
        notes,
      },
    });

    sendSuccess(res, record, 201);
  } catch (err) { next(err); }
});

hrRouter.post("/attendance/check-out", authenticate, validate(checkOutSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude, notes } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await prisma.attendanceRecord.findFirst({
      where: { userId: req.user!.userId, tenantId: req.user!.tenantId, date: today },
    });

    if (!record) {
      sendError(res, "No check-in found for today", 400);
      return;
    }

    const checkOutTime = new Date();
    const workingHours = record.checkInTime
      ? (checkOutTime.getTime() - record.checkInTime.getTime()) / (1000 * 60 * 60)
      : 0;
    const overtimeHours = Math.max(0, workingHours - 8);

    const updated = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOutTime,
        checkOutLat: latitude,
        checkOutLng: longitude,
        workingHours: Math.round(workingHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        notes: notes ?? record.notes,
      },
    });

    sendSuccess(res, updated);
  } catch (err) { next(err); }
});

hrRouter.get("/attendance", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize } = paginationSchema.parse(req.query);
    const where: Record<string, unknown> = { tenantId: req.user!.tenantId };
    if (req.query.userId) where.userId = req.query.userId;

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.attendanceRecord.count({ where }),
    ]);

    sendPaginated(res, records, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

// Leave Management
hrRouter.post("/leave/request", authenticate, validate(createLeaveRequestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leave = await prisma.leaveRequest.create({
      data: {
        tenantId: req.user!.tenantId,
        userId: req.user!.userId,
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      },
    });
    sendSuccess(res, leave, 201);
  } catch (err) { next(err); }
});

hrRouter.patch("/leave/:id/approve", authenticate, requirePermission("hr:approve:all"), validate(approveLeaveSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, rejectionReason } = req.body;

    const leave = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        approvedBy: req.user!.userId,
        approvedAt: new Date(),
        rejectionReason,
      },
    });

    // Update leave balance if approved
    if (status === "APPROVED") {
      const leaveReq = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
      if (leaveReq) {
        const fiscalYear = leaveReq.startDate.getMonth() >= 6
          ? leaveReq.startDate.getFullYear()
          : leaveReq.startDate.getFullYear() - 1;

        await prisma.leaveBalance.upsert({
          where: {
            tenantId_userId_fiscalYear_leaveType: {
              tenantId: req.user!.tenantId,
              userId: leaveReq.userId,
              fiscalYear,
              leaveType: leaveReq.leaveType,
            },
          },
          update: { used: { increment: Number(leaveReq.totalDays) } },
          create: {
            tenantId: req.user!.tenantId,
            userId: leaveReq.userId,
            fiscalYear,
            leaveType: leaveReq.leaveType,
            entitled: 20,
            used: Number(leaveReq.totalDays),
          },
        });
      }
    }

    sendSuccess(res, leave);
  } catch (err) { next(err); }
});

hrRouter.get("/leave", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where: Record<string, unknown> = { tenantId: req.user!.tenantId };
    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.status) where.status = req.query.status;

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    sendSuccess(res, leaves);
  } catch (err) { next(err); }
});

// Employee profiles
hrRouter.get("/employees", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employees = await prisma.employeeProfile.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { user: { select: { fullName: true, email: true, phone: true, designation: true, department: true } } },
    });
    sendSuccess(res, employees);
  } catch (err) { next(err); }
});

hrRouter.patch("/employees/:userId", authenticate, requirePermission("hr:write:all"), validate(updateEmployeeProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.employeeProfile.upsert({
      where: { userId: req.params.userId },
      update: req.body,
      create: { tenantId: req.user!.tenantId, userId: req.params.userId, ...req.body },
    });
    sendSuccess(res, profile);
  } catch (err) { next(err); }
});

// Payroll
hrRouter.post("/payroll/run", authenticate, requirePermission("hr:write:all"), validate(createPayrollRunSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month, year } = req.body;

    const employees = await prisma.employeeProfile.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { user: true },
    });

    const payrollRun = await prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          tenantId: req.user!.tenantId,
          month,
          year,
          totalEmployees: employees.length,
          processedBy: req.user!.userId,
        },
      });

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      for (const emp of employees) {
        const basic = Number(emp.basicSalary ?? 0);
        const hra = Number(emp.hra ?? 0);
        const medical = Number(emp.medicalAllow ?? 0);
        const conveyance = Number(emp.conveyanceAllow ?? 0);
        const grossSalary = basic + hra + medical + conveyance;

        const annualSalary = grossSalary * 12;
        const monthlyTax = calculateIncomeTax(annualSalary) / 12;
        const eobiEmployee = Math.min(basic * 0.01, 250);
        const totalDed = monthlyTax + eobiEmployee;
        const netSalary = grossSalary - totalDed;

        totalGross += grossSalary;
        totalDeductions += totalDed;
        totalNet += netSalary;

        await tx.payrollSlip.create({
          data: {
            payrollRunId: run.id,
            tenantId: req.user!.tenantId,
            userId: emp.userId,
            basicSalary: basic,
            hra,
            medical,
            conveyance,
            grossSalary,
            incomeTax: monthlyTax,
            eobiEmployee,
            totalDeductions: totalDed,
            netSalary,
          },
        });
      }

      return tx.payrollRun.update({
        where: { id: run.id },
        data: { totalGross, totalDeductions, totalNet },
        include: { slips: true },
      });
    });

    sendSuccess(res, payrollRun, 201);
  } catch (err) { next(err); }
});

hrRouter.get("/payroll", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const runs = await prisma.payrollRun.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { _count: { select: { slips: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    sendSuccess(res, runs);
  } catch (err) { next(err); }
});

hrRouter.get("/payroll/:id/slips", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slips = await prisma.payrollSlip.findMany({
      where: { payrollRunId: req.params.id, tenantId: req.user!.tenantId },
      include: { user: { select: { fullName: true, email: true } } },
    });
    sendSuccess(res, slips);
  } catch (err) { next(err); }
});
