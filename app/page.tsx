"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AvailabilityResult } from "@/types";
import { PRODUCTS, PRODUCT_GROUPS } from "@/lib/products";
import StoreCard from "@/components/StoreCard";
import NotificationToggle from "@/components/NotificationToggle";
import PostalCodeInput from "@/components/PostalCodeInput";

const POLL_INTERVAL = 5_000; // 5秒

function sendBrowserNotification(storeName: string, colors: string[]) {
  if (Notification.permission !== "granted") return;
  new Notification("📱 iPhone 17 Pro Max 在庫あり！", {
    body: `${storeName} で受け取り可能\n${colors.join("・")}`,
    icon: "/icon-192.png",
    tag: "iphone-available",
    requireInteraction: true,
  });
}

export default function Home() {
  const [postalCode, setPostalCode] = useState("1060032");
  const [data, setData] = useState<AvailabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL / 1000);
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());

  // 前回の在庫状態を記録（通知の重複を防ぐ）
  const prevAvailableStores = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(
    async (code: string, isManual = false) => {
      if (loading && !isManual) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/availability?postalCode=${code}`,
          { cache: "no-store" }
        );
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error ?? "取得に失敗しました");
        }

        const result: AvailabilityResult = json;
        setData(result);
        setLastCheck(new Date());
        setCountdown(POLL_INTERVAL / 1000);

        // 通知チェック
        if (notificationsEnabled) {
          result.stores.forEach((store) => {
            const availableColors = Object.values(store.availability)
              .filter((a) => a.pickupDisplay === "available")
              .map((a) => {
                const product = PRODUCTS.find((p) => p.sku === a.sku);
                return product?.color ?? a.sku;
              });

            const key = store.storeId;
            const wasAvailable = prevAvailableStores.current.has(key);
            const isNowAvailable = availableColors.length > 0;

            if (isNowAvailable && !wasAvailable) {
              sendBrowserNotification(store.storeName, availableColors);
              prevAvailableStores.current.add(key);
            } else if (!isNowAvailable) {
              prevAvailableStores.current.delete(key);
            }
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "不明なエラー";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [loading, notificationsEnabled]
  );

  // 自動ポーリング
  useEffect(() => {
    fetchData(postalCode, true);

    intervalRef.current = setInterval(() => {
      fetchData(postalCode);
    }, POLL_INTERVAL);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? POLL_INTERVAL / 1000 : c - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode]);

  const handlePostalCodeSubmit = (code: string) => {
    setPostalCode(code);
    prevAvailableStores.current.clear();
    setSelectedStoreIds(new Set());
  };

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStoreIds((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  };

  const selectAllAvailable = () => {
    setSelectedStoreIds(new Set(availableStores.map((s) => s.storeId)));
  };

  const clearSelection = () => setSelectedStoreIds(new Set());

  const availableStores =
    data?.stores.filter((s) =>
      Object.values(s.availability).some((a) => a.pickupDisplay === "available")
    ) ?? [];

  const unavailableStores =
    data?.stores.filter(
      (s) =>
        !Object.values(s.availability).some(
          (a) => a.pickupDisplay === "available"
        )
    ) ?? [];

  return (
    <div className="min-h-screen bg-apple-gray-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-apple-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-apple-gray-900 leading-tight">
              iPhone 17 Pro Max
            </h1>
            <p className="text-xs text-apple-gray-400">店内受け取り 在庫トラッカー</p>
          </div>
          <NotificationToggle
            enabled={notificationsEnabled}
            onToggle={setNotificationsEnabled}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 対象商品 */}
        <section className="bg-white rounded-2xl p-5 ring-1 ring-apple-gray-100">
          <p className="text-xs font-medium text-apple-gray-400 uppercase tracking-wider mb-4">
            対象モデル
          </p>
          <div className="space-y-3">
            {PRODUCT_GROUPS.map((group) => (
              <div key={`${group.model}-${group.storage}`}>
                <p className="text-xs text-apple-gray-400 mb-1.5">
                  {group.model} {group.storage}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.products.map((p) => (
                    <span
                      key={p.sku}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-apple-gray-50 ring-1 ring-apple-gray-100 text-xs text-apple-gray-900"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10 flex-shrink-0"
                        style={{ backgroundColor: p.colorCode }}
                      />
                      {p.color}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-apple-gray-400 mt-3">キャリアフリー</p>
        </section>

        {/* エリア検索 */}
        <section>
          <p className="text-xs font-medium text-apple-gray-400 uppercase tracking-wider mb-2 px-1">
            検索エリア
          </p>
          <PostalCodeInput value={postalCode} onSubmit={handlePostalCodeSubmit} />
          <p className="text-xs text-apple-gray-400 mt-2 px-1">
            入力した郵便番号の近くの Apple Store を検索します
          </p>
        </section>

        {/* ステータスバー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {loading ? (
              <>
                <span className="w-2 h-2 rounded-full bg-apple-orange animate-pulse" />
                <span className="text-sm text-apple-gray-400">確認中...</span>
              </>
            ) : error ? (
              <>
                <span className="w-2 h-2 rounded-full bg-apple-red" />
                <span className="text-sm text-apple-red">エラー</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-apple-green" />
                <span className="text-sm text-apple-gray-400">
                  {lastCheck
                    ? `${lastCheck.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} 更新`
                    : "待機中"}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-apple-gray-400">
              次の更新まで {countdown}秒
            </span>
            <button
              onClick={() => fetchData(postalCode, true)}
              disabled={loading}
              className="
                text-xs text-apple-blue font-medium
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:text-apple-blue-hover transition-colors
              "
            >
              今すぐ更新
            </button>
          </div>
        </div>

        {/* デモモードバナー */}
        {data?.isDemo && (
          <div className="bg-amber-50 ring-1 ring-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in">
            <span className="text-lg">🧪</span>
            <div>
              <p className="text-sm font-medium text-amber-800">デモ表示中</p>
              <p className="text-xs text-amber-600">
                Apple APIへの接続がブロックされています。Vercelにデプロイすると実際の在庫が表示されます。
              </p>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 ring-1 ring-red-100 rounded-xl p-4 animate-fade-in">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 在庫あり */}
        {availableStores.length > 0 && (
          <section className="animate-slide-up">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <p className="text-sm font-semibold text-green-700">
                  受け取り可能 — {availableStores.length}店舗
                </p>
              </div>
              {selectedStoreIds.size === availableStores.length ? (
                <button
                  onClick={clearSelection}
                  className="text-xs text-apple-gray-400 hover:text-apple-gray-600 transition-colors"
                >
                  選択解除
                </button>
              ) : (
                <button
                  onClick={selectAllAvailable}
                  className="text-xs text-apple-blue font-medium hover:text-apple-blue-hover transition-colors"
                >
                  すべて選択
                </button>
              )}
            </div>
            <div className="space-y-3">
              {availableStores.map((store) => (
                <StoreCard
                  key={store.storeId}
                  store={store}
                  selected={selectedStoreIds.has(store.storeId)}
                  onToggle={toggleStoreSelection}
                />
              ))}
            </div>

            {/* 選択中バー */}
            {selectedStoreIds.size > 0 && (
              <div className="mt-4 p-4 bg-apple-blue rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
                <p className="text-white text-sm font-medium">
                  {selectedStoreIds.size}店舗を選択中
                </p>
                <a
                  href="https://www.apple.com/jp/shop/buy-iphone/iphone-17-pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 px-4 py-2 bg-white text-apple-blue text-sm font-semibold rounded-xl hover:bg-apple-gray-50 transition-colors"
                >
                  Apple公式で予約
                </a>
              </div>
            )}
          </section>
        )}

        {/* 在庫なし */}
        {data && (
          <section>
            {unavailableStores.length > 0 && (
              <>
                <p className="text-xs font-medium text-apple-gray-400 uppercase tracking-wider mb-3 px-1">
                  {availableStores.length > 0 ? "在庫なし" : "近くの店舗"} —{" "}
                  {unavailableStores.length}店舗
                </p>
                <div className="space-y-3">
                  {unavailableStores.map((store) => (
                    <StoreCard key={store.storeId} store={store} />
                  ))}
                </div>
              </>
            )}

            {data.stores.length === 0 && !loading && (
              <div className="bg-white rounded-2xl p-8 ring-1 ring-apple-gray-100 text-center animate-fade-in">
                <p className="text-apple-gray-400 text-sm">
                  近くに Apple Store が見つかりませんでした
                </p>
                <p className="text-apple-gray-400 text-xs mt-1">
                  別の郵便番号で検索してください
                </p>
              </div>
            )}
          </section>
        )}

        {/* ローディング中（初回） */}
        {loading && !data && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-32 ring-1 ring-apple-gray-100"
              />
            ))}
          </div>
        )}

        {/* フッター */}
        <footer className="text-center pt-4 pb-8">
          <p className="text-xs text-apple-gray-400">
            Apple Store の在庫情報は約5秒ごとに自動更新されます
          </p>
          <p className="text-xs text-apple-gray-400 mt-1">
            実際の購入は{" "}
            <a
              href="https://www.apple.com/jp/shop/buy-iphone"
              target="_blank"
              rel="noopener noreferrer"
              className="text-apple-blue hover:underline"
            >
              Apple公式サイト
            </a>{" "}
            でお手続きください
          </p>
        </footer>
      </main>
    </div>
  );
}
