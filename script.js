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

const METRIC_EXPLANATIONS = {
  marketCap: {
    title: "Market capitalisation",
    meaning:
      "Market capitalisation is the total market value of a company's outstanding shares. It is calculated by multiplying the share price by the number of shares.",
    interpretation:
      "It is mainly a measure of company size. A larger market cap does not automatically mean a company is better or less risky.",
    importance:
      "Investors use it to group companies by size and to provide context when comparing growth, risk, liquidity, and valuation.",
    example:
      "If a company has 1 billion shares and each share costs $50, its market capitalisation is $50 billion. Think of it as the market's current price tag for the whole company.",
  },
  revenue: {
    title: "Revenue",
    meaning:
      "Revenue is the money a company brings in from selling its products or services before expenses are deducted. StockFrame shows the trailing-twelve-month figure.",
    interpretation:
      "Rising revenue can indicate growing demand, but revenue alone does not show whether the company is profitable.",
    importance:
      "Investors track revenue to understand the scale of a business and whether its sales are expanding or contracting over time.",
    example:
      "If a business sells 1,000 products for $10 each, it generates $10,000 in revenue. This is the money from sales before paying wages, rent, tax, and other expenses.",
  },
  netIncome: {
    title: "Net income",
    meaning:
      "Net income is the profit left for common shareholders after operating costs, interest, taxes, and other expenses. StockFrame shows the trailing-twelve-month figure.",
    interpretation:
      "Positive net income means the company earned more than it spent during the period. One-off gains or charges can make a single period unusual.",
    importance:
      "Investors use it to assess overall profitability and as a starting point for metrics such as earnings per share.",
    example:
      "If a company earns $10,000 in revenue and has $8,000 of total expenses, its net income is $2,000. This is the profit remaining after those expenses.",
  },
  trailingEps: {
    title: "Trailing EPS",
    meaning:
      "Trailing earnings per share is the profit available to common shareholders divided by the weighted average number of shares, using the latest twelve months.",
    interpretation:
      "A positive figure means the company generated earnings per share. Changes can reflect both profit and changes in the number of shares.",
    importance:
      "Investors use EPS to compare earnings on a per-share basis and to calculate valuation measures such as the trailing P/E ratio.",
    example:
      "If a company earned $1 million for common shareholders over the last year and had 500,000 shares, its trailing EPS would be $2 per share.",
  },
  profitMargin: {
    title: "Profit margin",
    meaning:
      "Profit margin is the percentage of revenue that remains as net income after all expenses. For example, 10% means about 10p or 10 cents of each revenue unit became profit.",
    interpretation:
      "Higher or improving margins can indicate greater profitability, but typical margins vary widely between industries.",
    importance:
      "Investors look at margins to understand cost control, pricing power, and how efficiently sales are converted into profit.",
    example:
      "If a company makes $10,000 in revenue and keeps $2,000 as net income, its profit margin is 20%. It kept 20 cents as profit from each dollar of revenue.",
  },
  trailingPe: {
    title: "Trailing P/E",
    meaning:
      "The trailing price-to-earnings ratio compares the share price with earnings per share from the latest twelve months.",
    interpretation:
      "It shows how much the market is paying for each unit of recent earnings. A high or low ratio can have many causes, and it may be unavailable when earnings are negative.",
    importance:
      "Investors use it to compare valuation with a company's own history and with similar profitable companies.",
    example:
      "If a share costs $40 and the company earned $2 per share over the last year, its trailing P/E is 20x. The share price is 20 times its recent annual earnings per share.",
  },
  forwardPe: {
    title: "Forward P/E",
    meaning:
      "The forward price-to-earnings ratio compares the share price with estimated future earnings per share, rather than already reported earnings.",
    interpretation:
      "It reflects expectations and can change when analyst forecasts change. Because it relies on estimates, the eventual result may be different.",
    importance:
      "Investors compare it with trailing P/E and peer companies to understand how expected earnings affect the current valuation.",
    example:
      "If a share costs $40 and analysts estimate next year's EPS will be $2.50, its forward P/E is 16x. The calculation depends on an estimate that may later change.",
  },
  priceToSales: {
    title: "Price-to-sales",
    meaning:
      "The price-to-sales ratio compares a company's market value with its trailing-twelve-month revenue.",
    interpretation:
      "It shows how much the market is paying for each unit of sales. It does not account for costs, debt, or differences in profit margins.",
    importance:
      "Investors may use it to compare similar businesses, including companies whose earnings are currently low or negative.",
    example:
      "If a company is valued by the market at $500 million and generated $100 million in annual revenue, its price-to-sales ratio is 5x.",
  },
  priceToBook: {
    title: "Price-to-book",
    meaning:
      "The price-to-book ratio compares a company's market value with the accounting value of its assets minus liabilities.",
    interpretation:
      "A value above 1x means the market values the company above its recorded book value. Book value can be less informative for businesses built around intangible assets.",
    importance:
      "Investors often use it when examining banks, insurers, and other asset-heavy businesses, alongside the quality of those assets.",
    example:
      "If a company's market value is $300 million and its accounting book value is $100 million, its price-to-book ratio is 3x.",
  },
  dividendYield: {
    title: "Dividend yield",
    meaning:
      "Dividend yield is the annual dividend per share expressed as a percentage of the current share price.",
    interpretation:
      "It estimates dividend income relative to the share price. A higher yield is not guaranteed to continue and can also result from a falling share price.",
    importance:
      "Investors use it to understand the income component of a stock and compare it with the company's dividend history and cash generation.",
    example:
      "If a share costs $50 and the company pays $2 in dividends per share over a year, its dividend yield is 4%. Future dividends are not guaranteed.",
  },
  oneDayReturn: {
    title: "1D return",
    meaning:
      "The 1D return is the percentage change between the latest available daily close and the preceding trading session's close.",
    interpretation:
      "A positive value means the closing price rose; a negative value means it fell. One day can be heavily influenced by news or normal market movement.",
    importance:
      "Investors use it for a quick view of the most recent price movement, while recognising that it says little about a long-term trend.",
    example:
      "If a stock closed at $100 yesterday and closes at $103 today, its 1D return is +3%. If it closed at $97 instead, the return would be −3%.",
  },
  oneMonthReturn: {
    title: "1M return",
    meaning:
      "The 1M return is the percentage change from the closing price around one calendar month ago to the latest available close.",
    interpretation:
      "It shows the direction and size of the recent monthly move, but short-term events can still have a large effect.",
    importance:
      "Investors use it to place today's price in a little more context than a single daily move provides.",
    example:
      "If a stock closed at $80 about one month ago and now closes at $88, its 1M return is +10%.",
  },
  threeMonthReturn: {
    title: "3M return",
    meaning:
      "The 3M return is the percentage change from the closing price around three calendar months ago to the latest available close.",
    interpretation:
      "It describes recent medium-term price momentum, not the underlying reason for the change.",
    importance:
      "Investors look at it to compare recent performance across stocks and against shorter or longer periods.",
    example:
      "If a stock closed at $50 about three months ago and now closes at $45, its 3M return is −10%.",
  },
  sixMonthReturn: {
    title: "6M return",
    meaning:
      "The 6M return is the percentage change from the closing price around six calendar months ago to the latest available close.",
    interpretation:
      "It can reveal a broader trend than monthly returns, although the starting date still affects the result.",
    importance:
      "Investors use it to assess medium-term price performance and compare it with company or market developments over the same period.",
    example:
      "If a stock closed at $40 about six months ago and now closes at $50, its 6M return is +25%.",
  },
  oneYearReturn: {
    title: "1Y return",
    meaning:
      "The 1Y return is the percentage change from the closing price around twelve calendar months ago to the latest available close.",
    interpretation:
      "It provides a longer view of price movement but does not by itself explain volatility or include every factor affecting an investor's return.",
    importance:
      "Investors use it to compare annual price performance with the stock's history, peers, or a broader market index.",
    example:
      "If a stock closed at $60 about one year ago and now closes at $72, its 1Y return is +20%.",
  },
  fiftyTwoWeekHigh: {
    title: "52-week high",
    meaning:
      "The 52-week high is the highest daily trading price recorded in StockFrame's latest one-year data.",
    interpretation:
      "It shows the upper end of the recent trading range. Being near the high is not automatically positive or negative.",
    importance:
      "Investors use it to understand where the current price sits within its recent range and to add context to momentum and volatility.",
    example:
      "If the highest price a stock traded at during the last year was $75, its 52-week high is $75—even if its current price is now $65.",
  },
  fiftyTwoWeekLow: {
    title: "52-week low",
    meaning:
      "The 52-week low is the lowest daily trading price recorded in StockFrame's latest one-year data.",
    interpretation:
      "It shows the lower end of the recent trading range. A price near the low can reflect many different circumstances.",
    importance:
      "Investors use it to understand the stock's recent range and how far the current price has moved from a previous low point.",
    example:
      "If the lowest price a stock traded at during the last year was $30, its 52-week low is $30—even if its current price is now $45.",
  },
  averageVolume: {
    title: "Average volume",
    meaning:
      "Average volume is the average number of shares traded per day across StockFrame's available one-year daily data.",
    interpretation:
      "Higher volume generally means more trading activity and often greater liquidity. Volume does not indicate whether buying or selling pressure will win.",
    importance:
      "Investors use it to judge how actively a stock trades and to compare an unusual day's activity with its normal level.",
    example:
      "If 1 million, 2 million, and 3 million shares traded over three days, the average volume for those days would be 2 million shares per day.",
  },
};

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
const learnModeButton = document.querySelector("#learn-mode-button");
const learnDialog = document.querySelector("#learn-dialog");
const learnDialogClose = document.querySelector("#learn-dialog-close");
const learnDialogTitle = document.querySelector("#learn-dialog-title");
const learnDialogMeaning = document.querySelector("#learn-dialog-meaning");
const learnDialogInterpretation = document.querySelector("#learn-dialog-interpretation");
const learnDialogImportance = document.querySelector("#learn-dialog-importance");
const learnDialogExample = document.querySelector("#learn-dialog-example");
const themeButton = document.querySelector("#theme-button");
const stockRequestCache = new Map();
const performanceRequestCache = new Map();
const fundamentalsRequestCache = new Map();
let latestChartRequest = 0;
let learnModeIsActive = false;
let lastLearnTrigger = null;

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
      "marketCap",
    ),
    createFinancialMetric(
      "Revenue",
      formatCompactCurrency(snapshot.revenue, snapshot.currency),
      formatExactCurrency(snapshot.revenue, snapshot.currency),
      "revenue",
    ),
    createFinancialMetric(
      "Net income",
      formatCompactCurrency(snapshot.netIncome, snapshot.currency),
      formatExactCurrency(snapshot.netIncome, snapshot.currency),
      "netIncome",
    ),
    createFinancialMetric(
      "Trailing EPS",
      formatOptionalPrice(snapshot.trailingEps, snapshot.currency),
      null,
      "trailingEps",
    ),
    createFinancialMetric(
      "Profit margin",
      formatFundamentalPercent(snapshot.profitMargin),
      null,
      "profitMargin",
    ),
  ]);

  const valuationGroup = createFundamentalsGroup("Valuation", [
    createFinancialMetric(
      "Trailing P/E",
      formatRatio(valuation.trailingPe),
      null,
      "trailingPe",
    ),
    createFinancialMetric(
      "Forward P/E",
      formatRatio(valuation.forwardPe),
      null,
      "forwardPe",
    ),
    createFinancialMetric(
      "Price to sales",
      formatRatio(valuation.priceToSales),
      null,
      "priceToSales",
    ),
    createFinancialMetric(
      "Price to book",
      formatRatio(valuation.priceToBook),
      null,
      "priceToBook",
    ),
    createFinancialMetric(
      "Dividend yield",
      formatFundamentalPercent(valuation.dividendYield),
      null,
      "dividendYield",
    ),
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

function createFinancialMetric(labelText, valueText, exactValue = null, learnKey = null) {
  const metric = document.createElement("div");
  metric.className = "fundamental-metric";
  const labelRow = document.createElement("div");
  labelRow.className = "metric-label-row";
  const label = document.createElement("span");
  label.className = "fundamental-label";
  label.textContent = labelText;
  labelRow.append(label);

  if (learnKey) {
    labelRow.append(createMetricInfoButton(learnKey));
  }

  const value = document.createElement("span");
  value.className = "fundamental-value";
  value.textContent = valueText;

  if (exactValue) {
    value.title = exactValue;
    value.setAttribute("aria-label", exactValue);
  }

  metric.append(labelRow, value);
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
    {
      label: "1D return",
      value: formatReturn(analytics.oneDay),
      return: analytics.oneDay,
      learnKey: "oneDayReturn",
    },
    {
      label: "1M return",
      value: formatReturn(analytics.oneMonth),
      return: analytics.oneMonth,
      learnKey: "oneMonthReturn",
    },
    {
      label: "3M return",
      value: formatReturn(analytics.threeMonths),
      return: analytics.threeMonths,
      learnKey: "threeMonthReturn",
    },
    {
      label: "6M return",
      value: formatReturn(analytics.sixMonths),
      return: analytics.sixMonths,
      learnKey: "sixMonthReturn",
    },
    {
      label: "1Y return",
      value: formatReturn(analytics.oneYear),
      return: analytics.oneYear,
      learnKey: "oneYearReturn",
    },
    {
      label: "52-week high",
      value: formatOptionalPrice(analytics.fiftyTwoWeekHigh, currency),
      learnKey: "fiftyTwoWeekHigh",
    },
    {
      label: "52-week low",
      value: formatOptionalPrice(analytics.fiftyTwoWeekLow, currency),
      learnKey: "fiftyTwoWeekLow",
    },
    {
      label: "Average volume",
      value: formatVolume(analytics.averageVolume),
      exactValue:
        typeof analytics.averageVolume === "number"
          ? `${Math.round(analytics.averageVolume).toLocaleString("en-US")} shares`
          : null,
      learnKey: "averageVolume",
    },
  ];

  performanceGrid.replaceChildren(
    ...metrics.map((metric) => createPerformanceMetric(metric)),
  );
}

function createPerformanceMetric(metric) {
  const item = document.createElement("div");
  item.className = "performance-metric";

  const labelRow = document.createElement("div");
  labelRow.className = "metric-label-row";
  const label = document.createElement("span");
  label.className = "performance-label";
  label.textContent = metric.label;
  labelRow.append(label);

  if (metric.learnKey) {
    labelRow.append(createMetricInfoButton(metric.learnKey));
  }

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

  item.append(labelRow, value);
  return item;
}

function createMetricInfoButton(learnKey) {
  const explanation = METRIC_EXPLANATIONS[learnKey];
  const button = document.createElement("button");
  button.className = "metric-info-button";
  button.type = "button";
  button.hidden = !learnModeIsActive;
  button.textContent = "i";
  button.setAttribute("aria-label", `Learn about ${explanation.title}`);
  button.setAttribute("aria-haspopup", "dialog");
  button.addEventListener("click", () => openLearnDialog(learnKey, button));
  return button;
}

function openLearnDialog(learnKey, trigger) {
  const explanation = METRIC_EXPLANATIONS[learnKey];

  if (!explanation) return;

  lastLearnTrigger = trigger;
  learnDialogTitle.textContent = explanation.title;
  learnDialogMeaning.textContent = explanation.meaning;
  learnDialogInterpretation.textContent = explanation.interpretation;
  learnDialogImportance.textContent = explanation.importance;
  learnDialogExample.textContent = explanation.example;

  if (typeof learnDialog.showModal === "function") {
    if (!learnDialog.open) learnDialog.showModal();
  } else {
    learnDialog.setAttribute("open", "");
  }

  learnDialogClose.focus();
}

function closeLearnDialog() {
  if (typeof learnDialog.close === "function" && learnDialog.open) {
    learnDialog.close();
    return;
  }

  learnDialog.removeAttribute("open");
  restoreLearnTriggerFocus();
}

function restoreLearnTriggerFocus() {
  if (lastLearnTrigger?.isConnected && !lastLearnTrigger.hidden) {
    lastLearnTrigger.focus();
  }

  lastLearnTrigger = null;
}

function applySavedLearnMode() {
  let savedMode = null;

  try {
    savedMode = localStorage.getItem("stockframe-learn-mode");
  } catch (error) {
    // Learn Mode still works when browser privacy settings block local storage.
  }

  setLearnMode(savedMode === "on", false);
}

function toggleLearnMode() {
  setLearnMode(!learnModeIsActive, true);
}

function setLearnMode(isActive, shouldPersist) {
  learnModeIsActive = isActive;
  document.body.classList.toggle("learn-mode", isActive);
  learnModeButton.setAttribute("aria-pressed", String(isActive));
  learnModeButton.setAttribute(
    "aria-label",
    isActive ? "Disable Learn Mode" : "Enable Learn Mode",
  );

  document.querySelectorAll(".metric-info-button").forEach((button) => {
    button.hidden = !isActive;
  });

  if (!isActive && learnDialog.open) {
    closeLearnDialog();
  }

  if (shouldPersist) {
    try {
      localStorage.setItem("stockframe-learn-mode", isActive ? "on" : "off");
    } catch (error) {
      // The current mode remains active even when it cannot be saved.
    }
  }
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
learnModeButton.addEventListener("click", toggleLearnMode);
learnDialogClose.addEventListener("click", closeLearnDialog);
learnDialog.addEventListener("close", restoreLearnTriggerFocus);
learnDialog.addEventListener("click", (event) => {
  if (event.target === learnDialog) closeLearnDialog();
});
themeButton.addEventListener("click", toggleTheme);
applySavedLearnMode();
applySavedTheme();
loadMarketOverview();
loadMarketMovers();
loadDefaultFeaturedStock();
loadTrendingStocks();
