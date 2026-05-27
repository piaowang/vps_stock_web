const express = require('express');
const http = require('http');
const { QuoteCache } = require('./src/quote-cache');
const { QuoteService } = require('./src/quote-service');
const { fetchQuoteFromYahoo } = require('./src/yahoo-provider');
const { createWsHub } = require('./src/ws-hub');
const { SUPPORTED_SYMBOLS, assertSymbol } = require('./src/symbols');

const PORT = Number(process.env.AGG_PORT || 8090);
const POLL_MS = 5000;

const cache = new QuoteCache(POLL_MS);
const quoteService = new QuoteService({
  cache,
  provider: { fetchQuoteFromYahoo },
});

const app = express();
app.disable('x-powered-by');

const allowedOrigins = String(process.env.CORS_ALLOW_ORIGINS || '*')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowAll = allowedOrigins.includes('*');
  if (allowAll) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'stockwatch-aggregator',
    pollMs: POLL_MS,
    supportedSymbols: SUPPORTED_SYMBOLS,
  });
});

app.get('/api/quote', async (req, res, next) => {
  try {
    const symbol = assertSymbol(req.query.symbol);
    const quote = await quoteService.getQuote(symbol, { force: false });
    res.json({
      ok: true,
      data: quote,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/quotes', async (req, res, next) => {
  try {
    const { quotes, errors } = await quoteService.refreshAll(false);
    res.json({
      ok: errors.length === 0,
      data: quotes,
      errors,
    });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    ok: false,
    error: err.message || 'Internal Server Error',
    ...(err.details ? { details: err.details } : {}),
  });
});

const server = http.createServer(app);
const wsHub = createWsHub({
  server,
  path: '/ws',
  quoteService,
  pollMs: POLL_MS,
});

async function pollAndBroadcast() {
  const { quotes, errors } = await quoteService.refreshAll(true);
  wsHub.broadcast({
    type: 'quote:update',
    data: quotes,
    errors,
    ts: Date.now(),
  });
}

function schedulePolling() {
  setInterval(() => {
    pollAndBroadcast().catch((err) => {
      console.error('[aggregator] polling failed:', err.message || err);
    });
  }, POLL_MS);
}

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`[aggregator] listening on http://0.0.0.0:${PORT}`);
  console.log(`[aggregator] REST GET /api/quote?symbol=AAPL`);
  console.log(`[aggregator] WS   ws://0.0.0.0:${PORT}/ws`);

  pollAndBroadcast().catch((err) => {
    console.error('[aggregator] initial polling failed:', err.message || err);
  });
  schedulePolling();
});
