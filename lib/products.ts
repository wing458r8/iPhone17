import type { ProductConfig } from "@/types";

export const PRODUCTS: ProductConfig[] = [
  // ── iPhone 17 Pro Max 256GB ──────────────────────
  {
    sku: "MFY84J/A",
    name: "iPhone 17 Pro Max 256GB シルバー",
    model: "iPhone 17 Pro Max",
    storage: "256GB",
    color: "シルバー",
    colorCode: "#E8E8E8",
  },
  {
    sku: "MFYA4J/A",
    name: "iPhone 17 Pro Max 256GB ディープブルー",
    model: "iPhone 17 Pro Max",
    storage: "256GB",
    color: "ディープブルー",
    colorCode: "#1B3A5C",
  },
  {
    sku: "MFY94J/A",
    name: "iPhone 17 Pro Max 256GB コズミックオレンジ",
    model: "iPhone 17 Pro Max",
    storage: "256GB",
    color: "コズミックオレンジ",
    colorCode: "#C45C2A",
  },
  // ── iPhone 17 Pro Max 512GB ──────────────────────
  {
    sku: "MFYC4J/A",
    name: "iPhone 17 Pro Max 512GB シルバー",
    model: "iPhone 17 Pro Max",
    storage: "512GB",
    color: "シルバー",
    colorCode: "#E8E8E8",
  },
  {
    sku: "MFYE4J/A",
    name: "iPhone 17 Pro Max 512GB ディープブルー",
    model: "iPhone 17 Pro Max",
    storage: "512GB",
    color: "ディープブルー",
    colorCode: "#1B3A5C",
  },
  {
    sku: "MFYD4J/A",
    name: "iPhone 17 Pro Max 512GB コズミックオレンジ",
    model: "iPhone 17 Pro Max",
    storage: "512GB",
    color: "コズミックオレンジ",
    colorCode: "#C45C2A",
  },
  // ── iPhone 17 Pro 256GB ──────────────────────────
  {
    sku: "MG854J/A",
    name: "iPhone 17 Pro 256GB シルバー",
    model: "iPhone 17 Pro",
    storage: "256GB",
    color: "シルバー",
    colorCode: "#E8E8E8",
  },
  {
    sku: "MG874J/A",
    name: "iPhone 17 Pro 256GB ディープブルー",
    model: "iPhone 17 Pro",
    storage: "256GB",
    color: "ディープブルー",
    colorCode: "#1B3A5C",
  },
  {
    sku: "MG864J/A",
    name: "iPhone 17 Pro 256GB コズミックオレンジ",
    model: "iPhone 17 Pro",
    storage: "256GB",
    color: "コズミックオレンジ",
    colorCode: "#C45C2A",
  },
];

export const PRODUCT_MAP = Object.fromEntries(
  PRODUCTS.map((p) => [p.sku, p])
);

// モデル × ストレージでグループ化
export type ProductGroup = {
  model: string;
  storage: string;
  label: string; // 表示用ラベル
  products: ProductConfig[];
};

export const PRODUCT_GROUPS: ProductGroup[] = [
  {
    model: "iPhone 17 Pro Max",
    storage: "256GB",
    label: "Pro Max 256GB",
    products: PRODUCTS.filter(
      (p) => p.model === "iPhone 17 Pro Max" && p.storage === "256GB"
    ),
  },
  {
    model: "iPhone 17 Pro Max",
    storage: "512GB",
    label: "Pro Max 512GB",
    products: PRODUCTS.filter(
      (p) => p.model === "iPhone 17 Pro Max" && p.storage === "512GB"
    ),
  },
  {
    model: "iPhone 17 Pro",
    storage: "256GB",
    label: "Pro 256GB",
    products: PRODUCTS.filter(
      (p) => p.model === "iPhone 17 Pro" && p.storage === "256GB"
    ),
  },
];
