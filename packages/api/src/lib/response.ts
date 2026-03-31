import { Response } from "express";
import type { ApiResponse, PaginationMeta } from "@wise/shared";

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const response: ApiResponse<T> = { success: true, data };
  res.status(status).json(response);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta
): void {
  res.json({ success: true, data, meta });
}

export function sendError(res: Response, error: string, status = 400): void {
  res.status(status).json({ success: false, error });
}
