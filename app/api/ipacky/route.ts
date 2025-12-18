import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code") || "";
    const type = searchParams.get("type") || "";

    if(!code || !type) {
      return NextResponse.json(
        { error: "Missing code or type parameter" },
        { status: 400 }
      );
    }

    const user = process.env.IPACKY_USER_NAME || "";
    const password = process.env.IPACKY_PASSWORD || "";

    if (!user || !password) {
      return NextResponse.json(
        { error: "Missing API credentials" },
        { status: 500 }
      );
    }

    const token = Buffer.from(`${user}:${password}`).toString("base64");

    const baseUrl = process.env.BASE_URL;
    const response = await fetch(`${baseUrl}/${type === 'upc' ? 'getProductInfoByBarcode': 'getProductInfoBySKU'}?${type === 'upc' ? 'barcode': 'sku'}=${code}&type=${type}`, {
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