const REFRESH_MS = 5000;
const WATCHLIST = [
  { symbol: '^IXIC', name: 'NASDAQ Composite', group: 'index', base: 19800 },
  { symbol: '^GSPC', name: 'S&P 500 Index', group: 'index', base: 5800 },
  { symbol: 'AAPL', name: 'Apple Inc.', group: 'stock', base: 228 },
  { symbol: 'TSLA', name: 'Tesla Inc.', group: 'stock', base: 248 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', group: 'stock', base: 135 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', group: 'stock', base: 580 },
];
const state = { quotes: {}, chart: null, demo: false };
const $ = (id) => document.getElementById(id);
const indexGrid = $('indexGrid');
const stockGrid = $('stockGrid');
const statusEl = $('connectionStatus');
const refreshEl = $('lastRefresh');
const modal = $('chartModal');
const modalTitle = $('modalTitle');
const modalSubtitle = $('modalSubtitle');
const bootError = $('bootError');

const t = (d = new Date()) => d.toLocaleTimeString('zh-CN', { hour12: false });
const pc = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const money = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cls = (n) => (n > 0.001 ? 'stock-card__change--up' : n < -0.001 ? 'stock-card__change--down' : 'stock-card__change--flat');

function demoQuote(item) {
  const anchor = state.quotes[item.symbol]?.price || item.base;
  const price = Math.max(0.01, anchor + (Math.random() - 0.5) * anchor * 0.004);
  const changePct = ((price - anchor) / anchor) * 100;
  const now = Date.now();
  const history = Array.from({ length: 48 }, (_, i) => ({ t: now - (47 - i) * 300000, p: price + (Math.random() - 0.5) * anchor * 0.008 }));
  return { symbol: item.symbol, price, changePct, updatedAt: new Date().toISOString(), history };
}

async function pullQuote(symbol) {
  const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json?.ok || !json?.data) throw new Error('bad payload');
  return json.data;
}

function render() {
  indexGrid.innerHTML = '';
  stockGrid.innerHTML = '';
  WATCHLIST.forEach((item) => {
    const q = state.quotes[item.symbol];
    if (!q) return;
    const el = document.createElement('article');
    el.className = `stock-card${item.group === 'index' ? ' stock-card--index' : ''}`;
    el.innerHTML = `<div class="stock-card__symbol">${item.symbol.replace('^', '')}</div><div class="stock-card__name">${item.name}</div><div class="stock-card__price">${money(q.price)}</div><div class="stock-card__change ${cls(q.changePct)}">${pc(q.changePct)}</div><div class="stock-card__time">更新 ${t()}</div>`;
    el.addEventListener('click', () => openChart(item));
    (item.group === 'index' ? indexGrid : stockGrid).appendChild(el);
  });
}

function setStatus(mode) {
  if (mode === 'live') {
    statusEl.textContent = '实时行情';
    statusEl.className = 'status-badge status-badge--live';
  } else {
    statusEl.textContent = '后端不可用，使用本地演示';
    statusEl.className = 'status-badge status-badge--demo';
  }
  refreshEl.textContent = `上次刷新 ${t()}`;
}

async function refreshAll() {
  const results = await Promise.allSettled(WATCHLIST.map((w) => pullQuote(w.symbol)));
  let ok = 0;
  WATCHLIST.forEach((item, i) => {
    const r = results[i];
    if (r.status === 'fulfilled') {
      state.quotes[item.symbol] = r.value;
      ok += 1;
      return;
    }
    state.quotes[item.symbol] = state.quotes[item.symbol] || demoQuote(item);
  });
  state.demo = ok === 0;
  if (state.demo) WATCHLIST.forEach((item) => { state.quotes[item.symbol] = demoQuote(item); });
  setStatus(state.demo ? 'demo' : 'live');
  render();
}

function openChart(item) {
  const q = state.quotes[item.symbol];
  if (!q || !window.Chart) return;
  modalTitle.textContent = `${item.symbol.replace('^', '')} · ${item.name}`;
  modalSubtitle.textContent = `${money(q.price)}  ${pc(q.changePct)}`;
  modal.classList.add('modal--open');
  modal.setAttribute('aria-hidden', 'false');
  if (state.chart) state.chart.destroy();
  state.chart = new Chart($('priceChart'), {
    type: 'line',
    data: {
      labels: q.history.map((h) => new Date(h.t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })),
      datasets: [{ data: q.history.map((h) => h.p), borderColor: q.changePct >= 0 ? '#16c784' : '#ea3943', pointRadius: 0, borderWidth: 2, tension: 0.3 }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });
}

function initWs() {
  const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${wsProto}://${location.host}/ws`);
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg?.type !== 'quote:update' || !Array.isArray(msg?.data)) return;
    msg.data.forEach((q) => { state.quotes[q.symbol] = q; });
    setStatus('live');
    render();
  };
}

function initModal() {
  modal.querySelectorAll('[data-close]').forEach((x) => x.addEventListener('click', () => {
    modal.classList.remove('modal--open');
    modal.setAttribute('aria-hidden', 'true');
  }));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && modal.classList.remove('modal--open'));
}

async function init() {
  initModal();
  WATCHLIST.forEach((item) => { state.quotes[item.symbol] = demoQuote(item); });
  render();
  try {
    await refreshAll();
    initWs();
    setInterval(refreshAll, REFRESH_MS);
  } catch (err) {
    bootError.hidden = false;
    bootError.textContent = `初始化失败：${err.message}`;
    setStatus('demo');
  }
}

init();
