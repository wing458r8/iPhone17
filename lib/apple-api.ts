import { execFile } from "child_process";
import { promisify } from "util";
import * as os from "os";
import * as path from "path";
import type {
  AppleApiResponse,
  AppleStore,
  AvailabilityResult,
  Store,
} from "@/types";
import { PRODUCTS, PRODUCT_MAP } from "@/lib/products";

const execFileAsync = promisify(execFile);

const APPLE_API_BASE =
  "https://www.apple.com/jp/shop/fulfillment-messages";

const COOKIE_FILE = path.join(os.tmpdir(), "apple-store-cookies.txt");

let sessionInitialized = false;

async function initSession(): Promise<void> {
  if (sessionInitialized) return;
  try {
    await execFileAsync("curl", [
      "-s", "-o", "/dev/null",
      "--http2", "--tlsv1.2",
      "-A", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "-c", COOKIE_FILE,
      "--compressed", "--max-time", "10",
      "https://www.apple.com/jp/shop/buy-iphone",
    ]);
    sessionInitialized = true;
  } catch {
    // ignore
  }
}

function buildAppleApiUrl(postalCode: string): string {
  const params = new URLSearchParams({
    pl: "true",
    "mts.0": "compact",
    cppart: "UNLOCKED/JP",
    location: postalCode,
  });
  PRODUCTS.forEach((product, i) => {
    params.set(`parts.${i}`, product.sku);
  });
  return `${APPLE_API_BASE}?${params.toString()}`;
}

function transformStore(appleStore: AppleStore): Store {
  const availability: Store["availability"] = {};
  for (const [sku, part] of Object.entries(appleStore.partsAvailability)) {
    if (PRODUCT_MAP[sku]) {
      availability[sku] = {
        sku,
        pickupDisplay: part.pickupDisplay,
        pickupSearchQuote: part.pickupSearchQuote ?? "",
        storePickMessage:
          part.messageTypes?.compact?.storePickMessage ?? "",
      };
    }
  }
  const addr = appleStore.address;
  const addressStr = [addr?.street, addr?.city, addr?.state]
    .filter(Boolean)
    .join(" ");
  return {
    storeId: appleStore.storeId,
    storeName: appleStore.storeName,
    city: appleStore.city ?? addr?.city ?? "",
    address: addressStr,
    phone: appleStore.storephone ?? "",
    distance: appleStore.storeDistanceWithUnit ?? appleStore.storedistance ?? "",
    availability,
  };
}

async function fetchFromApple(url: string): Promise<string> {
  await initSession();

  const args = [
    "-s",
    "--http2", "--tlsv1.2",
    "-A", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "-b", COOKIE_FILE,
    "-c", COOKIE_FILE,
    "-H", "Accept: application/json, text/javascript, */*; q=0.01",
    "-H", "Accept-Language: ja-JP,ja;q=0.9,en-US;q=0.8",
    "-H", "Referer: https://www.apple.com/jp/shop/buy-iphone",
    "-H", "Origin: https://www.apple.com",
    "-H", "sec-ch-ua: \"Google Chrome\";v=\"124\", \"Chromium\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
    "-H", "sec-ch-ua-mobile: ?0",
    "-H", "sec-ch-ua-platform: \"macOS\"",
    "-H", "sec-fetch-dest: empty",
    "-H", "sec-fetch-mode: cors",
    "-H", "sec-fetch-site: same-origin",
    "-H", "X-Requested-With: XMLHttpRequest",
    "--compressed",
    "--max-time", "10",
    url,
  ];

  const { stdout } = await execFileAsync("curl", args);
  return stdout;
}

export async function fetchAvailability(
  postalCode: string
): Promise<AvailabilityResult> {
  const url = buildAppleApiUrl(postalCode);
  const stdout = await fetchFromApple(url);

  let data: AppleApiResponse;
  try {
    data = JSON.parse(stdout);
  } catch {
    // セッションリセットして1回リトライ
    sessionInitialized = false;
    const stdout2 = await fetchFromApple(url);
    try {
      data = JSON.parse(stdout2);
    } catch {
      throw new Error(
        "Apple APIへの接続がブロックされています。" +
        "Vercelにデプロイすると正常に動作します。"
      );
    }
  }

  const rawStores = data?.body?.PickupMessage?.stores ?? [];
  const stores = rawStores.map(transformStore);
  const hasAvailable = stores.some((store) =>
    Object.values(store.availability).some(
      (a) => a.pickupDisplay === "available"
    )
  );

  return {
    stores,
    fetchedAt: new Date().toISOString(),
    hasAvailable,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// デモデータ（API接続確認・UI確認用）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function getDemoData(): AvailabilityResult {
  const makeAvail = (display: "available" | "unavailable") =>
    Object.fromEntries(
      PRODUCTS.map((p) => [
        p.sku,
        {
          sku: p.sku,
          pickupDisplay: display,
          pickupSearchQuote: display === "available" ? "今日" : "",
          storePickMessage:
            display === "available"
              ? "本日店舗で受け取り可能"
              : "現在店舗在庫なし",
        },
      ])
    );

  return {
    stores: [
      {
        storeId: "R337",
        storeName: "Apple 表参道",
        city: "港区",
        address: "東京都港区神宮前4-3-2",
        phone: "0120-277-535",
        distance: "0.5 km",
        // Pro Max 256GB: シルバー・オレンジあり、ブルーなし / Pro Max 512GB: 全色あり / Pro 256GB: 全色あり
        availability: {
          ...makeAvail("available"),
          [PRODUCTS[1].sku]: { sku: PRODUCTS[1].sku, pickupDisplay: "unavailable", pickupSearchQuote: "", storePickMessage: "現在店舗在庫なし" },
        },
      },
      {
        storeId: "R293",
        storeName: "Apple 新宿",
        city: "新宿区",
        address: "東京都新宿区新宿3-17-1",
        phone: "0120-277-535",
        distance: "4.2 km",
        // Pro Max 512GB のみ在庫あり
        availability: {
          ...makeAvail("unavailable"),
          [PRODUCTS[3].sku]: { sku: PRODUCTS[3].sku, pickupDisplay: "available", pickupSearchQuote: "今日", storePickMessage: "本日店舗で受け取り可能" },
          [PRODUCTS[4].sku]: { sku: PRODUCTS[4].sku, pickupDisplay: "available", pickupSearchQuote: "今日", storePickMessage: "本日店舗で受け取り可能" },
        },
      },
      {
        storeId: "R462",
        storeName: "Apple 渋谷",
        city: "渋谷区",
        address: "東京都渋谷区神南1-20-1",
        phone: "0120-277-535",
        distance: "5.8 km",
        availability: makeAvail("unavailable"),
      },
      {
        storeId: "R272",
        storeName: "Apple 丸の内",
        city: "千代田区",
        address: "東京都千代田区丸の内2-5-2",
        phone: "0120-277-535",
        distance: "9.1 km",
        availability: makeAvail("unavailable"),
      },
    ],
    fetchedAt: new Date().toISOString(),
    hasAvailable: true,
  };
}
