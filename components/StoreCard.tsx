"use client";

import type { Store } from "@/types";
import { PRODUCT_MAP, PRODUCT_GROUPS } from "@/lib/products";

interface StoreCardProps {
  store: Store;
  selected?: boolean;
  onToggle?: (storeId: string) => void;
}

function AvailabilityDot({ display }: { display: string }) {
  if (display === "available") {
    return (
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
    );
  }
  return (
    <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
  );
}

export default function StoreCard({ store, selected, onToggle }: StoreCardProps) {
  const hasAnyAvailable = Object.values(store.availability).some(
    (a) => a.pickupDisplay === "available"
  );
  const isSelectable = hasAnyAvailable && onToggle;

  return (
    <div
      onClick={() => isSelectable && onToggle(store.storeId)}
      className={`
        bg-white rounded-2xl overflow-hidden transition-all duration-200
        ${isSelectable ? "cursor-pointer active:scale-[0.99]" : ""}
        ${selected
          ? "ring-2 ring-apple-blue shadow-md shadow-blue-50"
          : hasAnyAvailable
          ? "ring-1 ring-green-200 shadow-md shadow-green-50"
          : "ring-1 ring-apple-gray-100 shadow-sm"
        }
      `}
    >
      {/* ストア情報ヘッダー */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {isSelectable && (
              <span
                className={`
                  flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
                  ${selected ? "bg-apple-blue border-apple-blue" : "border-apple-gray-200 bg-white"}
                `}
              >
                {selected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-apple-gray-900 text-base leading-tight">
                {store.storeName}
              </h3>
              <p className="text-apple-gray-400 text-sm mt-0.5">{store.city}</p>
            </div>
          </div>
          {store.distance && (
            <span className="flex-shrink-0 text-xs text-apple-gray-400 mt-0.5">
              {store.distance}
            </span>
          )}
        </div>
      </div>

      {/* モデルグループ別在庫 */}
      <div className="divide-y divide-apple-gray-100">
        {PRODUCT_GROUPS.map((group) => {
          const groupItems = group.products
            .map((p) => ({ product: p, avail: store.availability[p.sku] }))
            .filter(({ avail }) => avail && PRODUCT_MAP[avail.sku]);

          if (groupItems.length === 0) return null;

          const groupAvailable = groupItems.some(
            ({ avail }) => avail.pickupDisplay === "available"
          );

          return (
            <div key={`${group.model}-${group.storage}`} className="px-5 py-3">
              {/* グループ見出し */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-apple-gray-400">
                  {group.label}
                </p>
                {groupAvailable ? (
                  <span className="text-xs text-green-600 font-medium">在庫あり</span>
                ) : (
                  <span className="text-xs text-apple-gray-400">在庫なし</span>
                )}
              </div>

              {/* カラー行 */}
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {groupItems.map(({ product, avail }) => (
                  <div key={product.sku} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full ring-1 ring-black/10 flex-shrink-0"
                      style={{ backgroundColor: product.colorCode }}
                    />
                    <span
                      className={`text-xs ${
                        avail.pickupDisplay === "available"
                          ? "text-apple-gray-900 font-medium"
                          : "text-apple-gray-400"
                      }`}
                    >
                      {product.color}
                    </span>
                    <AvailabilityDot display={avail.pickupDisplay} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
