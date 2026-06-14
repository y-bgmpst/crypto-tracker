const coins = ["bitcoin", "monero", "litecoin", "solana"];
const apiUrl = new URL("https://api.coingecko.com/api/v3/simple/price");
const coinMeta = {
  bitcoin: { name: "Bitcoin", symbol: "BTC" },
  monero: { name: "Monero", symbol: "XMR" },
  litecoin: { name: "Litecoin", symbol: "LTC" },
  solana: { name: "Solana", symbol: "SOL" },
};

apiUrl.search = new URLSearchParams({
  ids: coins.join(","),
  vs_currencies: "usd,eur",
  include_24hr_change: "true",
}).toString();

const refreshButton = document.querySelector("#refreshButton");
const statusText = document.querySelector("#statusText");
const lastUpdated = document.querySelector("#lastUpdated");
const coinCards = document.querySelectorAll(".coin-card");
const rangeButtons = document.querySelectorAll(".range-button");
const chartTitle = document.querySelector("#chartTitle");
const chartStatus = document.querySelector("#chartStatus");
const chartCanvas = document.querySelector("#historyChart");
const chartContext = chartCanvas.getContext("2d");
const statStart = document.querySelector("#statStart");
const statCurrent = document.querySelector("#statCurrent");
const statHigh = document.querySelector("#statHigh");
const statLow = document.querySelector("#statLow");
const chartCache = new Map();
let selectedCoin = null;
let selectedDays = "1";
let activeChartPoints = [];
let historyRequestId = 0;

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});
const percentFormatter = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});
const compactCurrencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 2,
});

async function loadPrices() {
  setLoading(true);

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API antwortet mit Status ${response.status}`);
    }

    const prices = await response.json();
    updateCards(prices);
    statusText.textContent = "Preise erfolgreich geladen";
    statusText.classList.remove("error");
    lastUpdated.textContent = `Zuletzt aktualisiert: ${new Date().toLocaleTimeString("de-DE")}`;
  } catch (error) {
    statusText.textContent = "Preise konnten nicht geladen werden. Bitte spaeter erneut versuchen.";
    statusText.classList.add("error");
    lastUpdated.textContent = "";
    console.error(error);
  } finally {
    setLoading(false);
  }
}

function updateCards(prices) {
  coinCards.forEach((card) => {
    const coinId = card.dataset.coin;
    const coin = prices[coinId];
    const priceElement = card.querySelector("[data-price]");
    const changeElement = card.querySelector("[data-change]");
    const change = coin?.eur_24h_change;

    if (!coin || typeof coin.eur !== "number") {
      priceElement.textContent = "--";
      changeElement.textContent = "24h: --";
      changeElement.className = "change";
      return;
    }

    priceElement.textContent = currencyFormatter.format(coin.eur);

    if (typeof change === "number") {
      changeElement.textContent = `24h: ${percentFormatter.format(change)} %`;
      changeElement.className = `change ${change >= 0 ? "positive" : "negative"}`;
    } else {
      changeElement.textContent = "24h: --";
      changeElement.className = "change";
    }
  });
}

function setLoading(isLoading) {
  refreshButton.disabled = isLoading;
  refreshButton.textContent = isLoading ? "Laedt..." : "Aktualisieren";
}

async function selectCoin(coinId) {
  selectedCoin = coinId;
  coinCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.coin === coinId);
  });

  const meta = coinMeta[coinId];
  chartTitle.textContent = `${meta.name} (${meta.symbol})`;
  await loadHistory();
}

async function loadHistory() {
  if (!selectedCoin) {
    return;
  }

  const requestCoin = selectedCoin;
  const requestDays = selectedDays;
  const requestId = historyRequestId + 1;
  historyRequestId = requestId;
  setChartLoading(true);
  chartStatus.classList.remove("error");
  chartStatus.textContent = "Historie wird geladen...";

  try {
    const cacheKey = `${requestCoin}:${requestDays}`;
    let points = chartCache.get(cacheKey);

    if (!points) {
      const url = new URL(`https://api.coingecko.com/api/v3/coins/${requestCoin}/market_chart`);
      url.search = new URLSearchParams({
        vs_currency: "eur",
        days: requestDays,
      }).toString();

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API antwortet mit Status ${response.status}`);
      }

      const history = await response.json();
      points = Array.isArray(history.prices)
        ? history.prices.map(([time, price]) => ({ time, price })).filter((point) => Number.isFinite(point.price))
        : [];

      chartCache.set(cacheKey, points);
    }

    if (points.length < 2) {
      throw new Error("Zu wenige Datenpunkte fuer diesen Zeitraum.");
    }

    if (requestId !== historyRequestId) {
      return;
    }

    activeChartPoints = points;
    drawChart(points);
    updateChartStats(points);
    chartStatus.textContent = `${getRangeLabel(requestDays)} Historie geladen`;
  } catch (error) {
    if (requestId !== historyRequestId) {
      return;
    }

    activeChartPoints = [];
    clearChart();
    resetChartStats();
    chartStatus.textContent = "Historie konnte nicht geladen werden. Bitte spaeter erneut versuchen.";
    chartStatus.classList.add("error");
    console.error(error);
  } finally {
    if (requestId === historyRequestId) {
      setChartLoading(false);
    }
  }
}

function drawChart(points) {
  const rect = chartCanvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  chartCanvas.width = Math.round(rect.width * pixelRatio);
  chartCanvas.height = Math.round(rect.height * pixelRatio);
  chartContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const padding = {
    top: 20,
    right: 18,
    bottom: 36,
    left: 72,
  };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const prices = points.map((point) => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const firstTime = points[0].time;
  const lastTime = points[points.length - 1].time;
  const timeRange = lastTime - firstTime || 1;

  chartContext.clearRect(0, 0, width, height);
  chartContext.fillStyle = "#ffffff";
  chartContext.fillRect(0, 0, width, height);

  drawGrid(width, height, padding, minPrice, maxPrice);

  const linePoints = points.map((point) => {
    const x = padding.left + ((point.time - firstTime) / timeRange) * chartWidth;
    const y = padding.top + (1 - (point.price - minPrice) / priceRange) * chartHeight;
    return { x, y };
  });
  const isPositive = points[points.length - 1].price >= points[0].price;
  const lineColor = isPositive ? "#15803d" : "#b42318";
  const gradient = chartContext.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  gradient.addColorStop(0, isPositive ? "rgba(21, 128, 61, 0.24)" : "rgba(180, 35, 24, 0.22)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  chartContext.beginPath();
  linePoints.forEach((point, index) => {
    if (index === 0) {
      chartContext.moveTo(point.x, point.y);
    } else {
      chartContext.lineTo(point.x, point.y);
    }
  });
  chartContext.lineTo(linePoints[linePoints.length - 1].x, height - padding.bottom);
  chartContext.lineTo(linePoints[0].x, height - padding.bottom);
  chartContext.closePath();
  chartContext.fillStyle = gradient;
  chartContext.fill();

  chartContext.beginPath();
  linePoints.forEach((point, index) => {
    if (index === 0) {
      chartContext.moveTo(point.x, point.y);
    } else {
      chartContext.lineTo(point.x, point.y);
    }
  });
  chartContext.lineWidth = 3;
  chartContext.lineCap = "round";
  chartContext.lineJoin = "round";
  chartContext.strokeStyle = lineColor;
  chartContext.stroke();

  drawDateLabels(points, width, height, padding);
}

function drawGrid(width, height, padding, minPrice, maxPrice) {
  const steps = 4;
  chartContext.strokeStyle = "#e4e9f0";
  chartContext.fillStyle = "#667085";
  chartContext.font = "12px Inter, system-ui, sans-serif";
  chartContext.textBaseline = "middle";

  for (let index = 0; index <= steps; index += 1) {
    const ratio = index / steps;
    const y = padding.top + ratio * (height - padding.top - padding.bottom);
    const value = maxPrice - ratio * (maxPrice - minPrice);

    chartContext.beginPath();
    chartContext.moveTo(padding.left, y);
    chartContext.lineTo(width - padding.right, y);
    chartContext.stroke();
    chartContext.fillText(compactCurrencyFormatter.format(value), 8, y);
  }
}

function drawDateLabels(points, width, height, padding) {
  const labelPoints = [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]];
  const labelPositions = [padding.left, width / 2, width - padding.right];

  chartContext.fillStyle = "#667085";
  chartContext.font = "12px Inter, system-ui, sans-serif";
  chartContext.textBaseline = "alphabetic";

  labelPoints.forEach((point, index) => {
    const label = formatDateLabel(point.time);
    const textWidth = chartContext.measureText(label).width;
    const x = Math.min(Math.max(labelPositions[index] - textWidth / 2, padding.left), width - padding.right - textWidth);
    chartContext.fillText(label, x, height - 10);
  });
}

function clearChart() {
  const rect = chartCanvas.getBoundingClientRect();
  chartContext.clearRect(0, 0, rect.width, rect.height);
}

function updateChartStats(points) {
  const prices = points.map((point) => point.price);
  statStart.textContent = currencyFormatter.format(points[0].price);
  statCurrent.textContent = currencyFormatter.format(points[points.length - 1].price);
  statHigh.textContent = currencyFormatter.format(Math.max(...prices));
  statLow.textContent = currencyFormatter.format(Math.min(...prices));
}

function resetChartStats() {
  statStart.textContent = "--";
  statCurrent.textContent = "--";
  statHigh.textContent = "--";
  statLow.textContent = "--";
}

function setChartLoading(isLoading) {
  rangeButtons.forEach((button) => {
    button.disabled = isLoading;
  });
}

function getRangeLabel(days) {
  const labels = {
    1: "1D",
    3: "3D",
    7: "1W",
    30: "1M",
    365: "1J",
    max: "All Time",
  };

  return labels[days] || "Chart";
}

function formatDateLabel(timestamp) {
  if (selectedDays === "1") {
    return new Date(timestamp).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const options = { day: "2-digit", month: "2-digit", year: "2-digit" };

  return new Date(timestamp).toLocaleDateString("de-DE", options);
}

coinCards.forEach((card) => {
  card.addEventListener("click", () => selectCoin(card.dataset.coin));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectCoin(card.dataset.coin);
    }
  });
});

rangeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedDays = button.dataset.days;
    rangeButtons.forEach((rangeButton) => {
      rangeButton.classList.toggle("active", rangeButton === button);
    });
    loadHistory();
  });
});

window.addEventListener("resize", () => {
  if (activeChartPoints.length > 1) {
    drawChart(activeChartPoints);
  }
});

refreshButton.addEventListener("click", loadPrices);
loadPrices();
