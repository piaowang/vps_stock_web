class QuoteCache {
  constructor(ttlMs = 5000) {
    this.ttlMs = ttlMs;
    this.store = new Map();
    this.inFlight = new Map();
  }

  getEntry(symbol) {
    return this.store.get(symbol) || null;
  }

  isFresh(symbol) {
    const entry = this.getEntry(symbol);
    if (!entry) return false;
    return Date.now() - entry.cachedAt < this.ttlMs;
  }

  set(symbol, quote) {
    this.store.set(symbol, {
      quote,
      cachedAt: Date.now(),
    });
    return quote;
  }

  async getOrFetch(symbol, fetcher, options = {}) {
    const force = Boolean(options.force);
    if (!force && this.isFresh(symbol)) {
      return this.getEntry(symbol).quote;
    }

    if (this.inFlight.has(symbol)) {
      return this.inFlight.get(symbol);
    }

    const promise = (async () => {
      try {
        const quote = await fetcher(symbol);
        return this.set(symbol, quote);
      } finally {
        this.inFlight.delete(symbol);
      }
    })();

    this.inFlight.set(symbol, promise);
    return promise;
  }

  getSnapshot(symbols) {
    return symbols
      .map((symbol) => {
        const entry = this.getEntry(symbol);
        return entry ? entry.quote : null;
      })
      .filter(Boolean);
  }
}

module.exports = {
  QuoteCache,
};
