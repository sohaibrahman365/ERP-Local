import { Router, Request, Response, NextFunction } from "express";
import { createCustomerSchema, updateCustomerSchema, createAddressSchema, paginationSchema } from "@wise/shared";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPaginated, sendError } from "../lib/response";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";

export const customerRouter = Router();

customerRouter.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, sortBy, sortOrder, search } = paginationSchema.parse(req.query);
    const where: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    if (req.query.segment) where.segment = req.query.segment;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    sendPaginated(res, customers, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

customerRouter.get("/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
      include: { addresses: true, orders: { take: 10, orderBy: { createdAt: "desc" } }, leads: true },
    });
    if (!customer) { sendError(res, "Customer not found", 404); return; }
    sendSuccess(res, customer);
  } catch (err) { next(err); }
});

customerRouter.post("/", authenticate, validate(createCustomerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.create({
      data: { tenantId: req.user!.tenantId, ...req.body },
    });
    sendSuccess(res, customer, 201);
  } catch (err) { next(err); }
});

customerRouter.patch("/:id", authenticate, validate(updateCustomerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendSuccess(res, customer);
  } catch (err) { next(err); }
});

customerRouter.post("/:id/addresses", authenticate, validate(createAddressSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const address = await prisma.customerAddress.create({
      data: { tenantId: req.user!.tenantId, customerId: req.params.id, ...req.body },
    });
    sendSuccess(res, address, 201);
  } catch (err) { next(err); }
});
