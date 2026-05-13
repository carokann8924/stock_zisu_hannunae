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

async function fetchLiveIndices() {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
    INDEX_CONFIG.map((item) => item.yahooSymbol).join(","),
  )}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`시세 API 호출 실패 (${response.status})`);
  }

  const payload = await response.json();
  const result = payload?.quoteResponse?.result ?? [];
  const bySymbol = new Map(result.map((row) => [row.symbol, row]));

  return INDEX_CONFIG.map((config) => {
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
}

async function refreshLiveData() {
  const button = document.getElementById("refresh-btn");
  button.disabled = true;
  setStatus("실시간 지수를 불러오는 중...");

  try {
    const indices = await fetchLiveIndices();
    render(indices);
    setStatus("실시간 지수 반영 완료", "ok");
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
