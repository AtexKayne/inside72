import { SignJWT, jwtVerify } from "jose";

const COOKIE = "inside_admin";

function getSecret() {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

export async function signAdminToken() {
  const secret = getSecret();
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET must be set (min 16 characters)");
  }
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAdminToken(token) {
  const secret = getSecret();
  if (!secret) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE_NAME = COOKIE;
