const defaultCoinIds = ["bitcoin", "litecoin"];
const supportedCurrencies = ["usd", "eur", "gbp", "jpy", "chf"];
const localeMap = {
  en: "en-US",
  de: "de-DE",
  es: "es-ES",
};

const translations = {
  en: {
    eyebrow: "Live digital asset markets",
    title: "Market overview",
    subtitle: "Track selected assets, compare prices and explore market history.",
    loadingPrices: "Loading prices...",
    pricesLoaded: "Markets updated",
    loadError: "Market data could not be loaded. Please try again later.",
    updatedAt: "Updated {time}",
    addCoin: "Add coin",
    currency: "Currency",
    loadingTop50: "Loading top 50...",
    chooseCoin: "Choose from the top 50",
    noMoreCoins: "All top 50 coins selected",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    autoUpdateOff: "Auto update off",
    autoUpdateOn: "Auto update on",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    watchlistEyebrow: "Watchlist",
    selectedMarkets: "Selected markets",
    rank: "Rank #{rank}",
    removeCoin: "Remove {coin}",
    history: "Price history",
    selectCoin: "Select a coin",
    allTime: "All time",
    chartPrompt: "Choose a market card to load its history.",
    loadingHistory: "Loading price history...",
    historyLoaded: "{range} history loaded",
    historyError: "Price history could not be loaded.",
    start: "Start",
    current: "Current",
    high: "High",
    low: "Low",
    support: "Support",
    donationWallets: "Donation wallets",
    nextUpdate: "Next update in {time}",
    autoDisabled: "Automatic updates are disabled",
  },
  de: {
    eyebrow: "Live-Märkte für digitale Assets",
    title: "Marktübersicht",
    subtitle: "Ausgewählte Assets verfolgen, Preise vergleichen und Markthistorien erkunden.",
    loadingPrices: "Preise werden geladen...",
    pricesLoaded: "Maerkte aktualisiert",
    loadError: "Marktdaten konnten nicht geladen werden. Bitte später erneut versuchen.",
    updatedAt: "Aktualisiert {time}",
    addCoin: "Coin hinzufügen",
    currency: "Währung",
    loadingTop50: "Top 50 werden geladen...",
    chooseCoin: "Aus den Top 50 wählen",
    noMoreCoins: "Alle Top-50-Coins ausgewählt",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    autoUpdateOff: "Auto-Update aus",
    autoUpdateOn: "Auto-Update an",
    refresh: "Aktualisieren",
    refreshing: "Wird aktualisiert...",
    watchlistEyebrow: "Watchlist",
    selectedMarkets: "Ausgewählte Märkte",
    rank: "Rang #{rank}",
    removeCoin: "{coin} entfernen",
    history: "Preishistorie",
    selectCoin: "Coin auswählen",
    allTime: "Gesamt",
    chartPrompt: "Wähle eine Marktkarte, um die Historie zu laden.",
    loadingHistory: "Preishistorie wird geladen...",
    historyLoaded: "{range}-Historie geladen",
    historyError: "Preishistorie konnte nicht geladen werden.",
    start: "Start",
    current: "Aktuell",
    high: "Hoch",
    low: "Tief",
    support: "Support",
    donationWallets: "Spenden-Wallets",
    nextUpdate: "Nächstes Update in {time}",
    autoDisabled: "Automatische Updates sind deaktiviert",
  },
  es: {
    eyebrow: "Mercados de activos digitales en vivo",
    title: "Resumen del mercado",
    subtitle: "Sigue activos seleccionados, compara precios y explora su historial.",
    loadingPrices: "Cargando precios...",
    pricesLoaded: "Mercados actualizados",
    loadError: "No se pudieron cargar los datos del mercado. Inténtalo de nuevo más tarde.",
    updatedAt: "Actualizado {time}",
    addCoin: "Añadir moneda",
    currency: "Moneda",
    loadingTop50: "Cargando las 50 principales...",
    chooseCoin: "Elegir entre las 50 principales",
    noMoreCoins: "Las 50 monedas están seleccionadas",
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    autoUpdateOff: "Actualización auto desactivada",
    autoUpdateOn: "Actualización auto activada",
    refresh: "Actualizar",
    refreshing: "Actualizando...",
    watchlistEyebrow: "Lista de seguimiento",
    selectedMarkets: "Mercados seleccionados",
    rank: "Posición #{rank}",
    removeCoin: "Eliminar {coin}",
    history: "Historial de precios",
    selectCoin: "Selecciona una moneda",
    allTime: "Todo",
    chartPrompt: "Selecciona una tarjeta para cargar su historial.",
    loadingHistory: "Cargando historial de precios...",
    historyLoaded: "Historial de {range} cargado",
    historyError: "No se pudo cargar el historial de precios.",
    start: "Inicio",
    current: "Actual",
    high: "Máximo",
    low: "Mínimo",
    support: "Apoyo",
    donationWallets: "Carteras de donación",
    nextUpdate: "Próxima actualización en {time}",
    autoDisabled: "Las actualizaciones automáticas están desactivadas",
  },
};

const priceGrid = document.querySelector("#priceGrid");
const coinPicker = document.querySelector("#coinPicker");
const fiatCurrency = document.querySelector("#fiatCurrency");
const languageButtons = document.querySelectorAll(".language-button");
const themeToggle = document.querySelector("#themeToggle");
const autoUpdateToggle = document.querySelector("#autoUpdateToggle");
const refreshButton = document.querySelector("#refreshButton");
const statusText = document.querySelector("#statusText");
const lastUpdated = document.querySelector("#lastUpdated");
const selectionCount = document.querySelector("#selectionCount");
const rangeButtons = document.querySelectorAll(".range-button");
const chartTitle = document.querySelector("#chartTitle");
const chartStatus = document.querySelector("#chartStatus");
const chartCoinImage = document.querySelector("#chartCoinImage");
const chartCanvas = document.querySelector("#historyChart");
const chartContext = chartCanvas.getContext("2d");
const chartTooltip = document.querySelector("#chartTooltip");
const statStart = document.querySelector("#statStart");
const statCurrent = document.querySelector("#statCurrent");
const statHigh = document.querySelector("#statHigh");
const statLow = document.querySelector("#statLow");

let currentLanguage = localStorage.getItem("crypto-tracker-language") || "en";
let selectedCurrency = localStorage.getItem("crypto-tracker-currency") || "usd";
let marketCoins = [];
let selectedCoinIds = [...defaultCoinIds];
let selectedChartCoinId = null;
let selectedDays = "1";
let activeChartPoints = [];
let activeLinePoints = [];
let autoUpdateEnabled = localStorage.getItem("crypto-tracker-auto-update") === "on";
let autoUpdateTimer = null;
let nextAutoUpdateAt = null;
let historyRequestId = 0;
let marketStatusKey = "loadingPrices";
let chartStatusKey = "chartPrompt";
let chartStatusVariables = {};
let lastUpdatedAt = null;

const autoUpdateIntervalMs = 5 * 60 * 1000;
const errorBackoffMs = 10 * 60 * 1000;
const chartCache = new Map();

function t(key, variables = {}) {
  const template = translations[currentLanguage]?.[key] || translations.en[key] || key;
  return Object.entries(variables).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}

function getLocale() {
  return localeMap[currentLanguage] || localeMap.en;
}

function getCurrencyFormatter(options = {}) {
  return new Intl.NumberFormat(getLocale(), {
    style: "currency",
    currency: selectedCurrency.toUpperCase(),
    maximumFractionDigits: options.compact ? 2 : selectedCurrency === "jpy" ? 0 : 2,
    ...(options.compact ? { notation: "compact" } : {}),
  });
}

function getPercentFormatter() {
  return new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function applyTranslations() {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.language === currentLanguage);
  });

  updateThemeButton();
  updateAutoUpdateButton();
  setMarketStatus(marketStatusKey);
  setChartStatus(chartStatusKey, chartStatusVariables);
  updateLastUpdatedLabel();
  populateCoinPicker();
  renderMarketCards();

  if (activeChartPoints.length > 1) {
    drawChart(activeChartPoints);
    updateChartStats(activeChartPoints);
  }
}

function setMarketStatus(key) {
  marketStatusKey = key;
  statusText.textContent = t(key);
  statusText.classList.toggle("error", key === "loadError");
}

function setChartStatus(key, variables = {}) {
  chartStatusKey = key;
  chartStatusVariables = variables;
  chartStatus.textContent = t(key, variables);
  chartStatus.classList.toggle("error", key === "historyError");
}

async function loadMarkets({ scheduleNext = true } = {}) {
  setMarketStatus("loadingPrices");
  refreshButton.disabled = true;
  refreshButton.textContent = t("refreshing");

  try {
    const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
    url.search = new URLSearchParams({
      vs_currency: selectedCurrency,
      order: "market_cap_desc",
      per_page: "50",
      page: "1",
      sparkline: "false",
      price_change_percentage: "24h",
    }).toString();

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko returned ${response.status}`);
    }

    marketCoins = await response.json();
    const availableIds = new Set(marketCoins.map((coin) => coin.id));
    selectedCoinIds = selectedCoinIds.filter((id) => availableIds.has(id));

    defaultCoinIds.forEach((id) => {
      if (availableIds.has(id) && selectedCoinIds.length < 2 && !selectedCoinIds.includes(id)) {
        selectedCoinIds.push(id);
      }
    });

    populateCoinPicker();
    renderMarketCards();
    setMarketStatus("pricesLoaded");
    lastUpdatedAt = new Date();
    updateLastUpdatedLabel();

    if (selectedChartCoinId) {
      updateChartIdentity();
    }

    if (scheduleNext) {
      scheduleAutoUpdate(autoUpdateIntervalMs);
    }
  } catch (error) {
    setMarketStatus("loadError");
    console.error(error);

    if (scheduleNext) {
      scheduleAutoUpdate(errorBackoffMs);
    }
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = t("refresh");
  }
}

function updateLastUpdatedLabel() {
  lastUpdated.textContent = lastUpdatedAt
    ? t("updatedAt", {
      time: lastUpdatedAt.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" }),
    })
    : "";
}

function populateCoinPicker() {
  const currentValue = coinPicker.value;
  coinPicker.replaceChildren();

  const availableCoins = marketCoins.filter((coin) => !selectedCoinIds.includes(coin.id));
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = marketCoins.length
    ? t(availableCoins.length ? "chooseCoin" : "noMoreCoins")
    : t("loadingTop50");
  coinPicker.append(placeholder);

  availableCoins.forEach((coin) => {
    const option = document.createElement("option");
    option.value = coin.id;
    option.textContent = `#${coin.market_cap_rank || "-"} ${coin.name} (${coin.symbol.toUpperCase()})`;
    coinPicker.append(option);
  });

  coinPicker.disabled = marketCoins.length === 0 || availableCoins.length === 0;
  coinPicker.value = availableCoins.some((coin) => coin.id === currentValue) ? currentValue : "";
}

function renderMarketCards() {
  if (!marketCoins.length) {
    return;
  }

  const formatter = getCurrencyFormatter();
  const percentFormatter = getPercentFormatter();
  priceGrid.replaceChildren();

  selectedCoinIds.forEach((coinId) => {
    const coin = marketCoins.find((item) => item.id === coinId);
    if (!coin) return;

    const card = document.createElement("article");
    card.className = "coin-card";
    card.tabIndex = 0;
    card.dataset.coin = coin.id;
    card.classList.toggle("active", coin.id === selectedChartCoinId);

    const change = Number(coin.price_change_percentage_24h);
    const changeClass = change >= 0 ? "positive" : "negative";
    const changePrefix = change >= 0 ? "+" : "";

    card.innerHTML = `
      <div class="coin-card-top">
        <div class="coin-identity">
          <img class="coin-image" src="${escapeHtml(coin.image)}" alt="">
          <div>
            <h3 class="coin-name">${escapeHtml(coin.name)}</h3>
            <span class="coin-symbol">${escapeHtml(coin.symbol)}</span>
          </div>
        </div>
        <button class="remove-coin" type="button" aria-label="${escapeHtml(t("removeCoin", { coin: coin.name }))}" title="${escapeHtml(t("removeCoin", { coin: coin.name }))}">×</button>
      </div>
      <div class="coin-price-row">
        <p class="price">${formatter.format(coin.current_price)}</p>
        <p class="change ${changeClass}">${changePrefix}${percentFormatter.format(change)}% · 24h</p>
        <span class="market-rank">${escapeHtml(t("rank", { rank: coin.market_cap_rank || "-" }))}</span>
      </div>
    `;

    card.addEventListener("click", () => selectChartCoin(coin.id));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectChartCoin(coin.id);
      }
    });
    card.querySelector(".remove-coin").addEventListener("click", (event) => {
      event.stopPropagation();
      removeCoin(coin.id);
    });

    priceGrid.append(card);
  });

  selectionCount.textContent = `${selectedCoinIds.length} / 50`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addCoin(coinId) {
  if (!coinId || selectedCoinIds.includes(coinId)) return;
  selectedCoinIds.push(coinId);
  populateCoinPicker();
  renderMarketCards();
  selectChartCoin(coinId);
}

function removeCoin(coinId) {
  selectedCoinIds = selectedCoinIds.filter((id) => id !== coinId);

  if (selectedChartCoinId === coinId) {
    selectedChartCoinId = null;
    activeChartPoints = [];
    activeLinePoints = [];
    clearChart();
    resetChartStats();
    updateChartIdentity();
    setChartStatus("chartPrompt");
  }

  populateCoinPicker();
  renderMarketCards();
}

function selectChartCoin(coinId) {
  selectedChartCoinId = coinId;
  renderMarketCards();
  updateChartIdentity();
  loadHistory();
}

function updateChartIdentity() {
  const coin = marketCoins.find((item) => item.id === selectedChartCoinId);

  if (!coin) {
    chartTitle.textContent = t("selectCoin");
    chartCoinImage.hidden = true;
    chartCoinImage.removeAttribute("src");
    return;
  }

  chartTitle.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
  chartCoinImage.src = coin.image;
  chartCoinImage.alt = `${coin.name} logo`;
  chartCoinImage.hidden = false;
}

async function loadHistory() {
  if (!selectedChartCoinId) return;

  const requestId = ++historyRequestId;
  const requestCoinId = selectedChartCoinId;
  const requestDays = selectedDays;
  const cacheKey = `${requestCoinId}:${selectedCurrency}:${requestDays}`;
  setChartLoading(true);
  hideChartTooltip();
  setChartStatus("loadingHistory");

  try {
    let points = chartCache.get(cacheKey);

    if (!points) {
      const url = new URL(`https://api.coingecko.com/api/v3/coins/${requestCoinId}/market_chart`);
      url.search = new URLSearchParams({
        vs_currency: selectedCurrency,
        days: requestDays,
      }).toString();

      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinGecko returned ${response.status}`);

      const data = await response.json();
      points = Array.isArray(data.prices)
        ? data.prices.map(([time, price]) => ({ time, price })).filter((point) => Number.isFinite(point.price))
        : [];
      chartCache.set(cacheKey, points);
    }

    if (points.length < 2) throw new Error("Not enough history points");
    if (requestId !== historyRequestId) return;

    activeChartPoints = points;
    drawChart(points);
    updateChartStats(points);
    setChartStatus("historyLoaded", { range: getRangeLabel(requestDays) });
  } catch (error) {
    if (requestId !== historyRequestId) return;
    activeChartPoints = [];
    activeLinePoints = [];
    clearChart();
    resetChartStats();
    setChartStatus("historyError");
    console.error(error);
  } finally {
    if (requestId === historyRequestId) setChartLoading(false);
  }
}

function setChartLoading(loading) {
  rangeButtons.forEach((button) => {
    button.disabled = loading;
  });
}

function getRangeLabel(days) {
  if (days === "max") return t("allTime");
  const suffix = days === "365" ? "Y" : Number(days) >= 7 ? Number(days) === 7 ? "W" : "M" : "D";
  const value = days === "365" || days === "30" || days === "7" ? 1 : days;
  return `${value}${suffix}`;
}

function drawChart(points, hoverIndex = null) {
  const rect = chartCanvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  chartCanvas.width = Math.round(rect.width * pixelRatio);
  chartCanvas.height = Math.round(rect.height * pixelRatio);
  chartContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 18, right: 18, bottom: 38, left: width < 560 ? 58 : 76 };
  const chartWidth = Math.max(1, width - padding.left - padding.right);
  const chartHeight = Math.max(1, height - padding.top - padding.bottom);
  const prices = points.map((point) => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const firstTime = points[0].time;
  const lastTime = points[points.length - 1].time;
  const timeRange = lastTime - firstTime || 1;
  const panelColor = getCssVariable("--panel");
  const gridColor = getCssVariable("--line");
  const mutedColor = getCssVariable("--muted");

  chartContext.clearRect(0, 0, width, height);
  chartContext.fillStyle = panelColor;
  chartContext.fillRect(0, 0, width, height);
  drawGrid(width, height, padding, minPrice, maxPrice, gridColor, mutedColor);

  const linePoints = points.map((point) => ({
    x: padding.left + ((point.time - firstTime) / timeRange) * chartWidth,
    y: padding.top + (1 - (point.price - minPrice) / priceRange) * chartHeight,
  }));
  activeLinePoints = linePoints;

  const positive = points.at(-1).price >= points[0].price;
  const lineColor = positive ? getCssVariable("--positive") : getCssVariable("--negative");
  const gradient = chartContext.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  gradient.addColorStop(0, positive ? "rgba(21, 128, 61, 0.22)" : "rgba(180, 35, 24, 0.2)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  chartContext.beginPath();
  linePoints.forEach((point, index) => index ? chartContext.lineTo(point.x, point.y) : chartContext.moveTo(point.x, point.y));
  chartContext.lineTo(linePoints.at(-1).x, height - padding.bottom);
  chartContext.lineTo(linePoints[0].x, height - padding.bottom);
  chartContext.closePath();
  chartContext.fillStyle = gradient;
  chartContext.fill();

  chartContext.beginPath();
  linePoints.forEach((point, index) => index ? chartContext.lineTo(point.x, point.y) : chartContext.moveTo(point.x, point.y));
  chartContext.strokeStyle = lineColor;
  chartContext.lineWidth = 2.5;
  chartContext.lineCap = "round";
  chartContext.lineJoin = "round";
  chartContext.stroke();
  drawDateLabels(points, width, height, padding, mutedColor);

  if (Number.isInteger(hoverIndex) && linePoints[hoverIndex]) {
    drawHoverMarker(linePoints[hoverIndex], lineColor, padding, height);
  }
}

function drawGrid(width, height, padding, minPrice, maxPrice, gridColor, mutedColor) {
  const formatter = getCurrencyFormatter({ compact: true });
  chartContext.font = "12px Inter, system-ui, sans-serif";
  chartContext.textBaseline = "middle";

  for (let index = 0; index <= 4; index += 1) {
    const ratio = index / 4;
    const y = padding.top + ratio * (height - padding.top - padding.bottom);
    const value = maxPrice - ratio * (maxPrice - minPrice);
    chartContext.strokeStyle = gridColor;
    chartContext.beginPath();
    chartContext.moveTo(padding.left, y);
    chartContext.lineTo(width - padding.right, y);
    chartContext.stroke();
    chartContext.fillStyle = mutedColor;
    chartContext.fillText(formatter.format(value), 5, y);
  }
}

function drawDateLabels(points, width, height, padding, mutedColor) {
  const samples = [points[0], points[Math.floor(points.length / 2)], points.at(-1)];
  const positions = [padding.left, width / 2, width - padding.right];
  chartContext.fillStyle = mutedColor;
  chartContext.font = "12px Inter, system-ui, sans-serif";
  chartContext.textBaseline = "alphabetic";

  samples.forEach((point, index) => {
    const label = formatChartDate(point.time, true);
    const textWidth = chartContext.measureText(label).width;
    const x = Math.min(Math.max(positions[index] - textWidth / 2, padding.left), width - padding.right - textWidth);
    chartContext.fillText(label, x, height - 10);
  });
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

function handleChartHover(event) {
  if (activeChartPoints.length < 2 || activeLinePoints.length < 2) return;
  const rect = chartCanvas.getBoundingClientRect();
  const index = findNearestPointIndex(event.clientX - rect.left);

  if (index === null) {
    hideChartTooltip();
    drawChart(activeChartPoints);
    return;
  }

  drawChart(activeChartPoints, index);
  showChartTooltip(index);
}

function findNearestPointIndex(mouseX) {
  if (mouseX < activeLinePoints[0].x || mouseX > activeLinePoints.at(-1).x) return null;
  let low = 0;
  let high = activeLinePoints.length - 1;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (activeLinePoints[middle].x < mouseX) low = middle + 1;
    else high = middle;
  }

  const previous = Math.max(0, low - 1);
  return Math.abs(activeLinePoints[previous].x - mouseX) <= Math.abs(activeLinePoints[low].x - mouseX)
    ? previous
    : low;
}

function showChartTooltip(index) {
  const point = activeChartPoints[index];
  const linePoint = activeLinePoints[index];
  const wrapRect = chartCanvas.parentElement.getBoundingClientRect();
  chartTooltip.innerHTML = `
    <div class="tooltip-date">${escapeHtml(formatChartDate(point.time, false))}</div>
    <div class="tooltip-price">${escapeHtml(getCurrencyFormatter().format(point.price))}</div>
  `;
  chartTooltip.hidden = false;

  const width = chartTooltip.offsetWidth || 150;
  const height = chartTooltip.offsetHeight || 62;
  chartTooltip.style.left = `${Math.min(Math.max(linePoint.x + 14, 8), wrapRect.width - width - 8)}px`;
  chartTooltip.style.top = `${Math.min(Math.max(linePoint.y - height - 14, 8), wrapRect.height - height - 8)}px`;
}

function hideChartTooltip() {
  chartTooltip.hidden = true;
}

function formatChartDate(timestamp, axisLabel) {
  const date = new Date(timestamp);
  if (selectedDays === "1") {
    return date.toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleString(getLocale(), axisLabel
    ? { day: "2-digit", month: "2-digit", year: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function updateChartStats(points) {
  const prices = points.map((point) => point.price);
  const formatter = getCurrencyFormatter();
  statStart.textContent = formatter.format(points[0].price);
  statCurrent.textContent = formatter.format(points.at(-1).price);
  statHigh.textContent = formatter.format(Math.max(...prices));
  statLow.textContent = formatter.format(Math.min(...prices));
}

function resetChartStats() {
  [statStart, statCurrent, statHigh, statLow].forEach((element) => {
    element.textContent = "--";
  });
}

function clearChart() {
  const rect = chartCanvas.getBoundingClientRect();
  chartContext.clearRect(0, 0, rect.width, rect.height);
  hideChartTooltip();
}

function getCssVariable(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function setTheme(isDark) {
  document.body.classList.toggle("dark-mode", isDark);
  themeToggle.setAttribute("aria-pressed", String(isDark));
  localStorage.setItem("crypto-tracker-theme", isDark ? "dark" : "light");
  updateThemeButton();

  if (activeChartPoints.length > 1) drawChart(activeChartPoints);
}

function updateThemeButton() {
  themeToggle.textContent = t(document.body.classList.contains("dark-mode") ? "lightMode" : "darkMode");
}

function setAutoUpdate(enabled) {
  autoUpdateEnabled = enabled;
  autoUpdateToggle.setAttribute("aria-pressed", String(enabled));
  localStorage.setItem("crypto-tracker-auto-update", enabled ? "on" : "off");
  updateAutoUpdateButton();

  if (enabled) scheduleAutoUpdate(autoUpdateIntervalMs);
  else clearAutoUpdate();
}

function updateAutoUpdateButton() {
  autoUpdateToggle.textContent = t(autoUpdateEnabled ? "autoUpdateOn" : "autoUpdateOff");
}

function scheduleAutoUpdate(delay) {
  if (!autoUpdateEnabled) return;
  clearAutoUpdate();
  nextAutoUpdateAt = Date.now() + delay;
  autoUpdateTimer = window.setTimeout(() => {
    if (document.hidden) scheduleAutoUpdate(60 * 1000);
    else loadMarkets({ scheduleNext: true });
  }, delay);
}

function clearAutoUpdate() {
  if (autoUpdateTimer) window.clearTimeout(autoUpdateTimer);
  autoUpdateTimer = null;
  nextAutoUpdateAt = null;
  autoUpdateToggle.title = t("autoDisabled");
}

function updateAutoUpdateTitle() {
  if (!autoUpdateEnabled || !nextAutoUpdateAt) {
    autoUpdateToggle.title = t("autoDisabled");
    return;
  }

  const seconds = Math.max(0, Math.ceil((nextAutoUpdateAt - Date.now()) / 1000));
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  autoUpdateToggle.title = t("nextUpdate", { time });
}

coinPicker.addEventListener("change", () => {
  addCoin(coinPicker.value);
  coinPicker.value = "";
});

fiatCurrency.addEventListener("change", () => {
  selectedCurrency = fiatCurrency.value;
  localStorage.setItem("crypto-tracker-currency", selectedCurrency);
  chartCache.clear();
  clearAutoUpdate();
  loadMarkets();
  if (selectedChartCoinId) loadHistory();
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentLanguage = button.dataset.language;
    localStorage.setItem("crypto-tracker-language", currentLanguage);
    applyTranslations();
  });
});

rangeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedDays = button.dataset.days;
    rangeButtons.forEach((item) => item.classList.toggle("active", item === button));
    loadHistory();
  });
});

themeToggle.addEventListener("click", () => setTheme(!document.body.classList.contains("dark-mode")));
autoUpdateToggle.addEventListener("click", () => setAutoUpdate(!autoUpdateEnabled));
refreshButton.addEventListener("click", () => loadMarkets());
chartCanvas.addEventListener("mousemove", handleChartHover);
chartCanvas.addEventListener("mouseleave", () => {
  hideChartTooltip();
  if (activeChartPoints.length > 1) drawChart(activeChartPoints);
});

window.addEventListener("resize", () => {
  hideChartTooltip();
  if (activeChartPoints.length > 1) drawChart(activeChartPoints);
});

document.addEventListener("visibilitychange", () => {
  if (autoUpdateEnabled && !document.hidden && (!nextAutoUpdateAt || Date.now() >= nextAutoUpdateAt)) {
    loadMarkets();
  }
});

window.setInterval(updateAutoUpdateTitle, 1000);

if (!supportedCurrencies.includes(selectedCurrency)) selectedCurrency = "usd";
fiatCurrency.value = selectedCurrency;
const savedTheme = localStorage.getItem("crypto-tracker-theme");
setTheme(savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
setAutoUpdate(autoUpdateEnabled);
applyTranslations();
loadMarkets();
