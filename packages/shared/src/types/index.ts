// API response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// JWT payload
export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

// Permission format: module:action:scope
export type PermissionScope = "all" | "team" | "own";
export type PermissionAction = "read" | "write" | "delete" | "approve" | "export";
export type Permission = `${string}:${PermissionAction}:${PermissionScope}`;

// Query params for list endpoints
export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

// Tenant request context (set by auth middleware)
export interface RequestContext {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
}
