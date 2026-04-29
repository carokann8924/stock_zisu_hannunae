const indicesConfig = [
  { symbol: "^IXIC", label: "NASDAQ", name: "NASDAQ Composite", currency: "USD" },
  { symbol: "^KS11", label: "KOSPI", name: "KOSPI", currency: "KRW" },
  { symbol: "CL=F", label: "WTI", name: "WTI Crude Oil", currency: "USD" },
];

const REFRESH_INTERVAL_MS = 60_000;

function formatPrice(value, currency) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(value);
}

function formatChange(change, pct) {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
}

function renderIndices(indices) {
  const grid = document.getElementById("indices-grid");
  const tpl = document.getElementById("index-card-template");
  grid.innerHTML = "";

  for (const item of indices) {
    const node = tpl.content.cloneNode(true);
    node.querySelector(".name").textContent = item.name;
    node.querySelector(".symbol").textContent = item.label;

    const priceEl = node.querySelector(".price");
    const changeEl = node.querySelector(".change");

    if (!item.ok) {
      priceEl.textContent = "데이터 로드 실패";
      changeEl.textContent = item.errorMessage ?? "잠시 후 다시 시도하세요.";
      changeEl.classList.add("down");
      grid.appendChild(node);
      continue;
    }

    priceEl.textContent = formatPrice(item.price, item.currency);
    changeEl.textContent = formatChange(item.change, item.changePct);
    changeEl.classList.add(item.change >= 0 ? "up" : "down");
    grid.appendChild(node);
  }

  document.getElementById("updated-at").textContent = `업데이트: ${new Date().toLocaleString("ko-KR")}`;
}

async function fetchQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const meta = result?.meta;

  if (!meta) {
    throw new Error("Invalid response format");
  }

  const price = Number(meta.regularMarketPrice);
  const previousClose = Number(meta.chartPreviousClose ?? meta.previousClose);

  if (!Number.isFinite(price) || !Number.isFinite(previousClose) || previousClose === 0) {
    throw new Error("Price data unavailable");
  }

  const change = price - previousClose;
  const changePct = (change / previousClose) * 100;

  return { price, change, changePct };
}

async function loadIndices() {
  const results = await Promise.all(
    indicesConfig.map(async (config) => {
      try {
        const quote = await fetchQuote(config.symbol);
        return { ...config, ...quote, ok: true };
      } catch (error) {
        return {
          ...config,
          ok: false,
          errorMessage: `오류: ${error.message}`,
        };
      }
    })
  );

  renderIndices(results);
}

function init() {
  const refreshBtn = document.getElementById("refresh-btn");
  refreshBtn.addEventListener("click", loadIndices);

  loadIndices();
  setInterval(loadIndices, REFRESH_INTERVAL_MS);
}

init();
