import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface AuthUser {
  userId: number;
  username: string;
}

export function verifyToken(request: NextRequest): AuthUser | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;

    return decoded;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  return verifyToken(request);
}
