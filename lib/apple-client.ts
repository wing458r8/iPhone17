import type { AppleApiResponse, AvailabilityResult, Store } from "@/types";
import { PRODUCTS, PRODUCT_MAP } from "@/lib/products";

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

function transformStore(s: NonNullable<AppleApiResponse["body"]["PickupMessage"]["stores"][number]>): Store {
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

// Cloudflare Worker 経由で Apple API を呼ぶ
const CF_WORKER = "https://long-voice-e512.wing45888.workers.dev";

export async function fetchAvailabilityFromBrowser(
  postalCode: string
): Promise<AvailabilityResult> {
  // Cloudflare Worker にプロキシさせる
  const appleUrl = buildUrl(postalCode);
  const workerUrl = CF_WORKER + "/jp/shop/fulfillment-messages?" + appleUrl.split("?")[1];
  const res = await fetch(workerUrl);

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data: AppleApiResponse = await res.json();
  const rawStores = data?.body?.PickupMessage?.stores ?? [];
  const stores = rawStores.map(transformStore);

  return {
    stores,
    fetchedAt: new Date().toISOString(),
    hasAvailable: stores.some((s) =>
      Object.values(s.availability).some((a) => a.pickupDisplay === "available")
    ),
  };
}
