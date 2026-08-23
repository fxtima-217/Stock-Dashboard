const YAHOO_CHART_HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
const ALLOWED_RANGES = new Set(["5d", "1mo"]);
const TICKER_PATTERN = /^[A-Z0-9.^=-]{1,15}$/i;

module.exports = async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const ticker = typeof request.query.ticker === "string" ? request.query.ticker.trim() : "";
  const range = typeof request.query.range === "string" ? request.query.range : "5d";

  if (!TICKER_PATTERN.test(ticker) || !ALLOWED_RANGES.has(range)) {
    return response.status(400).json({ error: "Invalid ticker or range." });
  }

  let lastStatus = 502;

  for (const host of YAHOO_CHART_HOSTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const url = new URL(`https://${host}/v8/finance/chart/${encodeURIComponent(ticker)}`);
    url.searchParams.set("interval", "1d");
    url.searchParams.set("range", range);

    try {
      const yahooResponse = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; StockDashboard/1.0)",
        },
        signal: controller.signal,
      });

      lastStatus = yahooResponse.status;

      if (yahooResponse.ok) {
        const data = await yahooResponse.json();
        response.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
        return response.status(200).json(data);
      }

      // An unknown ticker will not succeed on the fallback host either.
      if (yahooResponse.status === 400 || yahooResponse.status === 404) {
        return response.status(yahooResponse.status).json({ error: "Ticker not found." });
      }
    } catch (error) {
      // Try the second Yahoo host after a timeout or temporary network failure.
      lastStatus = 502;
    } finally {
      clearTimeout(timeout);
    }
  }

  return response.status(lastStatus === 429 ? 503 : 502).json({
    error: "Market data is temporarily unavailable.",
  });
};
