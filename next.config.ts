import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Apple APIへのリクエスト時にヘッダーを設定
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
