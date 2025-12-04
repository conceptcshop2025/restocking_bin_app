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

export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM restocking_bin ORDER BY date DESC;
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { message: "No restocking bins found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result }, { status: 200 });
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      );
    }
    await sql`
      DELETE FROM restocking_bin WHERE id = ${id};
    `;
    return NextResponse.json({ message: "Restocking bin deleted successfully" }, { status: 200 });
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, products } = body;

    if (!id || !products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    await sql`
      UPDATE restocking_bin SET products = ${JSON.stringify(products)}::jsonb, date = NOW() WHERE id = ${id} returning *;
    `;
    return NextResponse.json({ message: "Restocking bin updated successfully" }, { status: 200 });
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}