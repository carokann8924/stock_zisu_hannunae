from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
import json
import re

PORT = 8000

TARGETS = [
    {"symbol": "NASDAQ", "name": "NASDAQ Composite", "currency": "USD", "url": "https://www.investing.com/indices/nasdaq-composite"},
    {"symbol": "KOSPI", "name": "KOSPI", "currency": "KRW", "url": "https://www.investing.com/indices/kospi"},
    {"symbol": "WTI", "name": "WTI Crude Oil", "currency": "USD", "url": "https://www.investing.com/commodities/crude-oil"},
]

PRICE_PATTERNS = [
    re.compile(r'data-test="instrument-price-last"[^>]*>([^<]+)<'),
    re.compile(r'"last_last"\s*:\s*"([0-9,\.\-]+)"'),
]
CHANGE_PATTERNS = [
    re.compile(r'data-test="instrument-price-change"[^>]*>([^<]+)<'),
    re.compile(r'"last_change"\s*:\s*"([+\-]?[0-9,\.]+)"'),
]



def parse_number(text: str) -> float:
    cleaned = text.replace(",", "").replace("%", "").strip()
    if cleaned.startswith("+"):
        cleaned = cleaned[1:]
    return float(cleaned)



def extract(patterns, html):
    for p in patterns:
        m = p.search(html)
        if m:
            return m.group(1)
    return None



def fetch_index(item):
    req = Request(
        item["url"],
        headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urlopen(req, timeout=10) as resp:
        html = resp.read().decode("utf-8", errors="ignore")

    raw_price = extract(PRICE_PATTERNS, html)
    raw_change = extract(CHANGE_PATTERNS, html) or "0"
    if raw_price is None:
        raise ValueError("price not found")

    return {
        "symbol": item["symbol"],
        "name": item["name"],
        "currency": item["currency"],
        "price": parse_number(raw_price),
        "change": parse_number(raw_change),
    }


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/indices":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            payload = {"indices": [], "errors": []}
            for item in TARGETS:
                try:
                    payload["indices"].append(fetch_index(item))
                except (HTTPError, URLError, TimeoutError, ValueError) as exc:
                    payload["errors"].append(f'{item["symbol"]}: {exc}')

            self.wfile.write(json.dumps(payload).encode("utf-8"))
            return

        return super().do_GET()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Serving at http://localhost:{PORT}")
    server.serve_forever()
