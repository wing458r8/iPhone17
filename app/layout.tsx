import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iPhone 17 Pro Max 在庫トラッカー",
  description:
    "iPhone 17 Pro Max 256GB の Apple Store 店内受け取り在庫をリアルタイムで確認",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📱</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-apple-gray-50 font-sans">{children}</body>
    </html>
  );
}
