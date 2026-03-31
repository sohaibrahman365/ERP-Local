import { z } from "zod";

export const createAccountSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(2).max(100),
  type: z.enum([
    "ASSET",
    "LIABILITY",
    "EQUITY",
    "REVENUE",
    "COGS",
    "EXPENSE",
    "OTHER_INCOME",
    "OTHER_EXPENSE",
  ]),
  parentId: z.string().uuid().optional(),
  isHeader: z.boolean().default(false),
  normalBalance: z.enum(["DEBIT", "CREDIT"]),
  currency: z.string().default("PKR"),
  description: z.string().optional(),
});

export const createJournalEntrySchema = z.object({
  entryDate: z.coerce.date(),
  description: z.string().min(2),
  referenceType: z.string().optional(),
  referenceId: z.string().uuid().optional(),
  lines: z
    .array(
      z.object({
        accountId: z.string().uuid(),
        debitAmount: z.number().min(0).default(0),
        creditAmount: z.number().min(0).default(0),
        description: z.string().optional(),
        costCenter: z.string().optional(),
      })
    )
    .min(2),
});

export const createInvoiceSchema = z.object({
  type: z.enum(["SALES", "PURCHASE", "CREDIT_NOTE", "DEBIT_NOTE", "PROFORMA"]),
  customerId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  paymentTerms: z.string().optional(),
  ntn: z.string().optional(),
  strn: z.string().optional(),
  notes: z.string().optional(),
  termsText: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string(),
        productId: z.string().uuid().optional(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        discountPct: z.number().min(0).max(100).default(0),
        taxRatePct: z.number().min(0).max(100).default(0),
        accountId: z.string().uuid().optional(),
      })
    )
    .min(1),
});

export const recordPaymentSchema = z.object({
  type: z.enum(["RECEIPT", "PAYMENT", "REFUND", "ADVANCE", "TRANSFER"]),
  customerId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  installmentId: z.string().uuid().optional(),
  amount: z.number().positive(),
  paymentMethod: z.enum([
    "CASH",
    "BANK_TRANSFER",
    "CHEQUE",
    "JAZZCASH",
    "EASYPAISA",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "ONLINE_GATEWAY",
    "WALLET",
    "PAYORDER",
  ]),
  bankAccountId: z.string().uuid().optional(),
  chequeNumber: z.string().optional(),
  chequeDate: z.coerce.date().optional(),
  reference: z.string().optional(),
  paymentDate: z.coerce.date(),
  notes: z.string().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
