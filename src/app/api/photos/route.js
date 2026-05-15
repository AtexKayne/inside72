import { NextResponse } from "next/server";
import { getPhotos } from "@/lib/data-store";

export async function GET() {
  const items = await getPhotos();
  return NextResponse.json({ items });
}
