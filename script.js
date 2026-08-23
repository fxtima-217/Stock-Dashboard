// The six tickers shown when the page first loads.
const TRENDING_TICKERS = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL"];
const MARKET_INDEXES = [
  { ticker: "^GSPC", name: "S&P 500" },
  { ticker: "^IXIC", name: "NASDAQ Composite" },
  { ticker: "^FTSE", name: "FTSE 100" },
];
// Movers are ranked only within this transparent, widely followed stock set.
const MOVER_TICKERS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "TSLA",
  "JPM",
  "V",
  "XOM",
  "WMT",
  "NFLX",
];

// The browser calls our own Vercel API route. That server-side route contacts
// Yahoo Finance, avoiding browser CORS restrictions and unreliable public proxies.
const STOCK_API_URL = "/api/stock";
const FUNDAMENTALS_API_URL = "/api/fundamentals";

const trendingGrid = document.querySelector("#trending-grid");
const marketOverviewGrid = document.querySelector("#market-overview-grid");
const gainersList = document.querySelector("#gainers-list");
const losersList = document.querySelector("#losers-list");
const searchForm = document.querySelector("#search-form");
const tickerInput = document.querySelector("#ticker-input");
const searchSection = document.querySelector("#search-section");
const searchResult = document.querySelector("#search-result");
const searchButton = searchForm.querySelector("button");
const chartSection = document.querySelector("#chart-section");
const chartTitle = document.querySelector("#chart-title");
const chartCompany = document.querySelector("#chart-company");
const chartContainer = document.querySelector("#chart-container");
const featuredPrice = document.querySelector("#featured-price");
const featuredChange = document.querySelector("#featured-change");
const performanceGrid = document.querySelector("#performance-grid");
const fundamentalsContainer = document.querySelector("#fundamentals-container");
const themeButton = document.querySelector("#theme-button");
const stockRequestCache = new Map();
const performanceRequestCache = new Map();
const fundamentalsRequestCache = new Map();
let latestChartRequest = 0;

/**
 * Fetch one stock from Yahoo Finance and return only the fields the UI needs.
 */
function fetchStock(ticker) {
  const cacheKey = ticker.toUpperCase();

  if (stockRequestCache.has(cacheKey)) {
    return stockRequestCache.get(cacheKey);
  }

  const request = requestStock(cacheKey).catch((error) => {
    stockRequestCache.delete(cacheKey);
    throw error;
  });
  stockRequestCache.set(cacheKey, request);
  return request;
}

async function requestStock(ticker) {
  const requestUrl = `${STOCK_API_URL}?ticker=${encodeURIComponent(ticker)}&range=5d`;

  let response;

  try {
    response = await fetch(requestUrl);
  } catch (error) {
    throw new Error("Could not connect to the stock service. Please try again.");
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    if (response.status === 400 || response.status === 404) {
      throw new Error("Ticker not found. Please check the symbol and try again.");
    }

    throw new Error("The stock service returned an unexpected response.");
  }

  // Yahoo commonly uses a 400 or 404 response for an unknown ticker.
  if (response.status === 400 || response.status === 404) {
    throw new Error("Ticker not found. Please check the symbol and try again.");
  }

  if (!response.ok) {
    throw new Error("The stock service is unavailable right now. Please try again.");
  }

  const result = data?.chart?.result?.[0];
  const meta = result?.meta;

  if (!meta || typeof meta.regularMarketPrice !== "number") {
    throw new Error("Ticker not found. Please check the symbol and try again.");
  }

  const price = meta.regularMarketPrice;
  const timestamps = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];
  const sparklinePoints = timestamps
    .map((timestamp, index) => ({ timestamp, price: closes[index] }))
    .filter((point) => typeof point.price === "number");
  const recentCloses = sparklinePoints.map((point) => point.price);
  const previousClose =
    recentCloses.length > 1
      ? recentCloses[recentCloses.length - 2]
      : meta.regularMarketPreviousClose ?? meta.previousClose ?? meta.chartPreviousClose;
  const percentageChange =
    typeof previousClose === "number" && previousClose !== 0
      ? ((price - previousClose) / previousClose) * 100
      : 0;

  return {
    symbol: meta.symbol || ticker,
    name: meta.longName || meta.shortName || meta.symbol || ticker,
    price,
    percentageChange,
    currency: meta.currency || "USD",
    sparklinePoints,
  };
}

/**
 * Build a stock card with DOM methods so API text is always treated safely.
 */
function createStockCard(stock) {
  const card = document.createElement("article");
  card.className = "stock-card clickable-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Show one month price chart for ${stock.name}`);

  const topRow = document.createElement("div");
  topRow.className = "stock-card-top";

  const ticker = document.createElement("h3");
  ticker.className = "ticker";
  ticker.textContent = stock.symbol;

  const change = document.createElement("span");
  const directionClass =
    stock.percentageChange > 0
      ? "positive"
      : stock.percentageChange < 0
        ? "negative"
        : "neutral";
  change.className = `change ${directionClass}`;
  change.textContent = `${stock.percentageChange >= 0 ? "+" : ""}${stock.percentageChange.toFixed(2)}%`;

  const companyName = document.createElement("p");
  companyName.className = "company-name";
  companyName.textContent = stock.name;
  companyName.title = stock.name;

  const price = document.createElement("p");
  price.className = "price";
  price.textContent = formatPrice(stock.price, stock.currency);

  topRow.append(ticker, change);
  card.append(topRow, companyName, price);

  card.addEventListener("click", () => showStockChart(stock));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showStockChart(stock);
    }
  });

  return card;
}

/**
 * Build a compact, non-interactive card for a major market index.
 */
function createMarketIndexCard(index) {
  const card = document.createElement("article");
  card.className = "market-index-card";

  const topRow = document.createElement("div");
  topRow.className = "market-index-top";

  const name = document.createElement("h3");
  name.textContent = index.displayName;

  const change = document.createElement("span");
  const directionClass =
    index.percentageChange > 0
      ? "positive"
      : index.percentageChange < 0
        ? "negative"
        : "neutral";
  change.className = `change ${directionClass}`;
  change.textContent = `${index.percentageChange >= 0 ? "+" : ""}${index.percentageChange.toFixed(2)}%`;

  const symbol = document.createElement("p");
  symbol.className = "market-index-symbol";
  symbol.textContent = index.symbol;

  const value = document.createElement("p");
  value.className = "market-index-value";
  value.textContent = formatIndexValue(index.price);

  topRow.append(name, change);
  card.append(topRow, symbol, value);

  if (index.sparklinePoints.length > 1) {
    card.append(createSparkline(index.sparklinePoints, index.percentageChange));
  }

  return card;
}

function createSparkline(points, percentageChange) {
  const width = 240;
  const height = 52;
  const prices = points.map((point) => point.price);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const priceRange = highestPrice - lowestPrice || 1;
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  const path = document.createElementNS(svgNamespace, "path");
  const pathData = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = 3 + ((highestPrice - point.price) / priceRange) * (height - 6);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  svg.setAttribute(
    "class",
    `sparkline${percentageChange < 0 ? " negative-sparkline" : ""}`,
  );
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  path.setAttribute("d", pathData);
  svg.append(path);
  return svg;
}

function createMoverRow(stock) {
  const row = document.createElement("button");
  row.className = "mover-row";
  row.type = "button";
  row.setAttribute("aria-label", `Show ${stock.symbol} as the featured stock`);

  const identity = document.createElement("span");
  const symbol = document.createElement("span");
  const name = document.createElement("span");
  symbol.className = "mover-symbol";
  name.className = "mover-name";
  symbol.textContent = stock.symbol;
  name.textContent = stock.name;
  identity.append(symbol, name);

  const price = document.createElement("span");
  price.className = "mover-price";
  price.textContent = formatPrice(stock.price, stock.currency);

  const change = document.createElement("span");
  change.className = `mover-change ${stock.percentageChange >= 0 ? "positive-text" : "negative-text"}`;
  change.textContent = `${stock.percentageChange >= 0 ? "+" : ""}${stock.percentageChange.toFixed(2)}%`;

  row.append(identity, price, change);
  row.addEventListener("click", () => showStockChart(stock));
  return row;
}

/**
 * Fetch one month of daily closing prices for the selected ticker.
 */
async function fetchChartData(ticker) {
  const requestUrl = `${STOCK_API_URL}?ticker=${encodeURIComponent(ticker)}&range=1mo`;

  let response;

  try {
    response = await fetch(requestUrl);
  } catch (error) {
    throw new Error("Could not connect to the stock service. Please try again.");
  }

  if (!response.ok) {
    throw new Error("The chart service is unavailable right now. Please try again.");
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error("The stock service returned an unexpected response.");
  }

  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const closes = result?.indicators?.quote?.[0]?.close;

  if (!timestamps || !closes) {
    throw new Error("No chart data is available for this ticker.");
  }

  // A market can occasionally return a null close, so leave those points out.
  const points = timestamps
    .map((timestamp, index) => ({ timestamp, price: closes[index] }))
    .filter((point) => typeof point.price === "number");

  if (points.length < 2) {
    throw new Error("Not enough chart data is available for this ticker.");
  }

  return points;
}

/**
 * Fetch one year of daily candles and derive analytics from actual Yahoo data.
 */
function fetchPerformanceData(ticker) {
  const cacheKey = ticker.toUpperCase();

  if (performanceRequestCache.has(cacheKey)) {
    return performanceRequestCache.get(cacheKey);
  }

  const request = requestPerformanceData(cacheKey).catch((error) => {
    performanceRequestCache.delete(cacheKey);
    throw error;
  });
  performanceRequestCache.set(cacheKey, request);
  return request;
}

async function requestPerformanceData(ticker) {
  const requestUrl = `${STOCK_API_URL}?ticker=${encodeURIComponent(ticker)}&range=1y`;
  let response;

  try {
    response = await fetch(requestUrl);
  } catch (error) {
    throw new Error("Could not connect to the performance service.");
  }

  if (!response.ok) {
    throw new Error("Performance data is unavailable right now.");
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error("The performance service returned an unexpected response.");
  }

  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];

  if (!timestamps || !quote?.close) {
    throw new Error("No one-year performance data is available for this ticker.");
  }

  const candles = timestamps
    .map((timestamp, index) => ({
      timestamp,
      close: quote.close[index],
      high: quote.high?.[index],
      low: quote.low?.[index],
      volume: quote.volume?.[index],
    }))
    .filter((candle) => typeof candle.close === "number");

  if (candles.length < 2) {
    throw new Error("Not enough performance data is available for this ticker.");
  }

  return calculatePerformanceAnalytics(candles);
}

function calculatePerformanceAnalytics(candles) {
  const latestClose = candles[candles.length - 1].close;
  const previousClose = candles[candles.length - 2].close;
  const highs = candles
    .map((candle) => candle.high)
    .filter((value) => typeof value === "number");
  const lows = candles
    .map((candle) => candle.low)
    .filter((value) => typeof value === "number");
  const volumes = candles
    .map((candle) => candle.volume)
    .filter((value) => typeof value === "number" && value >= 0);

  return {
    oneDay: calculatePercentageReturn(latestClose, previousClose),
    oneMonth: calculatePeriodReturn(candles, 1),
    threeMonths: calculatePeriodReturn(candles, 3),
    sixMonths: calculatePeriodReturn(candles, 6),
    oneYear: calculatePeriodReturn(candles, 12),
    fiftyTwoWeekHigh: highs.length > 0 ? Math.max(...highs) : null,
    fiftyTwoWeekLow: lows.length > 0 ? Math.min(...lows) : null,
    averageVolume:
      volumes.length > 0
        ? volumes.reduce((total, volume) => total + volume, 0) / volumes.length
        : null,
  };
}

function calculatePeriodReturn(candles, months) {
  const latestCandle = candles[candles.length - 1];
  const targetTimestamp = subtractMonths(latestCandle.timestamp, months);
  let baselineCandle = null;

  // Prefer the final trading session on or before the calendar cutoff.
  for (const candle of candles) {
    if (candle.timestamp <= targetTimestamp) {
      baselineCandle = candle;
    } else {
      break;
    }
  }

  // A one-year response can begin just after the cutoff on a weekend or holiday.
  baselineCandle ||= candles[0];
  return calculatePercentageReturn(latestCandle.close, baselineCandle.close);
}

function subtractMonths(timestamp, months) {
  const date = new Date(timestamp * 1000);
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  const lastDayOfTargetMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
  return Math.floor(date.getTime() / 1000);
}

function calculatePercentageReturn(latestValue, earlierValue) {
  if (
    typeof latestValue !== "number" ||
    typeof earlierValue !== "number" ||
    earlierValue === 0
  ) {
    return null;
  }

  return ((latestValue - earlierValue) / earlierValue) * 100;
}

function fetchFundamentals(ticker) {
  const cacheKey = ticker.toUpperCase();

  if (fundamentalsRequestCache.has(cacheKey)) {
    return fundamentalsRequestCache.get(cacheKey);
  }

  const request = requestFundamentals(cacheKey).catch((error) => {
    fundamentalsRequestCache.delete(cacheKey);
    throw error;
  });
  fundamentalsRequestCache.set(cacheKey, request);
  return request;
}

async function requestFundamentals(ticker) {
  let response;

  try {
    response = await fetch(
      `${FUNDAMENTALS_API_URL}?ticker=${encodeURIComponent(ticker)}`,
    );
  } catch (error) {
    throw new Error("Could not connect to the fundamentals service.");
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error("The fundamentals service returned an unexpected response.");
  }

  if (!response.ok) {
    return { available: false, reason: "request_failed" };
  }

  return data;
}

async function loadFundamentalsForStock(stock, requestId) {
  if (stock.symbol.startsWith("^")) {
    fundamentalsContainer.replaceChildren(
      createMessage("Company fundamentals are not available for market indexes."),
    );
    return;
  }

  fundamentalsContainer.replaceChildren(
    createMessage(`Loading ${stock.symbol} fundamentals…`),
  );

  try {
    const fundamentals = await fetchFundamentals(stock.symbol);

    if (requestId !== latestChartRequest) return;

    if (!fundamentals?.available) {
      renderFundamentalsUnavailable();
      return;
    }

    renderFundamentals(fundamentals);
  } catch (error) {
    if (requestId !== latestChartRequest) return;
    renderFundamentalsUnavailable();
  }
}

function renderFundamentalsUnavailable() {
  fundamentalsContainer.replaceChildren(
    createMessage("Fundamentals unavailable for this ticker."),
  );
}

function renderFundamentals(fundamentals) {
  const company = fundamentals.company || {};
  const snapshot = fundamentals.financialSnapshot || {};
  const valuation = fundamentals.valuation || {};
  const content = document.createElement("div");
  content.className = "company-overview-content";

  const companyHeader = document.createElement("div");
  companyHeader.className = "company-header";
  const companyName = document.createElement("h4");
  companyName.textContent = company.name || "Not available";
  const metadataRow = document.createElement("div");
  metadataRow.className = "company-metadata-row";
  metadataRow.append(
    createCompanyBadge(company.ticker || "—", "Ticker"),
    createCompanyBadge(company.exchange || "Not available", "Exchange"),
    createCompanyBadge(company.sector || "Not available", "Sector"),
    createCompanyBadge(company.industry || "Not available", "Industry"),
  );
  companyHeader.append(companyName, metadataRow);

  const descriptionArea = document.createElement("div");
  descriptionArea.className = "company-description-area";
  const description = document.createElement("p");
  description.id = "company-description";
  description.className = "company-description is-collapsed";
  description.textContent = company.description || "Business description not available.";
  descriptionArea.append(description);

  if (company.description) {
    descriptionArea.append(createDescriptionToggle(description));
  }

  const financialGroup = createFundamentalsGroup("Financial Snapshot", [
    createFinancialMetric(
      "Market capitalisation",
      formatCompactCurrency(snapshot.marketCap, snapshot.currency),
      formatExactCurrency(snapshot.marketCap, snapshot.currency),
    ),
    createFinancialMetric(
      "Revenue",
      formatCompactCurrency(snapshot.revenue, snapshot.currency),
      formatExactCurrency(snapshot.revenue, snapshot.currency),
    ),
    createFinancialMetric(
      "Net income",
      formatCompactCurrency(snapshot.netIncome, snapshot.currency),
      formatExactCurrency(snapshot.netIncome, snapshot.currency),
    ),
    createFinancialMetric(
      "Trailing EPS",
      formatOptionalPrice(snapshot.trailingEps, snapshot.currency),
    ),
    createFinancialMetric("Profit margin", formatFundamentalPercent(snapshot.profitMargin)),
  ]);

  const valuationGroup = createFundamentalsGroup("Valuation", [
    createFinancialMetric("Trailing P/E", formatRatio(valuation.trailingPe)),
    createFinancialMetric("Forward P/E", formatRatio(valuation.forwardPe)),
    createFinancialMetric("Price to sales", formatRatio(valuation.priceToSales)),
    createFinancialMetric("Price to book", formatRatio(valuation.priceToBook)),
    createFinancialMetric("Dividend yield", formatFundamentalPercent(valuation.dividendYield)),
  ]);

  content.append(companyHeader, descriptionArea, financialGroup, valuationGroup);
  fundamentalsContainer.replaceChildren(content);
}

function createCompanyBadge(text, labelText) {
  const badge = document.createElement("span");
  badge.className = "company-badge";
  const label = document.createElement("span");
  label.className = "company-badge-label";
  label.textContent = `${labelText} · `;
  badge.append(label, document.createTextNode(text));
  return badge;
}

function createDescriptionToggle(description) {
  const button = document.createElement("button");
  button.className = "description-toggle";
  button.type = "button";
  button.textContent = "Read more";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", description.id);

  button.addEventListener("click", () => {
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isExpanded));
    button.textContent = isExpanded ? "Read more" : "Show less";
    description.classList.toggle("is-collapsed", isExpanded);
  });

  return button;
}

function createFundamentalsGroup(titleText, metrics) {
  const group = document.createElement("section");
  group.className = "fundamentals-group";
  const title = document.createElement("h4");
  title.textContent = titleText;
  const grid = document.createElement("div");
  grid.className = "fundamentals-grid";
  grid.append(...metrics);
  group.append(title, grid);
  return group;
}

function createFinancialMetric(labelText, valueText, exactValue = null) {
  const metric = document.createElement("div");
  metric.className = "fundamental-metric";
  const label = document.createElement("span");
  label.className = "fundamental-label";
  label.textContent = labelText;
  const value = document.createElement("span");
  value.className = "fundamental-value";
  value.textContent = valueText;

  if (exactValue) {
    value.title = exactValue;
    value.setAttribute("aria-label", exactValue);
  }

  metric.append(label, value);
  return metric;
}

async function showStockChart(stock, options = {}) {
  // Do not let a delayed default AAPL response replace a user's selection.
  if (options.isDefault && latestChartRequest > 0) return;

  const requestId = ++latestChartRequest;

  chartTitle.textContent = stock.symbol;
  chartCompany.textContent = stock.name;
  featuredPrice.textContent = formatPrice(stock.price, stock.currency);
  setChangeBadge(featuredChange, stock.percentageChange);
  chartContainer.replaceChildren(createMessage(`Loading ${stock.symbol} chart…`));
  performanceGrid.replaceChildren(createMessage(`Loading ${stock.symbol} performance…`));
  loadFundamentalsForStock(stock, requestId);

  if (options.scroll !== false) {
    chartSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const [chartResult, performanceResult] = await Promise.allSettled([
    fetchChartData(stock.symbol),
    fetchPerformanceData(stock.symbol),
  ]);

  // Ignore both responses if the user selected another stock while they loaded.
  if (requestId !== latestChartRequest) return;

  if (chartResult.status === "fulfilled") {
    chartContainer.replaceChildren(createPriceChart(chartResult.value, stock));
  } else {
    chartContainer.replaceChildren(
      createMessage(
        chartResult.reason?.message || "The chart could not be loaded. Please try again.",
        true,
      ),
    );
  }

  if (performanceResult.status === "fulfilled") {
    renderPerformanceAnalytics(performanceResult.value, stock.currency);
  } else {
    performanceGrid.replaceChildren(
      createMessage(
        performanceResult.reason?.message || "Performance data could not be loaded.",
        true,
      ),
    );
  }
}

/**
 * Draw a responsive SVG chart without requiring a charting framework.
 */
function createPriceChart(points, stock) {
  const width = 800;
  const height = 300;
  const padding = { top: 24, right: 24, bottom: 42, left: 66 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const prices = points.map((point) => point.price);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const priceRange = highestPrice - lowestPrice || 1;
  const lineColor = "var(--accent-bright)";
  const svgNamespace = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("class", "price-chart");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `One month daily price chart for ${stock.name}`);

  // Add three horizontal guide lines and their prices.
  for (let index = 0; index < 3; index += 1) {
    const y = padding.top + (plotHeight * index) / 2;
    const guidePrice = highestPrice - (priceRange * index) / 2;
    const line = document.createElementNS(svgNamespace, "line");
    line.setAttribute("x1", padding.left);
    line.setAttribute("x2", width - padding.right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("class", "chart-grid-line");

    const label = document.createElementNS(svgNamespace, "text");
    label.setAttribute("x", padding.left - 10);
    label.setAttribute("y", y + 4);
    label.setAttribute("class", "chart-axis-label chart-price-label");
    label.textContent = formatPrice(guidePrice, stock.currency);
    svg.append(line, label);
  }

  const pathData = points
    .map((point, index) => {
      const x = padding.left + (index / (points.length - 1)) * plotWidth;
      const y = padding.top + ((highestPrice - point.price) / priceRange) * plotHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const path = document.createElementNS(svgNamespace, "path");
  path.setAttribute("d", pathData);
  path.setAttribute("class", "chart-line");
  path.setAttribute("stroke", lineColor);
  // Set fill directly on the SVG as well as in CSS. This prevents browsers
  // from applying SVG's default black fill while the stylesheet is loading.
  path.setAttribute("fill", "none");
  svg.append(path);

  const lastPrice = points[points.length - 1].price;
  const endMarker = document.createElementNS(svgNamespace, "circle");
  endMarker.setAttribute("class", "chart-end-marker");
  endMarker.setAttribute("cx", width - padding.right);
  endMarker.setAttribute(
    "cy",
    padding.top + ((highestPrice - lastPrice) / priceRange) * plotHeight,
  );
  endMarker.setAttribute("r", 4);
  svg.append(endMarker);

  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  });
  const dateIndexes = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  dateIndexes.forEach((pointIndex, labelIndex) => {
    const label = document.createElementNS(svgNamespace, "text");
    const x = padding.left + (pointIndex / (points.length - 1)) * plotWidth;
    label.setAttribute("x", x);
    label.setAttribute("y", height - 12);
    label.setAttribute("class", "chart-axis-label");
    label.setAttribute("text-anchor", labelIndex === 0 ? "start" : labelIndex === 2 ? "end" : "middle");
    label.textContent = dateFormatter.format(new Date(points[pointIndex].timestamp * 1000));
    svg.append(label);
  });

  return svg;
}

function formatPrice(price, currency) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch (error) {
    return `${price.toFixed(2)} ${currency}`;
  }
}

function formatIndexValue(value) {
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function renderPerformanceAnalytics(analytics, currency) {
  const metrics = [
    { label: "1D return", value: formatReturn(analytics.oneDay), return: analytics.oneDay },
    { label: "1M return", value: formatReturn(analytics.oneMonth), return: analytics.oneMonth },
    {
      label: "3M return",
      value: formatReturn(analytics.threeMonths),
      return: analytics.threeMonths,
    },
    {
      label: "6M return",
      value: formatReturn(analytics.sixMonths),
      return: analytics.sixMonths,
    },
    { label: "1Y return", value: formatReturn(analytics.oneYear), return: analytics.oneYear },
    {
      label: "52-week high",
      value: formatOptionalPrice(analytics.fiftyTwoWeekHigh, currency),
    },
    {
      label: "52-week low",
      value: formatOptionalPrice(analytics.fiftyTwoWeekLow, currency),
    },
    {
      label: "Average volume",
      value: formatVolume(analytics.averageVolume),
      exactValue:
        typeof analytics.averageVolume === "number"
          ? `${Math.round(analytics.averageVolume).toLocaleString("en-US")} shares`
          : null,
    },
  ];

  performanceGrid.replaceChildren(
    ...metrics.map((metric) => createPerformanceMetric(metric)),
  );
}

function createPerformanceMetric(metric) {
  const item = document.createElement("div");
  item.className = "performance-metric";

  const label = document.createElement("span");
  label.className = "performance-label";
  label.textContent = metric.label;

  const value = document.createElement("span");
  value.className = "performance-value";
  value.textContent = metric.value;

  if (metric.return > 0) {
    value.classList.add("positive-text");
  } else if (metric.return < 0) {
    value.classList.add("negative-text");
  }

  if (metric.exactValue) {
    value.title = metric.exactValue;
    value.setAttribute("aria-label", metric.exactValue);
  }

  item.append(label, value);
  return item;
}

function formatReturn(value) {
  if (typeof value !== "number") return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatOptionalPrice(value, currency) {
  if (typeof value !== "number") return "—";
  return currency ? formatPrice(value, currency) : formatIndexValue(value);
}

function formatVolume(value) {
  if (typeof value !== "number") return "—";

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.round(value));
}

function formatCompactCurrency(value, currency) {
  if (typeof value !== "number") return "—";

  try {
    if (currency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(value);
    }
  } catch (error) {
    // Fall back to a compact number followed by the currency code.
  }

  const compactValue = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
  return currency ? `${compactValue} ${currency}` : compactValue;
}

function formatExactCurrency(value, currency) {
  if (typeof value !== "number") return null;

  try {
    if (currency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value);
    }
  } catch (error) {
    // Fall back to a full number followed by the currency code.
  }

  const exactValue = Math.round(value).toLocaleString("en-US");
  return currency ? `${exactValue} ${currency}` : exactValue;
}

function formatFundamentalPercent(value) {
  return typeof value === "number" ? `${(value * 100).toFixed(2)}%` : "—";
}

function formatRatio(value) {
  return typeof value === "number" ? `${value.toFixed(2)}x` : "—";
}

function setChangeBadge(element, percentageChange) {
  const directionClass =
    percentageChange > 0 ? "positive" : percentageChange < 0 ? "negative" : "neutral";
  element.className = `change ${directionClass}`;
  element.textContent = `${percentageChange >= 0 ? "+" : ""}${percentageChange.toFixed(2)}%`;
}

function createMessage(text, isError = false) {
  const message = document.createElement("p");
  message.className = `status-message${isError ? " error" : ""}`;
  message.textContent = text;
  return message;
}

/**
 * Load every trending ticker. Promise.allSettled lets successful cards appear
 * even when one request fails.
 */
async function loadTrendingStocks() {
  const results = await Promise.allSettled(TRENDING_TICKERS.map(fetchStock));
  const stocks = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  trendingGrid.replaceChildren();

  if (stocks.length === 0) {
    trendingGrid.append(
      createMessage("Trending stocks could not be loaded. Please refresh to try again.", true),
    );
    return;
  }

  stocks.forEach((stock) => trendingGrid.append(createStockCard(stock)));

  if (stocks.length < TRENDING_TICKERS.length) {
    trendingGrid.append(createMessage("Some stock prices could not be loaded."));
  }
}

/**
 * Load the major indexes independently so one unavailable market does not hide
 * the other successful results.
 */
async function loadMarketOverview() {
  const results = await Promise.allSettled(
    MARKET_INDEXES.map(async (marketIndex) => ({
      ...(await fetchStock(marketIndex.ticker)),
      displayName: marketIndex.name,
    })),
  );
  const indexes = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  marketOverviewGrid.replaceChildren();

  if (indexes.length === 0) {
    marketOverviewGrid.append(
      createMessage("Market overview could not be loaded. Please refresh to try again.", true),
    );
    return;
  }

  indexes.forEach((index) => marketOverviewGrid.append(createMarketIndexCard(index)));

  if (indexes.length < MARKET_INDEXES.length) {
    marketOverviewGrid.append(createMessage("Some market indexes could not be loaded."));
  }
}

/**
 * Rank live daily changes within the declared mover universe. This is a useful
 * snapshot of that group, not a claim about every stock in the market.
 */
async function loadMarketMovers() {
  const results = await Promise.allSettled(MOVER_TICKERS.map(fetchStock));
  const stocks = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
  const gainers = stocks
    .filter((stock) => stock.percentageChange > 0)
    .sort((first, second) => second.percentageChange - first.percentageChange)
    .slice(0, 3);
  const losers = stocks
    .filter((stock) => stock.percentageChange < 0)
    .sort((first, second) => first.percentageChange - second.percentageChange)
    .slice(0, 3);

  renderMoverList(gainersList, gainers, "No gainers are available in the selected group.");
  renderMoverList(losersList, losers, "No losers are available in the selected group.");
}

function renderMoverList(container, stocks, emptyMessage) {
  container.replaceChildren();

  if (stocks.length === 0) {
    container.append(createMessage(emptyMessage));
    return;
  }

  stocks.forEach((stock) => container.append(createMoverRow(stock)));
}

async function loadDefaultFeaturedStock() {
  try {
    const stock = await fetchStock("AAPL");
    await showStockChart(stock, { scroll: false, isDefault: true });
  } catch (error) {
    chartCompany.textContent = "Apple market data is temporarily unavailable.";
    chartContainer.replaceChildren(
      createMessage(error.message || "The featured stock could not be loaded.", true),
    );
    performanceGrid.replaceChildren(
      createMessage("AAPL performance data could not be loaded.", true),
    );
    renderFundamentalsUnavailable();
  }
}

function applySavedTheme() {
  let savedTheme;

  try {
    savedTheme = localStorage.getItem("stock-dashboard-theme");
  } catch (error) {
    savedTheme = null;
  }

  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
  }

  updateThemeButton();
}

function toggleTheme() {
  document.body.classList.toggle("light-theme");
  const theme = document.body.classList.contains("light-theme") ? "light" : "dark";

  try {
    localStorage.setItem("stock-dashboard-theme", theme);
  } catch (error) {
    // The theme still works when browser privacy settings block local storage.
  }

  updateThemeButton();
}

function updateThemeButton() {
  const lightThemeIsActive = document.body.classList.contains("light-theme");
  themeButton.setAttribute(
    "aria-label",
    lightThemeIsActive ? "Switch to dark theme" : "Switch to light theme",
  );
  themeButton.setAttribute("aria-pressed", String(lightThemeIsActive));
}

async function handleSearch(event) {
  event.preventDefault();

  const ticker = tickerInput.value.trim().toUpperCase();

  if (!ticker) {
    tickerInput.focus();
    return;
  }

  searchSection.hidden = false;
  searchResult.replaceChildren(createMessage(`Searching for ${ticker}…`));
  searchButton.disabled = true;
  searchButton.textContent = "Searching…";

  try {
    const stock = await fetchStock(ticker);
    searchResult.replaceChildren(createStockCard(stock));
    showStockChart(stock);
  } catch (error) {
    searchResult.replaceChildren(
      createMessage(error.message || "Something went wrong. Please try again.", true),
    );
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search market";
  }
}

searchForm.addEventListener("submit", handleSearch);
themeButton.addEventListener("click", toggleTheme);
applySavedTheme();
loadMarketOverview();
loadMarketMovers();
loadDefaultFeaturedStock();
loadTrendingStocks();
