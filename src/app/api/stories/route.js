import { NextResponse } from "next/server";
import { getStories } from "@/lib/data-store";

export async function GET() {
  const items = await getStories();
  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
