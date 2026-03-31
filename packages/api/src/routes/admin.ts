import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPaginated } from "../lib/response";
import { authenticate, requirePermission } from "../middleware/auth";
import { paginationSchema } from "@wise/shared";

export const adminRouter = Router();

// Users management
adminRouter.get("/users", authenticate, requirePermission("admin:read:all"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, search } = paginationSchema.parse(req.query);
    const where: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: true, department: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    sendPaginated(res, users, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

// Departments
adminRouter.get("/departments", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { _count: { select: { users: true } } },
    });
    sendSuccess(res, departments);
  } catch (err) { next(err); }
});

adminRouter.post("/departments", authenticate, requirePermission("admin:write:all"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dept = await prisma.department.create({
      data: { tenantId: req.user!.tenantId, ...req.body },
    });
    sendSuccess(res, dept, 201);
  } catch (err) { next(err); }
});

// Locations
adminRouter.get("/locations", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locations = await prisma.location.findMany({
      where: { tenantId: req.user!.tenantId },
    });
    sendSuccess(res, locations);
  } catch (err) { next(err); }
});

adminRouter.post("/locations", authenticate, requirePermission("admin:write:all"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = await prisma.location.create({
      data: { tenantId: req.user!.tenantId, ...req.body },
    });
    sendSuccess(res, location, 201);
  } catch (err) { next(err); }
});

// Tenant settings
adminRouter.get("/tenant", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user!.tenantId },
    });
    sendSuccess(res, tenant);
  } catch (err) { next(err); }
});

adminRouter.patch("/tenant", authenticate, requirePermission("admin:write:all"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.user!.tenantId },
      data: req.body,
    });
    sendSuccess(res, tenant);
  } catch (err) { next(err); }
});

// Audit logs
adminRouter.get("/audit-logs", authenticate, requirePermission("admin:read:all"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize } = paginationSchema.parse(req.query);
    const where = { tenantId: req.user!.tenantId };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    sendPaginated(res, logs, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});
