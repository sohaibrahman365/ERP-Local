import { Router, Request, Response, NextFunction } from "express";
import { createProjectSchema, createUnitSchema, createBookingSchema, createInstallmentPlanSchema, recordInstallmentPaymentSchema, paginationSchema } from "@wise/shared";
import { generateSequentialNumber } from "@wise/shared";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPaginated, sendError } from "../lib/response";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";

export const realEstateRouter = Router();

// Projects
realEstateRouter.get("/projects", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await prisma.reProject.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { _count: { select: { units: true } } },
      orderBy: { createdAt: "desc" },
    });
    sendSuccess(res, projects);
  } catch (err) { next(err); }
});

realEstateRouter.get("/projects/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.reProject.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { units: true, installmentPlans: true },
    });
    if (!project) { sendError(res, "Project not found", 404); return; }
    sendSuccess(res, project);
  } catch (err) { next(err); }
});

realEstateRouter.post("/projects", authenticate, requirePermission("realestate:write:all"), validate(createProjectSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.reProject.create({
      data: { tenantId: req.user!.tenantId, ...req.body },
    });
    sendSuccess(res, project, 201);
  } catch (err) { next(err); }
});

// Units
realEstateRouter.get("/projects/:projectId/units", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const units = await prisma.reUnit.findMany({
      where: { projectId: req.params.projectId, tenantId: req.user!.tenantId },
      orderBy: [{ floorNumber: "asc" }, { unitNumber: "asc" }],
    });
    sendSuccess(res, units);
  } catch (err) { next(err); }
});

realEstateRouter.post("/units", authenticate, requirePermission("realestate:write:all"), validate(createUnitSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unit = await prisma.reUnit.create({
      data: { tenantId: req.user!.tenantId, ...req.body },
    });
    sendSuccess(res, unit, 201);
  } catch (err) { next(err); }
});

// Bookings
realEstateRouter.get("/bookings", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize } = paginationSchema.parse(req.query);
    const where = { tenantId: req.user!.tenantId };

    const [bookings, total] = await Promise.all([
      prisma.reBooking.findMany({
        where,
        include: { unit: { include: { project: true } }, installments: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.reBooking.count({ where }),
    ]);

    sendPaginated(res, bookings, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

realEstateRouter.post("/bookings", authenticate, requirePermission("realestate:write:all"), validate(createBookingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId, customerId, agentId, dealerId, bookingDate, totalAmount, downPayment, installmentPlanId, notes } = req.body;

    const bookingCount = await prisma.reBooking.count({ where: { tenantId: req.user!.tenantId } });
    const bookingNumber = generateSequentialNumber("BKG", bookingCount + 1);

    const booking = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.reBooking.create({
        data: {
          tenantId: req.user!.tenantId,
          unitId, customerId, agentId, dealerId,
          bookingDate: new Date(bookingDate),
          bookingNumber, totalAmount, downPayment,
          installmentPlanId, notes,
          status: "CONFIRMED",
        },
      });

      // Update unit status
      await tx.reUnit.update({
        where: { id: unitId },
        data: { status: "BOOKED" },
      });

      // Generate installment schedule if plan exists
      if (installmentPlanId) {
        const plan = await tx.reInstallmentPlan.findUnique({ where: { id: installmentPlanId } });
        if (plan) {
          const remainingAmount = totalAmount - downPayment;
          const installmentAmount = remainingAmount / plan.numInstallments;
          const installments = [];

          for (let i = 1; i <= plan.numInstallments; i++) {
            const dueDate = new Date(bookingDate);
            if (plan.frequency === "MONTHLY") dueDate.setMonth(dueDate.getMonth() + i);
            if (plan.frequency === "QUARTERLY") dueDate.setMonth(dueDate.getMonth() + i * 3);
            if (plan.frequency === "HALF_YEARLY") dueDate.setMonth(dueDate.getMonth() + i * 6);
            if (plan.frequency === "YEARLY") dueDate.setFullYear(dueDate.getFullYear() + i);

            installments.push({
              tenantId: req.user!.tenantId,
              bookingId: newBooking.id,
              installmentNo: i,
              label: `Installment ${i}`,
              dueDate,
              amountDue: installmentAmount,
            });
          }

          await tx.reInstallment.createMany({ data: installments });
        }
      }

      return newBooking;
    });

    const result = await prisma.reBooking.findUnique({
      where: { id: booking.id },
      include: { installments: true, unit: true },
    });

    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
});

// Installment payment
realEstateRouter.patch("/installments/:id/pay", authenticate, validate(recordInstallmentPaymentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amountPaid, paymentMethod, paymentRef, notes } = req.body;

    const installment = await prisma.reInstallment.update({
      where: { id: req.params.id },
      data: {
        amountPaid: { increment: amountPaid },
        paymentMethod,
        paymentRef,
        paidDate: new Date(),
        status: "PAID",
        notes,
      },
    });

    sendSuccess(res, installment);
  } catch (err) { next(err); }
});

// Installment plans
realEstateRouter.get("/installment-plans", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await prisma.reInstallmentPlan.findMany({
      where: { tenantId: req.user!.tenantId, isActive: true },
    });
    sendSuccess(res, plans);
  } catch (err) { next(err); }
});

realEstateRouter.post("/installment-plans", authenticate, requirePermission("realestate:write:all"), validate(createInstallmentPlanSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await prisma.reInstallmentPlan.create({
      data: { tenantId: req.user!.tenantId, ...req.body },
    });
    sendSuccess(res, plan, 201);
  } catch (err) { next(err); }
});
