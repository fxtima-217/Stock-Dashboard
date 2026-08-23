const TICKER_PATTERN = /^[A-Z0-9.^=-]{1,15}$/i;
const YAHOO_USER_AGENT = "Mozilla/5.0 (compatible; StockFrame/1.0)";
const SESSION_LIFETIME_MS = 30 * 60 * 1000;
let yahooSession = null;

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const ticker = typeof request.query.ticker === "string" ? request.query.ticker.trim() : "";

  if (!TICKER_PATTERN.test(ticker) || ticker.startsWith("^")) {
    return response.status(400).json({ error: "Invalid company ticker." });
  }

  try {
    const result = await fetchFundamentals(ticker.toUpperCase());

    if (!result.available) {
      response.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
      return response.status(200).json(result);
    }

    response.setHeader(
      "Cache-Control",
      "public, s-maxage=21600, stale-while-revalidate=86400",
    );
    return response.status(200).json(result);
  } catch (error) {
    response.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response.status(200).json(
      createUnavailableResponse(
        ticker.toUpperCase(),
        error?.reason || "upstream_unavailable",
      ),
    );
  }
};

async function fetchFundamentals(ticker) {
  let session;

  try {
    session = await getYahooSession();
  } catch (error) {
    throw createUpstreamError(error?.reason || "authentication");
  }

  let yahooResponse = await requestQuoteSummary(ticker, session);

  // A crumb can expire before our local session timer. Refresh it once only.
  if (yahooResponse.status === 401) {
    yahooSession = null;

    try {
      session = await getYahooSession();
      yahooResponse = await requestQuoteSummary(ticker, session);
    } catch (error) {
      throw createUpstreamError(error?.reason || "authentication");
    }
  }

  if (yahooResponse.status === 401 || yahooResponse.status === 403) {
    throw createUpstreamError("authentication");
  }

  if (yahooResponse.status === 429) {
    throw createUpstreamError("rate_limited");
  }

  if (!yahooResponse.ok) {
    throw createUpstreamError("upstream_unavailable");
  }

  let payload;

  try {
    payload = await yahooResponse.json();
  } catch (error) {
    throw createUpstreamError("unexpected_response");
  }

  const quoteSummary = payload?.quoteSummary?.result?.[0];

  if (!quoteSummary) {
    return createUnavailableResponse(ticker, "missing_data");
  }

  return normalizeFundamentals(ticker, quoteSummary);
}

async function getYahooSession() {
  if (yahooSession && yahooSession.expiresAt > Date.now()) {
    return yahooSession;
  }

  const cookieResponse = await fetchWithTimeout("https://fc.yahoo.com", {
    headers: { "User-Agent": YAHOO_USER_AGENT },
    redirect: "manual",
  });

  if (cookieResponse.status === 429) {
    throw createUpstreamError("rate_limited");
  }

  const cookie = extractCookies(cookieResponse.headers);

  if (!cookie) {
    throw createUpstreamError("authentication");
  }

  const crumbResponse = await fetchWithTimeout(
    "https://query1.finance.yahoo.com/v1/test/getcrumb",
    {
      headers: {
        Accept: "text/plain",
        Cookie: cookie,
        "User-Agent": YAHOO_USER_AGENT,
      },
    },
  );

  if (!crumbResponse.ok) {
    throw createUpstreamError(
      crumbResponse.status === 429 ? "rate_limited" : "authentication",
    );
  }

  const crumb = (await crumbResponse.text()).trim();

  if (!crumb || crumb.length > 200 || crumb.includes("<")) {
    throw createUpstreamError("authentication");
  }

  yahooSession = {
    cookie,
    crumb,
    expiresAt: Date.now() + SESSION_LIFETIME_MS,
  };
  return yahooSession;
}

function requestQuoteSummary(ticker, session) {
  const url = new URL(
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}`,
  );
  url.searchParams.set(
    "modules",
    "assetProfile,price,summaryDetail,defaultKeyStatistics,financialData",
  );
  url.searchParams.set("crumb", session.crumb);

  return fetchWithTimeout(url, {
    headers: {
      Accept: "application/json",
      Cookie: session.cookie,
      "User-Agent": YAHOO_USER_AGENT,
    },
  });
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function extractCookies(headers) {
  const setCookieHeaders =
    typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];

  if (setCookieHeaders.length > 0) {
    return setCookieHeaders.map((cookie) => cookie.split(";")[0]).join("; ");
  }

  const combinedHeader = headers.get("set-cookie") || "";
  const cookies = [...combinedHeader.matchAll(/\b(A1|A3|GUC)=([^;,]+)/g)].map(
    (match) => `${match[1]}=${match[2]}`,
  );
  return cookies.join("; ");
}

function normalizeFundamentals(ticker, summary) {
  const profile = summary.assetProfile || {};
  const price = summary.price || {};
  const details = summary.summaryDetail || {};
  const statistics = summary.defaultKeyStatistics || {};
  const financialData = summary.financialData || {};
  const currency =
    readText(financialData.financialCurrency) || readText(price.currency) || null;
  const result = {
    available: true,
    reason: null,
    company: {
      name: readText(price.longName) || readText(price.shortName),
      ticker: readText(price.symbol) || ticker,
      exchange:
        readText(price.fullExchangeName) || readText(price.exchangeName) || null,
      sector: readText(profile.sector),
      industry: readText(profile.industry),
      description: readText(profile.longBusinessSummary),
    },
    financialSnapshot: {
      currency,
      marketCap: firstNumber(price.marketCap, details.marketCap),
      revenue: readNumber(financialData.totalRevenue),
      netIncome: firstNumber(
        statistics.netIncomeToCommon,
        financialData.netIncomeToCommon,
      ),
      trailingEps: readNumber(statistics.trailingEps),
      profitMargin: readNumber(financialData.profitMargins),
    },
    valuation: {
      trailingPe: readNumber(details.trailingPE),
      forwardPe: firstNumber(details.forwardPE, statistics.forwardPE),
      priceToSales: readNumber(details.priceToSalesTrailing12Months),
      priceToBook: readNumber(statistics.priceToBook),
      dividendYield: readNumber(details.dividendYield),
    },
  };

  const hasFundamentalData = [
    result.company.name,
    result.company.sector,
    result.company.industry,
    result.company.description,
    result.financialSnapshot.marketCap,
    result.financialSnapshot.revenue,
    result.financialSnapshot.netIncome,
    result.financialSnapshot.trailingEps,
    result.financialSnapshot.profitMargin,
    result.valuation.trailingPe,
    result.valuation.forwardPe,
    result.valuation.priceToSales,
    result.valuation.priceToBook,
    result.valuation.dividendYield,
  ].some((value) => value !== null);

  if (!hasFundamentalData) {
    return createUnavailableResponse(ticker, "missing_data");
  }

  return result;
}

function createUnavailableResponse(ticker, reason) {
  return {
    available: false,
    reason,
    company: {
      name: null,
      ticker,
      exchange: null,
      sector: null,
      industry: null,
      description: null,
    },
    financialSnapshot: {
      currency: null,
      marketCap: null,
      revenue: null,
      netIncome: null,
      trailingEps: null,
      profitMargin: null,
    },
    valuation: {
      trailingPe: null,
      forwardPe: null,
      priceToSales: null,
      priceToBook: null,
      dividendYield: null,
    },
  };
}

function readText(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value?.fmt === "string" && value.fmt.trim()) return value.fmt.trim();
  return null;
}

function readNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value?.raw === "number" && Number.isFinite(value.raw)) return value.raw;
  return null;
}

function firstNumber(...values) {
  for (const value of values) {
    const number = readNumber(value);
    if (number !== null) return number;
  }
  return null;
}

function createUpstreamError(reason) {
  const error = new Error("Yahoo Finance fundamentals are unavailable.");
  error.reason = reason;
  return error;
}
