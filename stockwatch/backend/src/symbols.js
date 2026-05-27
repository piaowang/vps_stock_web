const SUPPORTED_SYMBOLS = [
  'AAPL',
  'TSLA',
  'NVDA',
  'MSFT',
  'AMZN',
  'META',
  'SPY',
  'QQQ',
  'DIA',
  '^IXIC',
  '^GSPC',
  '^DJI',
  '^VIX',
  '000001.SS',
  '^HSI',
  '^N225',
  '^KS11',
];

const SYMBOL_ALIASES = {
  '^SSEC': '000001.SS',
};

function normalizeSymbol(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase();
}

function resolveSymbol(raw) {
  const symbol = normalizeSymbol(raw);
  return SYMBOL_ALIASES[symbol] || symbol;
}

function assertSymbol(raw) {
  const symbol = resolveSymbol(raw);
  if (!SUPPORTED_SYMBOLS.includes(symbol)) {
    const err = new Error(`Unsupported symbol: ${raw}`);
    err.statusCode = 400;
    err.details = {
      supported: SUPPORTED_SYMBOLS,
      message: `Supported symbols: ${SUPPORTED_SYMBOLS.join(', ')}.`,
    };
    throw err;
  }
  return symbol;
}

module.exports = {
  SUPPORTED_SYMBOLS,
  SYMBOL_ALIASES,
  assertSymbol,
  normalizeSymbol,
  resolveSymbol,
};
