const { getMarket } = require('./markets');

const DEFAULT_RANGE = '5y';

function withReturn(history, meta = {}) {
  if (!history?.points?.length) return null;
  const startPrice = history.startPrice;
  const endPrice = history.endPrice;
  return {
    ...meta,
    symbol: history.symbol,
    range: history.range,
    startPrice,
    endPrice,
    returnPct: history.returnPct,
    points: history.points,
  };
}

async function loadIndexHistory(service, item, range) {
  try {
    const history = await service.getHistory(item.symbol, range);
    return withReturn(history, { label: item.label, kind: 'index' });
  } catch (err) {
    if (!item.fallback) return { symbol: item.symbol, label: item.label, kind: 'index', error: err.message };
    try {
      const history = await service.getHistory(item.fallback, range);
      return withReturn(history, { label: item.label, kind: 'index', symbol: item.symbol });
    } catch (fallbackErr) {
      return { symbol: item.symbol, label: item.label, kind: 'index', error: fallbackErr.message };
    }
  }
}

class HistoryService {
  constructor({ cache, provider, range = DEFAULT_RANGE }) {
    this.cache = cache;
    this.provider = provider;
    this.range = range;
  }

  cacheKey(symbol, range) {
    return `${symbol}:${range || this.range}`;
  }

  async getHistory(symbol, range = this.range) {
    const key = this.cacheKey(symbol, range);
    return this.cache.getOrFetch(key, () => this.provider.fetchHistoryFromYahoo(symbol, range));
  }

  async getMarketDetail(marketId, range = this.range) {
    const market = getMarket(marketId);
    const indexJobs = market.indices.map((item) => loadIndexHistory(this, item, range));
    const stockJobs = market.stocks.map(async (item) => {
      try {
        const history = await this.getHistory(item.symbol, range);
        return withReturn(history, { name: item.name, kind: 'stock' });
      } catch (err) {
        return { symbol: item.symbol, name: item.name, kind: 'stock', error: err.message };
      }
    });

    const [indexResults, stockResults] = await Promise.all([
      Promise.all(indexJobs),
      Promise.all(stockJobs),
    ]);

    const indices = indexResults.filter(Boolean);
    const ranked = stockResults
      .filter((item) => item && item.returnPct != null && !Number.isNaN(item.returnPct))
      .sort((a, b) => b.returnPct - a.returnPct);

    const primary = indices.find((item) => item.symbol === market.primarySymbol)
      || indices.find((item) => item.points?.length);

    return {
      id: market.id,
      title: market.title,
      flag: market.flag,
      range,
      primarySymbol: market.primarySymbol,
      chart: primary?.points ? {
        symbol: primary.symbol,
        label: primary.label,
        points: primary.points,
        returnPct: primary.returnPct,
        startPrice: primary.startPrice,
        endPrice: primary.endPrice,
      } : null,
      indices: indices.map(({ points, ...rest }) => rest),
      topStocks: ranked.map(({ points, ...rest }) => rest),
      errors: [...indices, ...stockResults]
        .filter((item) => item?.error)
        .map((item) => ({ symbol: item.symbol, error: item.error })),
    };
  }
}

module.exports = {
  HistoryService,
  DEFAULT_RANGE,
};
