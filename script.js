const coins = ["bitcoin", "monero", "litecoin", "solana"];
const coinMeta = {
  bitcoin: { name: "Bitcoin", symbol: "BTC", paprikaId: "btc-bitcoin", loreId: "90" },
  monero: { name: "Monero", symbol: "XMR", paprikaId: "xmr-monero", loreId: "28" },
  litecoin: { name: "Litecoin", symbol: "LTC", paprikaId: "ltc-litecoin", loreId: "1" },
  solana: { name: "Solana", symbol: "SOL", paprikaId: "sol-solana", loreId: "48543" },
};

const refreshButton = document.querySelector("#refreshButton");
const priceSource = document.querySelector("#priceSource");
const themeToggle = document.querySelector("#themeToggle");
const statusText = document.querySelector("#statusText");
const lastUpdated = document.querySelector("#lastUpdated");
const coinCards = document.querySelectorAll(".coin-card");
const rangeButtons = document.querySelectorAll(".range-button");
const chartTitle = document.querySelector("#chartTitle");
const chartStatus = document.querySelector("#chartStatus");
const chartCanvas = document.querySelector("#historyChart");
const chartContext = chartCanvas.getContext("2d");
const chartTooltip = document.querySelector("#chartTooltip");
const statStart = document.querySelector("#statStart");
const statCurrent = document.querySelector("#statCurrent");
const statHigh = document.querySelector("#statHigh");
const statLow = document.querySelector("#statLow");
const chartCache = new Map();
let selectedCoin = null;
let selectedDays = "1";
let activeChartPoints = [];
let activeLinePoints = [];
let historyRequestId = 0;
let selectedSource = "coingecko";
let activeCurrency = "EUR";

const percentFormatter = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});
const priceProviders = {
  coingecko: {
    label: "CoinGecko",
    currency: "EUR",
    fetchPrices: fetchCoinGeckoPrices,
  },
  coinpaprika: {
    label: "CoinPaprika",
    currency: "EUR",
    fetchPrices: fetchCoinPaprikaPrices,
  },
  coinlore: {
    label: "CoinLore",
    currency: "USD",
    fetchPrices: fetchCoinLorePrices,
  },
};
const eurCurrencyFormatter = getCurrencyFormatter("EUR");
const compactEurCurrencyFormatter = getCompactCurrencyFormatter("EUR");

function getCurrencyFormatter(currency) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

function getCompactCurrencyFormatter(currency) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2,
  });
}

async function loadPrices() {
  setLoading(true);

  try {
    const provider = priceProviders[selectedSource];
    const prices = await provider.fetchPrices();
    activeCurrency = provider.currency;
    updateCards(prices);
    statusText.textContent = `Preise erfolgreich geladen via ${provider.label}`;
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

async function fetchCoinGeckoPrices() {
  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.search = new URLSearchParams({
    ids: coins.join(","),
    vs_currencies: "eur",
    include_24hr_change: "true",
  }).toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CoinGecko antwortet mit Status ${response.status}`);
  }

  return response.json();
}

async function fetchCoinPaprikaPrices() {
  const entries = await Promise.all(coins.map(async (coinId) => {
    const url = new URL(`https://api.coinpaprika.com/v1/tickers/${coinMeta[coinId].paprikaId}`);
    url.search = new URLSearchParams({ quotes: "EUR" }).toString();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinPaprika antwortet mit Status ${response.status}`);
    }

    const ticker = await response.json();
    const quote = ticker.quotes?.EUR;

    return [coinId, {
      eur: quote?.price,
      eur_24h_change: quote?.percent_change_24h,
    }];
  }));

  return Object.fromEntries(entries);
}

async function fetchCoinLorePrices() {
  const url = new URL("https://api.coinlore.net/api/ticker/");
  url.search = new URLSearchParams({
    id: coins.map((coinId) => coinMeta[coinId].loreId).join(","),
  }).toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`CoinLore antwortet mit Status ${response.status}`);
  }

  const tickers = await response.json();

  return coins.reduce((prices, coinId) => {
    const ticker = tickers.find((item) => item.id === coinMeta[coinId].loreId);
    prices[coinId] = {
      usd: Number(ticker?.price_usd),
      usd_24h_change: Number(ticker?.percent_change_24h),
    };
    return prices;
  }, {});
}

function updateCards(prices) {
  const currencyKey = activeCurrency.toLowerCase();
  const changeKey = `${currencyKey}_24h_change`;
  const formatter = getCurrencyFormatter(activeCurrency);

  coinCards.forEach((card) => {
    const coinId = card.dataset.coin;
    const coin = prices[coinId];
    const priceElement = card.querySelector("[data-price]");
    const changeElement = card.querySelector("[data-change]");
    const price = coin?.[currencyKey];
    const change = coin?.[changeKey];

    if (!coin || typeof price !== "number" || Number.isNaN(price)) {
      priceElement.textContent = "--";
      changeElement.textContent = "24h: --";
      changeElement.className = "change";
      return;
    }

    priceElement.textContent = formatter.format(price);

    if (typeof change === "number" && !Number.isNaN(change)) {
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
  hideChartTooltip();
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

function drawChart(points, hoverIndex = null) {
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
  const panelColor = getCssVariable("--panel");
  const lineColorMuted = getCssVariable("--line");
  const textColorMuted = getCssVariable("--muted");

  chartContext.clearRect(0, 0, width, height);
  chartContext.fillStyle = panelColor;
  chartContext.fillRect(0, 0, width, height);

  drawGrid(width, height, padding, minPrice, maxPrice, lineColorMuted, textColorMuted);

  const linePoints = points.map((point) => {
    const x = padding.left + ((point.time - firstTime) / timeRange) * chartWidth;
    const y = padding.top + (1 - (point.price - minPrice) / priceRange) * chartHeight;
    return { x, y };
  });
  activeLinePoints = linePoints;
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

  if (typeof hoverIndex === "number" && linePoints[hoverIndex]) {
    drawHoverMarker(linePoints[hoverIndex], lineColor, padding, height);
  }
}

function drawHoverMarker(point, lineColor, padding, height) {
  chartContext.save();
  chartContext.strokeStyle = getCssVariable("--muted");
  chartContext.lineWidth = 1;
  chartContext.setLineDash([5, 5]);
  chartContext.beginPath();
  chartContext.moveTo(point.x, padding.top);
  chartContext.lineTo(point.x, height - padding.bottom);
  chartContext.stroke();
  chartContext.setLineDash([]);

  chartContext.fillStyle = getCssVariable("--panel");
  chartContext.strokeStyle = lineColor;
  chartContext.lineWidth = 3;
  chartContext.beginPath();
  chartContext.arc(point.x, point.y, 5, 0, Math.PI * 2);
  chartContext.fill();
  chartContext.stroke();
  chartContext.restore();
}

function drawGrid(width, height, padding, minPrice, maxPrice, lineColorMuted, textColorMuted) {
  const steps = 4;
  chartContext.strokeStyle = lineColorMuted;
  chartContext.fillStyle = textColorMuted;
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
    chartContext.fillText(compactEurCurrencyFormatter.format(value), 8, y);
  }
}

function drawDateLabels(points, width, height, padding) {
  const labelPoints = [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]];
  const labelPositions = [padding.left, width / 2, width - padding.right];

  chartContext.fillStyle = getCssVariable("--muted");
  chartContext.font = "12px Inter, system-ui, sans-serif";
  chartContext.textBaseline = "alphabetic";

  labelPoints.forEach((point, index) => {
    const label = formatDateLabel(point.time);
    const textWidth = chartContext.measureText(label).width;
    const x = Math.min(Math.max(labelPositions[index] - textWidth / 2, padding.left), width - padding.right - textWidth);
    chartContext.fillText(label, x, height - 10);
  });
}

function getCssVariable(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function clearChart() {
  const rect = chartCanvas.getBoundingClientRect();
  activeLinePoints = [];
  hideChartTooltip();
  chartContext.clearRect(0, 0, rect.width, rect.height);
}

function updateChartStats(points) {
  const prices = points.map((point) => point.price);
  statStart.textContent = eurCurrencyFormatter.format(points[0].price);
  statCurrent.textContent = eurCurrencyFormatter.format(points[points.length - 1].price);
  statHigh.textContent = eurCurrencyFormatter.format(Math.max(...prices));
  statLow.textContent = eurCurrencyFormatter.format(Math.min(...prices));
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

function handleChartHover(event) {
  if (activeChartPoints.length < 2 || activeLinePoints.length < 2) {
    return;
  }

  const rect = chartCanvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const nearestIndex = findNearestPointIndex(mouseX);

  if (nearestIndex === null) {
    hideChartTooltip();
    drawChart(activeChartPoints);
    return;
  }

  drawChart(activeChartPoints, nearestIndex);
  showChartTooltip(nearestIndex);
}

function findNearestPointIndex(mouseX) {
  const firstPoint = activeLinePoints[0];
  const lastPoint = activeLinePoints[activeLinePoints.length - 1];

  if (mouseX < firstPoint.x || mouseX > lastPoint.x) {
    return null;
  }

  let low = 0;
  let high = activeLinePoints.length - 1;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);

    if (activeLinePoints[middle].x < mouseX) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  const previousIndex = Math.max(low - 1, 0);
  const nextIndex = Math.min(low, activeLinePoints.length - 1);
  const previousDistance = Math.abs(activeLinePoints[previousIndex].x - mouseX);
  const nextDistance = Math.abs(activeLinePoints[nextIndex].x - mouseX);

  return previousDistance <= nextDistance ? previousIndex : nextIndex;
}

function showChartTooltip(index) {
  const point = activeChartPoints[index];
  const linePoint = activeLinePoints[index];
  const wrapRect = chartCanvas.parentElement.getBoundingClientRect();

  chartTooltip.innerHTML = `
    <div class="tooltip-date">${formatTooltipDate(point.time)}</div>
    <div class="tooltip-price">${eurCurrencyFormatter.format(point.price)}</div>
  `;
  chartTooltip.hidden = false;

  const tooltipWidth = chartTooltip.offsetWidth || 148;
  const tooltipHeight = chartTooltip.offsetHeight || 64;
  const left = Math.min(Math.max(linePoint.x + 14, 8), wrapRect.width - tooltipWidth - 8);
  const top = Math.min(Math.max(linePoint.y - tooltipHeight - 14, 8), wrapRect.height - tooltipHeight - 8);

  chartTooltip.style.left = `${left}px`;
  chartTooltip.style.top = `${top}px`;
}

function hideChartTooltip() {
  chartTooltip.hidden = true;
}

function formatTooltipDate(timestamp) {
  const date = new Date(timestamp);

  if (selectedDays === "1") {
    return date.toLocaleString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setTheme(isDark) {
  document.body.classList.toggle("dark-mode", isDark);
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
  localStorage.setItem("crypto-tracker-theme", isDark ? "dark" : "light");

  if (activeChartPoints.length > 1) {
    hideChartTooltip();
    drawChart(activeChartPoints);
  }
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("crypto-tracker-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(savedTheme ? savedTheme === "dark" : prefersDark);
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

priceSource.addEventListener("change", () => {
  selectedSource = priceSource.value;
  loadPrices();
});

themeToggle.addEventListener("click", () => {
  setTheme(!document.body.classList.contains("dark-mode"));
});

window.addEventListener("resize", () => {
  if (activeChartPoints.length > 1) {
    hideChartTooltip();
    drawChart(activeChartPoints);
  }
});

chartCanvas.addEventListener("mousemove", handleChartHover);
chartCanvas.addEventListener("mouseleave", () => {
  hideChartTooltip();

  if (activeChartPoints.length > 1) {
    drawChart(activeChartPoints);
  }
});
refreshButton.addEventListener("click", loadPrices);
loadSavedTheme();
loadPrices();
