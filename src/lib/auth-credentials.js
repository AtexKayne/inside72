import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";

function safeEqualStrings(a, b) {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function verifyAdminCredentials(username, password) {
  const u = process.env.ADMIN_USERNAME ?? "admin";
  if (username !== u) return false;

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    return bcrypt.compare(password, hash);
  }

  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) {
    console.warn("Set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH in .env.local");
    return false;
  }

  return safeEqualStrings(plain, password);
}
