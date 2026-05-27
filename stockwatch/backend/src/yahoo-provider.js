const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

function buildUrl(symbol, { interval = '5m', range = '1d' } = {}) {
  const encoded = encodeURIComponent(symbol);
  return `${YAHOO_BASE}/${encoded}?interval=${interval}&range=${range}`;
}

function mapHistory(result) {
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  return timestamps
    .map((ts, idx) => ({ t: ts * 1000, p: closes[idx] }))
    .filter((point) => point.p != null);
}

function calcReturn(points) {
  if (!points.length) {
    return { startPrice: 0, endPrice: 0, returnPct: 0 };
  }
  const startPrice = Number(points[0].p);
  const endPrice = Number(points[points.length - 1].p);
  const returnPct = startPrice ? ((endPrice - startPrice) / startPrice) * 100 : 0;
  return { startPrice, endPrice, returnPct };
}

async function fetchChart(symbol, options) {
  const res = await fetch(buildUrl(symbol, options));
  if (!res.ok) {
    throw new Error(`Yahoo chart request failed: HTTP ${res.status}`);
  }
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    throw new Error('Yahoo chart payload missing chart.result');
  }
  return result;
}

async function fetchQuoteFromYahoo(symbol) {
  const result = await fetchChart(symbol, { interval: '5m', range: '1d' });
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

async function fetchHistoryFromYahoo(symbol, range = '5y') {
  const result = await fetchChart(symbol, { interval: '1mo', range });
  const points = mapHistory(result);
  const { startPrice, endPrice, returnPct } = calcReturn(points);

  return {
    symbol,
    range,
    points,
    startPrice,
    endPrice,
    returnPct,
    source: 'yahoo',
  };
}

module.exports = {
  fetchQuoteFromYahoo,
  fetchHistoryFromYahoo,
};
