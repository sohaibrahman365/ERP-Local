import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "@wise/shared";

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me";

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    const userPerms = req.user.permissions ?? [];

    const hasPermission = requiredPermissions.every((required) => {
      const [module, action, scope] = required.split(":");

      return userPerms.some((perm: string) => {
        const [pModule, pAction, pScope] = perm.split(":");
        if (pModule !== module) return false;
        if (pAction !== action) return false;
        // "all" scope grants access to "team" and "own" as well
        if (pScope === "all") return true;
        if (pScope === "team" && (scope === "team" || scope === "own")) return true;
        return pScope === scope;
      });
    });

    if (!hasPermission) {
      res.status(403).json({ success: false, error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
