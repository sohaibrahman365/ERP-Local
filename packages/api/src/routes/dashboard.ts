import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { sendSuccess } from "../lib/response";
import { authenticate } from "../middleware/auth";

export const dashboardRouter = Router();

dashboardRouter.get("/stats", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;

    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      totalVehicles,
      totalUnits,
      totalBookings,
      totalEmployees,
      recentOrders,
      ordersByStatus,
    ] = await Promise.all([
      prisma.order.count({ where: { tenantId, isDeleted: false } }),
      prisma.customer.count({ where: { tenantId, isDeleted: false } }),
      prisma.product.count({ where: { tenantId, isDeleted: false } }),
      prisma.vehicle.count({ where: { tenantId, isDeleted: false } }),
      prisma.reUnit.count({ where: { tenantId } }),
      prisma.reBooking.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, isDeleted: false } }),
      prisma.order.findMany({
        where: { tenantId, isDeleted: false },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { tenantId, isDeleted: false },
        _count: true,
      }),
    ]);

    sendSuccess(res, {
      ecommerce: { totalOrders, totalCustomers, totalProducts, ordersByStatus },
      automotive: { totalVehicles },
      realEstate: { totalUnits, totalBookings },
      hr: { totalEmployees },
      recentOrders,
    });
  } catch (err) { next(err); }
});

dashboardRouter.get("/revenue", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;

    const payments = await prisma.payment.findMany({
      where: { tenantId, status: "COMPLETED" },
      select: { amount: true, paymentDate: true, type: true },
      orderBy: { paymentDate: "desc" },
      take: 365,
    });

    // Group by month
    const monthlyRevenue: Record<string, number> = {};
    for (const p of payments) {
      if (p.type === "RECEIPT") {
        const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, "0")}`;
        monthlyRevenue[key] = (monthlyRevenue[key] ?? 0) + Number(p.amount);
      }
    }

    sendSuccess(res, {
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount })),
      totalCollected: payments.filter((p) => p.type === "RECEIPT").reduce((s, p) => s + Number(p.amount), 0),
    });
  } catch (err) { next(err); }
});
