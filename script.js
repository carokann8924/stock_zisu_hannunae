const INDEX_CONFIG = [
  { symbol: "NASDAQ", name: "NASDAQ Composite", currency: "USD" },
  { symbol: "KOSPI", name: "KOSPI", currency: "KRW" },
  { symbol: "WTI", name: "WTI Crude Oil", currency: "USD" },
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
  const response = await fetch("/api/indices", { cache: "no-store" });
  if (!response.ok) throw new Error(`서버 응답 실패 (${response.status})`);

  const payload = await response.json();
  if (!Array.isArray(payload.indices) || payload.indices.length === 0) {
    const detail = payload.errors?.join(" / ") || "수집 데이터 없음";
    throw new Error(detail);
  }

  const bySymbol = new Map(payload.indices.map((row) => [row.symbol, row]));
  const mapped = INDEX_CONFIG.map((config) => {
    const row = bySymbol.get(config.symbol);
    return {
      symbol: config.symbol,
      name: config.name,
      currency: config.currency,
      price: row?.price ?? FALLBACK_PRICES[config.symbol],
      change: row?.change ?? 0,
    };
  });

  return { mapped, errors: payload.errors || [] };
}

async function refreshLiveData() {
  const button = document.getElementById("refresh-btn");
  button.disabled = true;
  setStatus("실시간 지수를 불러오는 중...");

  try {
    const { mapped, errors } = await fetchLiveIndices();
    render(mapped);
    const partial = errors.length > 0 ? ` (일부 실패: ${errors.join(" | ")})` : "";
    setStatus(`실시간 지수 반영 완료${partial}`, "ok");
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
