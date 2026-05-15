import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth-token";
import { verifyAdminCredentials } from "@/lib/auth-credentials";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    if (!username || !password) {
      return NextResponse.json({ error: "Введите логин и пароль" }, { status: 400 });
    }

    const ok = await verifyAdminCredentials(username, password);
    if (!ok) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 401 });
    }

    const token = await signAdminToken();
    const jar = await cookies();
    jar.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Сервер не настроен: проверьте ADMIN_JWT_SECRET в .env.local" },
      { status: 500 }
    );
  }
}
