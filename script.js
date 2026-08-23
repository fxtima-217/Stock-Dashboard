// The six tickers shown when the page first loads.
const TRENDING_TICKERS = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL"];

// Yahoo Finance does not allow requests directly from most browser pages.
// corsproxy.io fetches the Yahoo URL for us and adds the required CORS headers.
const CORS_PROXY = "https://corsproxy.io/?url=";
const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/";

const trendingGrid = document.querySelector("#trending-grid");
const searchForm = document.querySelector("#search-form");
const tickerInput = document.querySelector("#ticker-input");
const searchSection = document.querySelector("#search-section");
const searchResult = document.querySelector("#search-result");
const searchButton = searchForm.querySelector("button");
const chartSection = document.querySelector("#chart-section");
const chartTitle = document.querySelector("#chart-title");
const chartCompany = document.querySelector("#chart-company");
const chartContainer = document.querySelector("#chart-container");
let latestChartRequest = 0;

/**
 * Fetch one stock from Yahoo Finance and return only the fields the UI needs.
 */
async function fetchStock(ticker) {
  const yahooUrl = `${YAHOO_CHART_URL}${encodeURIComponent(ticker)}?interval=1d&range=5d`;
  const requestUrl = `${CORS_PROXY}${encodeURIComponent(yahooUrl)}`;

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
  const previousClose = meta.chartPreviousClose ?? meta.previousClose;
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
 * Fetch one month of daily closing prices for the selected ticker.
 */
async function fetchChartData(ticker) {
  const yahooUrl = `${YAHOO_CHART_URL}${encodeURIComponent(ticker)}?interval=1d&range=1mo`;
  const requestUrl = `${CORS_PROXY}${encodeURIComponent(yahooUrl)}`;

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

async function showStockChart(stock) {
  const requestId = ++latestChartRequest;

  chartSection.hidden = false;
  chartTitle.textContent = `${stock.symbol} price history`;
  chartCompany.textContent = stock.name;
  chartContainer.replaceChildren(createMessage(`Loading ${stock.symbol} chart…`));
  chartSection.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const points = await fetchChartData(stock.symbol);

    // Ignore this response if the user selected another card while it loaded.
    if (requestId !== latestChartRequest) return;

    chartContainer.replaceChildren(createPriceChart(points, stock));
  } catch (error) {
    if (requestId !== latestChartRequest) return;

    chartContainer.replaceChildren(
      createMessage(error.message || "The chart could not be loaded. Please try again.", true),
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
  const lineColor = "#16784b";
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
  } catch (error) {
    searchResult.replaceChildren(
      createMessage(error.message || "Something went wrong. Please try again.", true),
    );
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Search";
  }
}

searchForm.addEventListener("submit", handleSearch);
loadTrendingStocks();
