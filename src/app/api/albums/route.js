import { NextResponse } from "next/server";
import { getAlbums } from "@/lib/data-store";

export async function GET() {
  const items = await getAlbums();
  return NextResponse.json({ items });
}
