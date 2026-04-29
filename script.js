const indices = [
  { symbol: "NASDAQ", name: "NASDAQ Composite", currency: "USD", price: 18342.21, change: 120.52 },
  { symbol: "KOSPI", name: "KOSPI", currency: "KRW", price: 2758.41, change: -15.78 },
  { symbol: "WTI", name: "WTI Crude Oil", currency: "USD", price: 79.18, change: 1.44 },
];

function formatPrice(value, currency) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(value);
}

function render() {
  const grid = document.getElementById("indices-grid");
  const tpl = document.getElementById("index-card-template");
  grid.innerHTML = "";

  for (const item of indices) {
    const node = tpl.content.cloneNode(true);
    node.querySelector(".name").textContent = item.name;
    node.querySelector(".symbol").textContent = item.symbol;
    node.querySelector(".price").textContent = formatPrice(item.price, item.currency);

    const pct = (item.change / (item.price - item.change)) * 100;
    const changeEl = node.querySelector(".change");
    const direction = item.change >= 0 ? "up" : "down";
    const sign = item.change >= 0 ? "+" : "";
    changeEl.classList.add(direction);
    changeEl.textContent = `${sign}${item.change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;

    grid.appendChild(node);
  }

  document.getElementById("updated-at").textContent = `업데이트: ${new Date().toLocaleString("ko-KR")}`;
}

function refreshWithMockFluctuation() {
  for (const item of indices) {
    const noise = (Math.random() - 0.5) * (item.symbol === "KOSPI" ? 20 : 2);
    item.price = Math.max(1, item.price + noise);
    item.change = noise;
  }
  render();
}

document.getElementById("refresh-btn").addEventListener("click", refreshWithMockFluctuation);

render();
