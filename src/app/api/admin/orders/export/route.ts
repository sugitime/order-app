import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  buildOrderedItemsCsv,
  fetchOrderedLineItems,
  orderedItemsExportFilename,
} from "@/lib/ordered-items-export";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in to export orders." }, { status: 401 });
    }

    const rows = await fetchOrderedLineItems();
    const csv = buildOrderedItemsCsv(rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${orderedItemsExportFilename()}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Ordered items export error:", error);
    return NextResponse.json({ error: "Failed to export ordered items." }, { status: 500 });
  }
}