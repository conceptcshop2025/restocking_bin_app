import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, products } = body;

    if (!name || !products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO restocking_bin (date, name, products) VALUES (NOW(), ${name}, ${JSON.stringify(products)}::jsonb) returning id;
    `;

    return NextResponse.json({ message: "Restocking bin saved successfully", id: result[0].id }, { status: 201 });
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}