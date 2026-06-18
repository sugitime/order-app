import { NextResponse } from "next/server";
import { lookupAmazonProduct } from "@/lib/amazon-product";
import { amazonUrlSchema } from "@/lib/validators";
import { z } from "zod";

const lookupSchema = z.object({
  amazonUrl: amazonUrlSchema,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = lookupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid Amazon URL" },
        { status: 400 }
      );
    }

    const result = await lookupAmazonProduct(parsed.data.amazonUrl);

    return NextResponse.json({
      asin: result.asin,
      title: result.title,
      unitPrice: result.unitPrice,
      priceCurrency: result.priceCurrency,
      priceDisplay: result.priceDisplay,
      isPrimeEligible: result.isPrimeEligible,
      source: result.source,
      error: result.error,
    });
  } catch (error) {
    console.error("Amazon lookup error:", error);
    return NextResponse.json({ error: "Failed to look up product" }, { status: 500 });
  }
}