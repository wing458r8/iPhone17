import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS, PRODUCT_MAP } from "@/lib/products";
import type {
  AppleApiResponse,
  AppleStore,
  AvailabilityResult,
  Store,
} from "@/types";

// Edge Runtime を使用することで Cloudflare の Bot 検出を回避
export const runtime = "edge";
export const dynamic = "force-dynamic";

function buildUrl(postalCode: string): string {
  const params = new URLSearchParams({
    pl: "true",
    "mts.0": "compact",
    cppart: "UNLOCKED/JP",
    location: postalCode,
  });
  PRODUCTS.forEach((p, i) => params.set(`parts.${i}`, p.sku));
  return `https://www.apple.com/jp/shop/fulfillment-messages?${params}`;
}

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
  const demo = request.nextUrl.searchParams.get("demo") === "true";

  if (!/^\d{7}$/.test(postalCode)) {
    return NextResponse.json({ error: "郵便番号は7桁の数字で入力してください" }, { status: 400 });
  }

  if (demo) {
    return NextResponse.json({ ...getDemoData(), isDemo: true }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const res = await fetch(buildUrl(postalCode), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "ja-JP,ja;q=0.9,en-US;q=0.8",
        "Referer": "https://www.apple.com/jp/shop/buy-iphone",
        "Origin": "https://www.apple.com",
        "sec-ch-ua": '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: AppleApiResponse = await res.json();
    const rawStores = data?.body?.PickupMessage?.stores ?? [];
    const stores = rawStores.map(transformStore);
    const result: AvailabilityResult = {
      stores,
      fetchedAt: new Date().toISOString(),
      hasAvailable: stores.some((s) => Object.values(s.availability).some((a) => a.pickupDisplay === "available")),
    };

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { ...getDemoData(), isDemo: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
