import { NextRequest } from "next/server";

const ALLOWED_RESOURCES = new Set([
  "tyre_products",
  "supplier_inventory",
  "fitting_stations",
  "station_services",
  "station_payment_methods",
  "station_slots",
]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> },
) {
  const { resource } = await context.params;
  if (!ALLOWED_RESOURCES.has(resource)) {
    return Response.json({ error: "Resource is not available through this endpoint" }, { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return Response.json({ error: "TyreLink backend configuration is missing" }, { status: 503 });
  }

  const upstreamUrl = new URL(`${supabaseUrl}/rest/v1/${resource}`);
  request.nextUrl.searchParams.forEach((value, key) => upstreamUrl.searchParams.append(key, value));

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Accept-Profile": "tyrelink",
      },
      cache: "no-store",
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "TyreLink backend is temporarily unavailable" }, { status: 502 });
  }
}
