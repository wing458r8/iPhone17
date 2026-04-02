"use client";

import { useState } from "react";

interface PostalCodeInputProps {
  value: string;
  onSubmit: (code: string) => void;
}

// 主要な都市の郵便番号プリセット
const PRESETS = [
  { label: "東京・表参道", code: "1070062" },
  { label: "東京・新宿", code: "1600022" },
  { label: "東京・銀座", code: "1040061" },
  { label: "大阪・心斎橋", code: "5420086" },
  { label: "福岡・天神", code: "8100001" },
  { label: "名古屋・栄", code: "4600008" },
  { label: "京都", code: "6008411" },
  { label: "仙台", code: "9800021" },
];

export default function PostalCodeInput({ value, onSubmit }: PostalCodeInputProps) {
  const [input, setInput] = useState(value);
  const [showPresets, setShowPresets] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = input.replace(/-/g, "");
    if (/^\d{7}$/.test(cleaned)) {
      onSubmit(cleaned);
      setShowPresets(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-gray-400 text-sm pointer-events-none">
            〒
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setShowPresets(true)}
            placeholder="1060032"
            maxLength={8}
            className="
              w-full pl-9 pr-4 py-2.5 rounded-xl text-sm
              bg-white ring-1 ring-apple-gray-200
              focus:outline-none focus:ring-2 focus:ring-apple-blue
              text-apple-gray-900 placeholder:text-apple-gray-400
              transition-all duration-200
            "
          />
        </div>
        <button
          type="submit"
          className="
            px-4 py-2.5 rounded-xl text-sm font-medium
            bg-apple-blue text-white
            hover:bg-apple-blue-hover
            focus:outline-none focus:ring-2 focus:ring-apple-blue focus:ring-offset-2
            transition-all duration-200
          "
        >
          検索
        </button>
      </form>

      {/* プリセット一覧 */}
      {showPresets && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl ring-1 ring-apple-gray-100 shadow-lg overflow-hidden z-10 animate-fade-in">
          <p className="text-xs text-apple-gray-400 px-4 pt-3 pb-1">
            主要エリア
          </p>
          {PRESETS.map((preset) => (
            <button
              key={preset.code}
              type="button"
              onClick={() => {
                setInput(preset.code);
                onSubmit(preset.code);
                setShowPresets(false);
              }}
              className="
                w-full flex items-center justify-between px-4 py-2.5
                hover:bg-apple-gray-50 transition-colors duration-150
                text-sm text-left
              "
            >
              <span className="text-apple-gray-900">{preset.label}</span>
              <span className="text-apple-gray-400">{preset.code}</span>
            </button>
          ))}
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setShowPresets(false)}
          />
        </div>
      )}
    </div>
  );
}
