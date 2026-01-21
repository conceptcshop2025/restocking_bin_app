import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL || "");

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM warehouse_products;
    `;

    if (result.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    return NextResponse.json({ data: result }, { status: 200 });
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const products = Array.isArray(body) ? body : body.products;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Body must be a non-empty array of products" },
        { status: 400 }
      );
    }

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
      SELECT *
      FROM UNNEST(
        ${products.map(p => p.title)}::text[],
        ${products.map(p => p.product_type)}::text[],
        ${products.map(p => p.sku)}::text[],
        ${products.map(p => p.upc ?? null)}::text[],
        ${products.map(p => JSON.stringify(Array.isArray(p.bin_location) ? p.bin_location : []))}::text[],
        ${products.map(p => p.htsus ?? null)}::text[],
        ${products.map(p => p.image_url ?? null)}::text[],
        ${products.map(p => p.remaining_quantity ?? 0)}::int[],
        ${products.map(p => p.total_quantity ?? 0)}::int[]
      )
      RETURNING id;
    `;

    return NextResponse.json(
      {
        message: "Restocking bin saved successfully",
        insertedIds: result.map(r => r.id)
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
