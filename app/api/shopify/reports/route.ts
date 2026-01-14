import { NextResponse } from "next/server";

const baseUrl = process.env.SHOPIFY_DOMAIN_NAME || "";
const apiVersion = process.env.SHOPIFY_API_VERSION || "";
const apiToken = process.env.SHOPIFY_ADMIN_API_TOKEN || "";

export async function GET() {
  const query = `
    query {
      shopifyqlQuery(query: "FROM sales SHOW net_items_sold WHERE line_type = 'product' AND sales_channel = 'Online Store' GROUP BY product_title, product_variant_title, product_variant_sku, product_type WITH TOTALS, CURRENCY 'CAD' DURING yesterday ORDER BY net_items_sold DESC LIMIT 100") {
        tableData {
          columns {
            name
            dataType
            displayName
          }
          rows
        }
        parseErrors
      }
    }
  `;

  try {
    const result = await fetch(`https://${ baseUrl }/admin/api/${ apiVersion }/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": apiToken,
        "Accept": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: `Shopify API request failed with status ${ result.status }` },
        { status: result.status }
      );
    }

    const data = await result.json();
    return NextResponse.json({ data: data.data.shopifyqlQuery.tableData }, { status: 200 });

  } catch(error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}