const { SUPPORTED_SYMBOLS } = require('./symbols');

class QuoteService {
  constructor({ cache, provider }) {
    this.cache = cache;
    this.provider = provider;
  }

  async getQuote(symbol, options = {}) {
    return this.cache.getOrFetch(
      symbol,
      (sym) => this.provider.fetchQuoteFromYahoo(sym),
      options
    );
  }

  async refreshAll(force = true) {
    const results = await Promise.allSettled(
      SUPPORTED_SYMBOLS.map((symbol) => this.getQuote(symbol, { force }))
    );

    const quotes = [];
    const errors = [];
    results.forEach((result, idx) => {
      const symbol = SUPPORTED_SYMBOLS[idx];
      if (result.status === 'fulfilled') {
        quotes.push(result.value);
      } else {
        errors.push({
          symbol,
          error: String(result.reason?.message || result.reason),
        });
      }
    });

    return { quotes, errors };
  }

  getCachedSnapshot() {
    return this.cache.getSnapshot(SUPPORTED_SYMBOLS);
  }
}

module.exports = {
  QuoteService,
};
