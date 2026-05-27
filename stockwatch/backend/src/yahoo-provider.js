const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

function buildUrl(symbol) {
  const encoded = encodeURIComponent(symbol);
  return `${YAHOO_BASE}/${encoded}?interval=5m&range=1d`;
}

function mapHistory(result) {
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  return timestamps
    .map((ts, idx) => ({ t: ts * 1000, p: closes[idx] }))
    .filter((point) => point.p != null);
}

async function fetchQuoteFromYahoo(symbol) {
  const res = await fetch(buildUrl(symbol));
  if (!res.ok) {
    throw new Error(`Yahoo quote request failed: HTTP ${res.status}`);
  }

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    throw new Error('Yahoo quote payload missing chart.result');
  }

  const meta = result.meta || {};
  const price = meta.regularMarketPrice ?? meta.previousClose;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

  return {
    symbol,
    price: Number(price ?? 0),
    changePct,
    previousClose: Number(prevClose ?? 0),
    updatedAt: new Date(
      meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now()
    ).toISOString(),
    history: mapHistory(result),
    source: 'yahoo',
  };
}

module.exports = {
  fetchQuoteFromYahoo,
};
