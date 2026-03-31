import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { loginSchema, registerTenantSchema, createUserSchema, createRoleSchema } from "@wise/shared";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendError } from "../lib/response";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";

export const authRouter = Router();
const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me";
const ACCESS_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY ?? "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY ?? "7d";

function generateTokens(payload: { userId: string; tenantId: string; role: string; permissions: string[] }) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: 900 }); // 15 min
  const refreshToken = jwt.sign({ userId: payload.userId, tenantId: payload.tenantId }, JWT_SECRET, { expiresIn: 604800 }); // 7 days
  return { accessToken, refreshToken };
}

// POST /auth/register — Register new tenant + admin user
authRouter.post("/register", validate(registerTenantSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantName, fullName, email, password, phone } = req.body;

    const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: tenantName, slug },
      });

      const adminRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: "Super Admin",
          slug: "super-admin",
          permissions: JSON.parse(JSON.stringify(["*:*:all"])),
          isSystem: true,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          passwordHash,
          fullName,
          phone,
          roleId: adminRole.id,
        },
      });

      return { tenant, user, role: adminRole };
    });

    const permissions = ["*:*:all"];
    const tokens = generateTokens({
      userId: result.user.id,
      tenantId: result.tenant.id,
      role: "super-admin",
      permissions,
    });

    sendSuccess(res, {
      user: { id: result.user.id, email, fullName },
      tenant: { id: result.tenant.id, name: tenantName },
      ...tokens,
    }, 201);
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
authRouter.post("/login", validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
      where: { email, isDeleted: false },
      include: { role: true, tenant: true },
    });

    if (!user?.passwordHash) {
      sendError(res, "Invalid email or password", 401);
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      sendError(res, "Invalid email or password", 401);
      return;
    }

    if (user.status !== "ACTIVE") {
      sendError(res, "Account is inactive or suspended", 403);
      return;
    }

    const permissions = (user.role?.permissions as string[]) ?? [];
    const tokens = generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role?.slug ?? "user",
      permissions,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role?.name,
        tenantId: user.tenantId,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        plan: user.tenant.plan,
      },
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me — Get current user profile
authRouter.get("/me", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { role: true, department: true, location: true },
    });

    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      department: user.department,
      location: user.location,
      tenantId: user.tenantId,
      preferences: user.preferences,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh — Refresh access token
authRouter.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      sendError(res, "Refresh token required", 400);
      return;
    }

    const payload = jwt.verify(refreshToken, JWT_SECRET) as { userId: string; tenantId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });

    if (!user || user.status !== "ACTIVE") {
      sendError(res, "Invalid refresh token", 401);
      return;
    }

    const permissions = (user.role?.permissions as string[]) ?? [];
    const tokens = generateTokens({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role?.slug ?? "user",
      permissions,
    });

    sendSuccess(res, tokens);
  } catch {
    sendError(res, "Invalid refresh token", 401);
  }
});

// User management routes (admin)
authRouter.post(
  "/users",
  authenticate,
  requirePermission("admin:write:all"),
  validate(createUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const passwordHash = await bcrypt.hash(data.password, 12);

      const user = await prisma.user.create({
        data: {
          tenantId: req.user!.tenantId,
          email: data.email,
          fullName: data.fullName,
          passwordHash,
          phone: data.phone,
          roleId: data.roleId,
          departmentId: data.departmentId,
          locationId: data.locationId,
          designation: data.designation,
        },
      });

      sendSuccess(res, { id: user.id, email: user.email, fullName: user.fullName }, 201);
    } catch (err) {
      next(err);
    }
  }
);

// Role management
authRouter.post(
  "/roles",
  authenticate,
  requirePermission("admin:write:all"),
  validate(createRoleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await prisma.role.create({
        data: {
          tenantId: req.user!.tenantId,
          ...req.body,
          permissions: JSON.parse(JSON.stringify(req.body.permissions)),
        },
      });

      sendSuccess(res, role, 201);
    } catch (err) {
      next(err);
    }
  }
);

authRouter.get("/roles", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.role.findMany({
      where: { tenantId: req.user!.tenantId },
    });
    sendSuccess(res, roles);
  } catch (err) {
    next(err);
  }
});
