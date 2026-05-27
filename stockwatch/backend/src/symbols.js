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
];

function normalizeSymbol(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase();
}

function assertSymbol(raw) {
  const symbol = normalizeSymbol(raw);
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
  assertSymbol,
  normalizeSymbol,
};
