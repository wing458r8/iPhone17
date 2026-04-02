import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS, PRODUCT_MAP } from "@/lib/products";
import type { AppleApiResponse, AvailabilityResult, Store, AppleStore } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function transformStore(s: AppleStore): Store {
  const availability: Store["availability"] = {};
  for (const [sku, part] of Object.entries(s.partsAvailability)) {
    if (PRODUCT_MAP[sku]) {
      availability[sku] = {
        sku,
        pickupDisplay: part.pickupDisplay,
        pickupSearchQuote: part.pickupSearchQuote ?? "",
        storePickMessage: part.messageTypes?.compact?.storePickMessage ?? "",
      };
    }
  }
  const addr = s.address;
  return {
    storeId: s.storeId,
    storeName: s.storeName,
    city: s.city ?? addr?.city ?? "",
    address: [addr?.street, addr?.city, addr?.state].filter(Boolean).join(" "),
    phone: s.storephone ?? "",
    distance: s.storeDistanceWithUnit ?? s.storedistance ?? "",
    availability,
  };
}

function getDemoData(): AvailabilityResult {
  const makeAvail = (display: "available" | "unavailable") =>
    Object.fromEntries(
      PRODUCTS.map((p) => [
        p.sku,
        { sku: p.sku, pickupDisplay: display, pickupSearchQuote: display === "available" ? "今日" : "", storePickMessage: "" },
      ])
    );
  return {
    stores: [
      { storeId: "R337", storeName: "Apple 表参道", city: "港区", address: "", phone: "", distance: "0.5 km",
        availability: { ...makeAvail("available"), [PRODUCTS[1].sku]: { sku: PRODUCTS[1].sku, pickupDisplay: "unavailable", pickupSearchQuote: "", storePickMessage: "" } } },
      { storeId: "R293", storeName: "Apple 新宿", city: "新宿区", address: "", phone: "", distance: "4.2 km",
        availability: { ...makeAvail("unavailable"), [PRODUCTS[3].sku]: { sku: PRODUCTS[3].sku, pickupDisplay: "available", pickupSearchQuote: "今日", storePickMessage: "" }, [PRODUCTS[4].sku]: { sku: PRODUCTS[4].sku, pickupDisplay: "available", pickupSearchQuote: "今日", storePickMessage: "" } } },
      { storeId: "R462", storeName: "Apple 渋谷", city: "渋谷区", address: "", phone: "", distance: "5.8 km", availability: makeAvail("unavailable") },
      { storeId: "R272", storeName: "Apple 丸の内", city: "千代田区", address: "", phone: "", distance: "9.1 km", availability: makeAvail("unavailable") },
    ],
    fetchedAt: new Date().toISOString(),
    hasAvailable: true,
  };
}

export async function GET(request: NextRequest) {
  const postalCode = request.nextUrl.searchParams.get("postalCode") ?? "1060032";

  if (!/^\d{7}$/.test(postalCode)) {
    return NextResponse.json({ error: "郵便番号は7桁の数字で入力してください" }, { status: 400 });
  }

  // Vercel 環境では Python 関数（curl_cffi）経由で Apple API を呼ぶ
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    try {
      const pythonRes = await fetch(
        `https://${vercelUrl}/api/apple?postalCode=${postalCode}`,
        { cache: "no-store" }
      );
      if (pythonRes.ok) {
        const data: AppleApiResponse = await pythonRes.json();
        const rawStores = data?.body?.PickupMessage?.stores ?? [];
        const stores = rawStores.map(transformStore);
        const result: AvailabilityResult = {
          stores,
          fetchedAt: new Date().toISOString(),
          hasAvailable: stores.some((s) =>
            Object.values(s.availability).some((a) => a.pickupDisplay === "available")
          ),
        };
        return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
      }
    } catch {
      // Python 関数が失敗した場合はデモにフォールバック
    }
  }

  return NextResponse.json(
    { ...getDemoData(), isDemo: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}
