import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface IRequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: "citizen" | "city_authority" | "admin";
  };
}

export function authenticateToken(req: IRequestWithUser, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "Access denied. Authenticative validation token missing." });
  }

  const jwtSecret = process.env.JWT_SECRET || "fallback_local_secret";

  try {
    const verified = jwt.verify(token, jwtSecret) as any;
    req.user = {
      id: verified.id,
      email: verified.email,
      role: verified.role,
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: "Access authorization failed. Invalid or expired token credentials." });
  }
}

export function restrictToRoles(allowedRoles: Array<"citizen" | "city_authority" | "admin">) {
  return (req: IRequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Access denied. Authenticative validation missing." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Operation prohibited. Your account possesses insufficient authority levels." });
    }

    next();
  };
}
