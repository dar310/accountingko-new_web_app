import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

const privateKey = fs.readFileSync(path.join(process.cwd(), "private.key"), "utf8");
const publicKey = fs.readFileSync(path.join(process.cwd(), "public.key"), "utf8");

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export function generateToken(user: AuthenticatedUser) {
  return jwt.sign(user, privateKey, { algorithm: "RS256", expiresIn: "7d" });
}

export async function getUserFromRequest(request: Request): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];

  try {
    return jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as AuthenticatedUser;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export async function requireUserFromAPI(request: Request): Promise<AuthenticatedUser> {
  const user = await getUserFromRequest(request);
  if (!user) throw new Error("Unauthorized");
  return user;
}
