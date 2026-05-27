const MARKETS = {
  us: {
    id: 'us',
    title: '美国',
    flag: 'US',
    primarySymbol: '^GSPC',
    indices: [
      { symbol: '^GSPC', label: '标普 500' },
      { symbol: '^IXIC', label: '纳斯达克' },
      { symbol: '^DJI', label: '道琼斯' },
      { symbol: '^VIX', label: 'VIX 波动率' },
    ],
    stocks: [
      { symbol: 'NVDA', name: 'NVIDIA' },
      { symbol: 'AAPL', name: 'Apple' },
      { symbol: 'MSFT', name: 'Microsoft' },
      { symbol: 'META', name: 'Meta' },
      { symbol: 'AMZN', name: 'Amazon' },
      { symbol: 'GOOGL', name: 'Alphabet' },
      { symbol: 'AVGO', name: 'Broadcom' },
      { symbol: 'LLY', name: 'Eli Lilly' },
      { symbol: 'JPM', name: 'JPMorgan' },
      { symbol: 'TSLA', name: 'Tesla' },
    ],
  },
  cn: {
    id: 'cn',
    title: '中国',
    flag: 'CN',
    primarySymbol: '000001.SS',
    indices: [
      { symbol: '000001.SS', label: '上证指数', fallback: '^SSEC' },
      { symbol: '^HSI', label: '恒生指数' },
    ],
    stocks: [
      { symbol: '600519.SS', name: '贵州茅台' },
      { symbol: '601318.SS', name: '中国平安' },
      { symbol: '600036.SS', name: '招商银行' },
      { symbol: '000858.SZ', name: '五粮液' },
      { symbol: '0700.HK', name: '腾讯控股' },
      { symbol: '9988.HK', name: '阿里巴巴' },
      { symbol: '3690.HK', name: '美团' },
      { symbol: '1810.HK', name: '小米集团' },
    ],
  },
  jp: {
    id: 'jp',
    title: '日本',
    flag: 'JP',
    primarySymbol: '^N225',
    indices: [{ symbol: '^N225', label: '日经 225' }],
    stocks: [
      { symbol: '7203.T', name: '丰田汽车' },
      { symbol: '6758.T', name: '索尼' },
      { symbol: '6861.T', name: '基恩士' },
      { symbol: '9984.T', name: '软银集团' },
      { symbol: '8306.T', name: '三菱 UFJ' },
      { symbol: '4063.T', name: '信越化学' },
    ],
  },
  kr: {
    id: 'kr',
    title: '韩国',
    flag: 'KR',
    primarySymbol: '^KS11',
    indices: [{ symbol: '^KS11', label: 'KOSPI 综合' }],
    stocks: [
      { symbol: '005930.KS', name: '三星电子' },
      { symbol: '000660.KS', name: 'SK 海力士' },
      { symbol: '035420.KS', name: 'NAVER' },
      { symbol: '051910.KS', name: 'LG 化学' },
      { symbol: '005380.KS', name: '现代汽车' },
      { symbol: '035720.KS', name: 'Kakao' },
    ],
  },
};

function getMarket(id) {
  const market = MARKETS[String(id || '').toLowerCase()];
  if (!market) {
    const err = new Error(`Unknown market: ${id}`);
    err.statusCode = 404;
    err.details = { markets: Object.keys(MARKETS) };
    throw err;
  }
  return market;
}

function collectHistorySymbols() {
  const set = new Set();
  Object.values(MARKETS).forEach((market) => {
    market.indices.forEach((item) => {
      set.add(item.symbol);
      if (item.fallback) set.add(item.fallback);
    });
    market.stocks.forEach((item) => set.add(item.symbol));
  });
  return [...set];
}

function assertHistorySymbol(raw) {
  const { resolveSymbol } = require('./symbols');
  const symbol = resolveSymbol(raw);
  const allowed = collectHistorySymbols();
  if (!allowed.includes(symbol)) {
    const err = new Error(`Unsupported history symbol: ${raw}`);
    err.statusCode = 400;
    throw err;
  }
  return symbol;
}

module.exports = {
  MARKETS,
  getMarket,
  collectHistorySymbols,
  assertHistorySymbol,
};
