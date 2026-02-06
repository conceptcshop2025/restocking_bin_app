import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await sql`
      INSERT INTO warehouse_products (
        title,
        product_type,
        sku,
        upc,
        bin_location,
        htsus,
        image_url,
        remaining_quantity,
        total_quantity
      )
      VALUES (
        ${body.title},
        '',
        ${body.sku},
        ${body.upc ?? null},
        ${JSON.stringify(body.binLocation)},
        ${body.htsus ?? null},
        ${body.imageUrl ?? null},
        ${body.quantityToReStock},
        ${body.quantityAvailable}
      )
      ON CONFLICT (sku) DO UPDATE SET
        remaining_quantity =
          warehouse_products.remaining_quantity
          + EXCLUDED.remaining_quantity
      RETURNING *;
    `;

    return NextResponse.json({ data: result[0] }, { status: 200 });
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}