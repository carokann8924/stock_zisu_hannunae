const INDEX_CONFIG = [
  { symbol: "NASDAQ", name: "NASDAQ Composite", currency: "USD", yahooSymbol: "^IXIC" },
  { symbol: "KOSPI", name: "KOSPI", currency: "KRW", yahooSymbol: "^KS11" },
  { symbol: "WTI", name: "WTI Crude Oil", currency: "USD", yahooSymbol: "CL=F" },
];

const FALLBACK_PRICES = {
  NASDAQ: 18342.21,
  KOSPI: 2758.41,
  WTI: 79.18,
};

const YAHOO_QUOTE_URL = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
  INDEX_CONFIG.map((item) => item.yahooSymbol).join(","),
)}`;

const QUOTE_ENDPOINTS = [
  { name: "Yahoo direct", url: YAHOO_QUOTE_URL },
  { name: "Yahoo via AllOrigins", url: `https://api.allorigins.win/raw?url=${encodeURIComponent(YAHOO_QUOTE_URL)}` },
  { name: "Yahoo via corsproxy.io", url: `https://corsproxy.io/?${encodeURIComponent(YAHOO_QUOTE_URL)}` },
  { name: "Yahoo via codetabs", url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(YAHOO_QUOTE_URL)}` },
];

const FALLBACK_PRICES = {
  NASDAQ: 18342.21,
  KOSPI: 2758.41,
  WTI: 79.18,
};

const YAHOO_QUOTE_URL = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
  INDEX_CONFIG.map((item) => item.yahooSymbol).join(","),
)}`;

function formatPrice(value, currency) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(value);
}

function render(indices, fetchedAt = new Date()) {
  const grid = document.getElementById("indices-grid");
  const tpl = document.getElementById("index-card-template");
  grid.innerHTML = "";

  for (const item of indices) {
    const node = tpl.content.cloneNode(true);
    node.querySelector(".name").textContent = item.name;
    node.querySelector(".symbol").textContent = item.symbol;
    node.querySelector(".price").textContent = formatPrice(item.price, item.currency);

    const base = item.price - item.change;
    const pct = base !== 0 ? (item.change / base) * 100 : 0;
    const changeEl = node.querySelector(".change");
    const direction = item.change >= 0 ? "up" : "down";
    const sign = item.change >= 0 ? "+" : "";
    changeEl.classList.add(direction);
    changeEl.textContent = `${sign}${item.change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;

    grid.appendChild(node);
  }

  document.getElementById("updated-at").textContent = `업데이트: ${fetchedAt.toLocaleString("ko-KR")}`;
}

function setStatus(text, type = "") {
  const status = document.getElementById("status");
  status.textContent = text;
  status.className = type;
}

async function fetchQuoteJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchLiveIndices() {
  let payload;
  let source = "";
  const errors = [];

  for (const endpoint of QUOTE_ENDPOINTS) {
    try {
      payload = await fetchQuoteJson(endpoint.url);
      source = endpoint.name;
      break;
    } catch (error) {
      errors.push(`${endpoint.name}: ${error.message}`);
    }
  }

  if (!payload) {
    throw new Error(errors.join(" / "));
  }

  const result = payload?.quoteResponse?.result ?? [];
  if (result.length === 0) {
    throw new Error(`${source}: 응답 데이터가 비어 있습니다`);
  }

  const bySymbol = new Map(result.map((row) => [row.symbol, row]));
  const mapped = INDEX_CONFIG.map((config) => {
    const row = bySymbol.get(config.yahooSymbol);
    const price = row?.regularMarketPrice ?? FALLBACK_PRICES[config.symbol];
    const change = row?.regularMarketChange ?? 0;

    return {
      symbol: config.symbol,
      name: config.name,
      currency: config.currency,
      price,
      change,
    };
  });

  return { mapped, source };
}

async function refreshLiveData() {
  const button = document.getElementById("refresh-btn");
  button.disabled = true;
  setStatus("실시간 지수를 불러오는 중...");

  try {
    const { mapped, source } = await fetchLiveIndices();
    render(mapped);
    setStatus(`실시간 지수 반영 완료 (${source})`, "ok");
  } catch (error) {
    const fallback = INDEX_CONFIG.map((config) => ({
      symbol: config.symbol,
      name: config.name,
      currency: config.currency,
      price: FALLBACK_PRICES[config.symbol],
      change: 0,
    }));
    render(fallback);
    setStatus(`실시간 지수 조회 실패: ${error.message} (데모값 표시)`, "error");
  } finally {
    button.disabled = false;
  }
}

document.getElementById("refresh-btn").addEventListener("click", refreshLiveData);

refreshLiveData();
