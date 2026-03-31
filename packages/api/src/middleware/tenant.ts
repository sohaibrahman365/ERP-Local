import { Prisma } from "@wise/database";

/**
 * Prisma middleware that auto-injects tenantId into all queries.
 * Reads tenantId from the Prisma client's $extends context or
 * from the AsyncLocalStorage context set by the auth middleware.
 */
export function createTenantMiddleware(tenantId: string): Prisma.Middleware {
  return async (params, next) => {
    // Skip for Tenant model itself
    if (params.model === "Tenant") {
      return next(params);
    }

    // Auto-inject tenantId for create operations
    if (params.action === "create") {
      params.args.data = { ...params.args.data, tenantId };
    }

    if (params.action === "createMany") {
      if (Array.isArray(params.args.data)) {
        params.args.data = params.args.data.map((item: Record<string, unknown>) => ({
          ...item,
          tenantId,
        }));
      }
    }

    // Auto-filter by tenantId for read/update/delete operations
    if (
      ["findFirst", "findMany", "findUnique", "count", "aggregate", "groupBy"].includes(
        params.action
      )
    ) {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};
      params.args.where.tenantId = tenantId;
    }

    if (["update", "updateMany", "delete", "deleteMany"].includes(params.action)) {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};
      params.args.where.tenantId = tenantId;
    }

    // Soft-delete: convert delete to update (set isDeleted = true)
    if (params.action === "delete") {
      params.action = "update";
      params.args.data = { isDeleted: true };
    }

    if (params.action === "deleteMany") {
      params.action = "updateMany";
      params.args.data = { isDeleted: true };
    }

    // Filter out soft-deleted records on reads
    if (
      ["findFirst", "findMany", "findUnique", "count"].includes(params.action)
    ) {
      // Only add isDeleted filter if the model likely has it
      // (we set it on most models except audit_logs, etc.)
      if (params.args.where.isDeleted === undefined) {
        params.args.where.isDeleted = false;
      }
    }

    return next(params);
  };
}
