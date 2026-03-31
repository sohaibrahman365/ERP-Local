import { Router, Request, Response, NextFunction } from "express";
import { createAccountSchema, createJournalEntrySchema, createInvoiceSchema, recordPaymentSchema, paginationSchema } from "@wise/shared";
import { generateSequentialNumber } from "@wise/shared";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPaginated, sendError } from "../lib/response";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";

export const financeRouter = Router();

// Chart of Accounts
financeRouter.get("/accounts", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { tenantId: req.user!.tenantId, isActive: true },
      orderBy: { code: "asc" },
    });
    sendSuccess(res, accounts);
  } catch (err) { next(err); }
});

financeRouter.post("/accounts", authenticate, requirePermission("finance:write:all"), validate(createAccountSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await prisma.chartOfAccount.create({
      data: { tenantId: req.user!.tenantId, ...req.body },
    });
    sendSuccess(res, account, 201);
  } catch (err) { next(err); }
});

// Journal Entries
financeRouter.get("/journal-entries", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize } = paginationSchema.parse(req.query);
    const where = { tenantId: req.user!.tenantId };

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: { lines: { include: { account: true } } },
        orderBy: { entryDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.journalEntry.count({ where }),
    ]);

    sendPaginated(res, entries, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

financeRouter.post("/journal-entries", authenticate, requirePermission("finance:write:all"), validate(createJournalEntrySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entryDate, description, referenceType, referenceId, lines } = req.body;

    const totalDebit = lines.reduce((sum: number, l: { debitAmount: number }) => sum + l.debitAmount, 0);
    const totalCredit = lines.reduce((sum: number, l: { creditAmount: number }) => sum + l.creditAmount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      sendError(res, "Journal entry must balance: total debits must equal total credits");
      return;
    }

    const entryCount = await prisma.journalEntry.count({ where: { tenantId: req.user!.tenantId } });
    const entryNumber = generateSequentialNumber("JE", entryCount + 1);

    const entry = await prisma.journalEntry.create({
      data: {
        tenantId: req.user!.tenantId,
        entryNumber,
        entryDate: new Date(entryDate),
        description,
        referenceType,
        referenceId,
        totalDebit,
        totalCredit,
        createdBy: req.user!.userId,
        lines: {
          create: lines.map((l: { accountId: string; debitAmount: number; creditAmount: number; description?: string; costCenter?: string }) => ({
            tenantId: req.user!.tenantId,
            accountId: l.accountId,
            debitAmount: l.debitAmount,
            creditAmount: l.creditAmount,
            description: l.description,
            costCenter: l.costCenter,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });

    sendSuccess(res, entry, 201);
  } catch (err) { next(err); }
});

financeRouter.patch("/journal-entries/:id/approve", authenticate, requirePermission("finance:approve:all"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await prisma.journalEntry.update({
      where: { id: req.params.id },
      data: { status: "APPROVED", approvedBy: req.user!.userId, approvedAt: new Date() },
    });
    sendSuccess(res, entry);
  } catch (err) { next(err); }
});

financeRouter.patch("/journal-entries/:id/post", authenticate, requirePermission("finance:approve:all"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await prisma.journalEntry.update({
      where: { id: req.params.id },
      data: { status: "POSTED", postedAt: new Date() },
    });
    sendSuccess(res, entry);
  } catch (err) { next(err); }
});

// Invoices
financeRouter.get("/invoices", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize } = paginationSchema.parse(req.query);
    const where: Record<string, unknown> = { tenantId: req.user!.tenantId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.type) where.type = req.query.type;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { items: true },
        orderBy: { invoiceDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.invoice.count({ where }),
    ]);

    sendPaginated(res, invoices, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

financeRouter.post("/invoices", authenticate, requirePermission("finance:write:all"), validate(createInvoiceSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, customerId, vendorId, orderId, bookingId, invoiceDate, dueDate, paymentTerms, ntn, strn, notes, termsText, items } = req.body;

    const invoiceCount = await prisma.invoice.count({ where: { tenantId: req.user!.tenantId } });
    const invoiceNumber = generateSequentialNumber("INV", invoiceCount + 1);

    let subtotal = 0;
    let taxAmount = 0;

    const invoiceItems = items.map((item: { description: string; productId?: string; quantity: number; unitPrice: number; discountPct?: number; taxRatePct?: number; accountId?: string }) => {
      const lineTotal = item.quantity * item.unitPrice * (1 - (item.discountPct ?? 0) / 100);
      const lineTax = lineTotal * ((item.taxRatePct ?? 0) / 100);
      subtotal += lineTotal;
      taxAmount += lineTax;
      return {
        tenantId: req.user!.tenantId,
        description: item.description,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPct: item.discountPct ?? 0,
        taxRatePct: item.taxRatePct ?? 0,
        taxAmount: lineTax,
        totalAmount: lineTotal + lineTax,
        accountId: item.accountId,
      };
    });

    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: req.user!.tenantId,
        invoiceNumber, type, customerId, vendorId, orderId, bookingId,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        subtotal, taxAmount, totalAmount,
        paymentTerms, ntn, strn, notes, termsText,
        createdBy: req.user!.userId,
        items: { create: invoiceItems },
      },
      include: { items: true },
    });

    sendSuccess(res, invoice, 201);
  } catch (err) { next(err); }
});

// Payments
financeRouter.get("/payments", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize } = paginationSchema.parse(req.query);
    const where = { tenantId: req.user!.tenantId };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { invoice: true },
        orderBy: { paymentDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payment.count({ where }),
    ]);

    sendPaginated(res, payments, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

financeRouter.post("/payments", authenticate, requirePermission("finance:write:all"), validate(recordPaymentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paymentCount = await prisma.payment.count({ where: { tenantId: req.user!.tenantId } });
    const paymentNumber = generateSequentialNumber("PAY", paymentCount + 1);

    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          tenantId: req.user!.tenantId,
          paymentNumber,
          ...req.body,
          paymentDate: new Date(req.body.paymentDate),
          status: "COMPLETED",
          createdBy: req.user!.userId,
        },
      });

      // Update invoice paid amount if linked
      if (req.body.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: req.body.invoiceId } });
        if (invoice) {
          const newAmountPaid = Number(invoice.amountPaid) + req.body.amount;
          const newStatus = newAmountPaid >= Number(invoice.totalAmount) ? "PAID" : "PARTIAL";
          await tx.invoice.update({
            where: { id: req.body.invoiceId },
            data: { amountPaid: newAmountPaid, status: newStatus, paidAt: newStatus === "PAID" ? new Date() : undefined },
          });
        }
      }

      return newPayment;
    });

    sendSuccess(res, payment, 201);
  } catch (err) { next(err); }
});

// Financial Reports
financeRouter.get("/reports/trial-balance", authenticate, requirePermission("finance:read:all"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await prisma.chartOfAccount.findMany({
      where: { tenantId: req.user!.tenantId, isActive: true, isHeader: false },
      include: {
        journalLines: {
          where: {
            journalEntry: { status: "POSTED" },
          },
        },
      },
      orderBy: { code: "asc" },
    });

    const trialBalance = accounts.map((account) => {
      const totalDebit = account.journalLines.reduce((sum, l) => sum + Number(l.debitAmount), 0);
      const totalCredit = account.journalLines.reduce((sum, l) => sum + Number(l.creditAmount), 0);
      return {
        code: account.code,
        name: account.name,
        type: account.type,
        debit: totalDebit,
        credit: totalCredit,
        balance: totalDebit - totalCredit,
      };
    });

    sendSuccess(res, trialBalance);
  } catch (err) { next(err); }
});

financeRouter.get("/reports/profit-loss", authenticate, requirePermission("finance:read:all"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const revenueAccounts = await prisma.chartOfAccount.findMany({
      where: { tenantId: req.user!.tenantId, type: { in: ["REVENUE", "OTHER_INCOME"] }, isHeader: false },
      include: { journalLines: { where: { journalEntry: { status: "POSTED" } } } },
    });

    const expenseAccounts = await prisma.chartOfAccount.findMany({
      where: { tenantId: req.user!.tenantId, type: { in: ["EXPENSE", "COGS", "OTHER_EXPENSE"] }, isHeader: false },
      include: { journalLines: { where: { journalEntry: { status: "POSTED" } } } },
    });

    const totalRevenue = revenueAccounts.reduce((sum, a) =>
      sum + a.journalLines.reduce((s, l) => s + Number(l.creditAmount) - Number(l.debitAmount), 0), 0);

    const totalExpenses = expenseAccounts.reduce((sum, a) =>
      sum + a.journalLines.reduce((s, l) => s + Number(l.debitAmount) - Number(l.creditAmount), 0), 0);

    sendSuccess(res, {
      revenue: revenueAccounts.map((a) => ({
        code: a.code,
        name: a.name,
        amount: a.journalLines.reduce((s, l) => s + Number(l.creditAmount) - Number(l.debitAmount), 0),
      })),
      expenses: expenseAccounts.map((a) => ({
        code: a.code,
        name: a.name,
        amount: a.journalLines.reduce((s, l) => s + Number(l.debitAmount) - Number(l.creditAmount), 0),
      })),
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
    });
  } catch (err) { next(err); }
});
