import { Router, Request, Response, NextFunction } from "express";
import { createVehicleSchema, updateVehicleSchema, createInspectionSchema, completeInspectionSchema, paginationSchema } from "@wise/shared";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPaginated, sendError } from "../lib/response";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";

export const vehicleRouter = Router();

vehicleRouter.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, sortBy, sortOrder, search } = paginationSchema.parse(req.query);
    const where: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };

    if (search) {
      where.OR = [
        { make: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
      ];
    }

    if (req.query.make) where.make = req.query.make;
    if (req.query.city) where.city = req.query.city;
    if (req.query.bodyType) where.bodyType = req.query.bodyType;
    if (req.query.fuelType) where.fuelType = req.query.fuelType;
    if (req.query.status) where.status = req.query.status;

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vehicle.count({ where }),
    ]);

    sendPaginated(res, vehicles, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

vehicleRouter.get("/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { images: { orderBy: { sortOrder: "asc" } }, inspections: true },
    });
    if (!vehicle) { sendError(res, "Vehicle not found", 404); return; }

    // Increment views
    await prisma.vehicle.update({ where: { id: vehicle.id }, data: { viewsCount: { increment: 1 } } });

    sendSuccess(res, vehicle);
  } catch (err) { next(err); }
});

vehicleRouter.post("/", authenticate, validate(createVehicleSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await prisma.vehicle.create({
      data: { tenantId: req.user!.tenantId, sellerId: req.user!.userId, ...req.body },
    });
    sendSuccess(res, vehicle, 201);
  } catch (err) { next(err); }
});

vehicleRouter.patch("/:id", authenticate, validate(updateVehicleSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendSuccess(res, vehicle);
  } catch (err) { next(err); }
});

// Inspections
vehicleRouter.post("/inspections", authenticate, validate(createInspectionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspection = await prisma.vehicleInspection.create({
      data: { tenantId: req.user!.tenantId, requestedBy: req.user!.userId, ...req.body },
    });
    sendSuccess(res, inspection, 201);
  } catch (err) { next(err); }
});

vehicleRouter.patch("/inspections/:id/complete", authenticate, validate(completeInspectionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspection = await prisma.vehicleInspection.update({
      where: { id: req.params.id },
      data: { ...req.body, status: "COMPLETED", inspectorId: req.user!.userId },
    });
    sendSuccess(res, inspection);
  } catch (err) { next(err); }
});

vehicleRouter.get("/inspections/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspection = await prisma.vehicleInspection.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { vehicle: { include: { images: true } } },
    });
    if (!inspection) { sendError(res, "Inspection not found", 404); return; }
    sendSuccess(res, inspection);
  } catch (err) { next(err); }
});
