import { NextResponse } from "next/server";
import { getNews } from "@/lib/data-store";

export async function GET() {
  const items = await getNews();
  return NextResponse.json({ items });
}
