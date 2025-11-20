import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = process.env.IPACKY_USER_NAME || "";
    const password = process.env.IPACKY_PASSWORD || "";

    if (!user || !password) {
      return NextResponse.json(
        { error: "Missing API credentials" },
        { status: 500 }
      );
    }

    const token = Buffer.from(`${user}:${password}`).toString("base64");

    const response = await fetch(`${process.env.BASE_URL}?barcode=8718503824222&type=upc`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from external API" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}