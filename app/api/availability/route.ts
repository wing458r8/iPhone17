import { NextRequest, NextResponse } from "next/server";
import { fetchAvailability, getDemoData } from "@/lib/apple-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const postalCode =
    request.nextUrl.searchParams.get("postalCode") ?? "1060032";
  const demo = request.nextUrl.searchParams.get("demo") === "true";

  if (!/^\d{7}$/.test(postalCode)) {
    return NextResponse.json(
      { error: "郵便番号は7桁の数字で入力してください（ハイフンなし）" },
      { status: 400 }
    );
  }

  if (demo) {
    return NextResponse.json(
      { ...getDemoData(), isDemo: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const result = await fetchAvailability(postalCode);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch {
    // Apple API が使えない場合はデモデータにフォールバック
    const demo = getDemoData();
    return NextResponse.json(
      { ...demo, isDemo: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
