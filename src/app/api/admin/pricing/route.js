import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { getPricingContent, updatePricingContent } from "@/lib/data-store";
import { revalidatePricingCache } from "@/lib/revalidate-site";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pricing = await getPricingContent();
  return NextResponse.json({ pricing });
}

export async function PATCH(request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const pricing = await updatePricingContent(body.pricing);
  revalidatePricingCache();
  return NextResponse.json({ pricing });
}
