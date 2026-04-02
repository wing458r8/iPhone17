from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, urlencode
import json

SKUS = [
    "MFY84J/A", "MFYA4J/A", "MFY94J/A",  # Pro Max 256GB
    "MFYC4J/A", "MFYE4J/A", "MFYD4J/A",  # Pro Max 512GB
    "MG854J/A", "MG874J/A", "MG864J/A",  # Pro 256GB
]


def build_url(postal_code: str) -> str:
    params = {
        "pl": "true",
        "mts.0": "compact",
        "cppart": "UNLOCKED/JP",
        "location": postal_code,
    }
    for i, sku in enumerate(SKUS):
        params[f"parts.{i}"] = sku
    return "https://www.apple.com/jp/shop/fulfillment-messages?" + urlencode(params)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        postal_code = (params.get("postalCode") or ["1060032"])[0]

        if not postal_code.isdigit() or len(postal_code) != 7:
            self._respond(400, {"error": "郵便番号は7桁の数字で入力してください"})
            return

        url = build_url(postal_code)

        try:
            # curl_cffi: Chrome の TLS フィンガープリントを完全に模倣
            from curl_cffi import requests as cffi_requests

            resp = cffi_requests.get(
                url,
                impersonate="chrome124",
                headers={
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "Accept-Language": "ja-JP,ja;q=0.9,en-US;q=0.8",
                    "Referer": "https://www.apple.com/jp/shop/buy-iphone",
                    "X-Requested-With": "XMLHttpRequest",
                },
                timeout=10,
            )

            if resp.status_code != 200:
                self._respond(502, {"error": f"Apple API error: {resp.status_code}"})
                return

            # レスポンスをそのまま返す
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(resp.content)

        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _respond(self, status: int, body: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

    def log_message(self, fmt, *args):
        pass  # Vercel のログには stderr が出るので抑制
