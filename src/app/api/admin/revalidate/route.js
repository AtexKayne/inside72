import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { revalidateSiteCache } from "@/lib/revalidate-site";

export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const revalidated = await revalidateSiteCache();
  return NextResponse.json({ ok: true, revalidated });
}
