const REGIONS = [
  { id: 'us', title: '美国', flag: 'US', items: [
    { symbol: '^GSPC', label: '标普 500' }, { symbol: '^IXIC', label: '纳斯达克' },
    { symbol: '^DJI', label: '道琼斯' }, { symbol: '^VIX', label: 'VIX 波动率' },
  ]},
  { id: 'cn', title: '中国', flag: 'CN', items: [
    { symbol: '000001.SS', label: '上证指数', fallback: '^SSEC' },
    { symbol: '^HSI', label: '恒生指数' },
  ]},
  { id: 'jp', title: '日本', flag: 'JP', items: [{ symbol: '^N225', label: '日经 225' }] },
  { id: 'kr', title: '韩国', flag: 'KR', items: [{ symbol: '^KS11', label: 'KOSPI 综合' }] },
];

const EXTRA = ['SPY', 'QQQ', 'DIA', 'NVDA'];
const REFRESH_MS = 30000;

const $ = (id) => document.getElementById(id);
const setText = (id, text) => { const el = $(id); if (el) el.textContent = text; };
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) => `${n >= 0 ? '+' : ''}${Number(n || 0).toFixed(2)}%`;
const tone = (n) => (n > 0.001 ? 'up' : n < -0.001 ? 'down' : 'flat');

async function fetchQuote(symbol) {
  const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`${symbol} HTTP ${res.status}`);
  const json = await res.json();
  if (!json?.ok || !json?.data) throw new Error(`${symbol} empty`);
  return json.data;
}

async function loadItemQuote(item) {
  try {
    return await fetchQuote(item.symbol);
  } catch (err) {
    if (!item.fallback) throw err;
    const data = await fetchQuote(item.fallback);
    return { ...data, symbol: item.symbol };
  }
}

function card(item, q, regionId) {
  const cls = q ? tone(q.changePct) : 'flat';
  const href = `/market/detail.html?id=${regionId}`;
  return `<a href="${href}" class="quote-card quote-card--link quote-card--${cls}" aria-label="${item.label} 5 年回顾">
    <div class="quote-card__code">${item.symbol.replace('^', '')}</div>
    <div class="quote-card__name">${item.label}</div>
    <div class="quote-card__price">${q ? fmt(q.price) : '--'}</div>
    <div class="quote-card__change ${cls}">${q ? pct(q.changePct) : '--'}</div>
    <div class="quote-card__hint">5 年走势 →</div>
  </a>`;
}

function renderRegions(map) {
  const root = $('regionMarkets');
  if (!root) throw new Error('页面结构缺失 regionMarkets');
  root.innerHTML = REGIONS.map((region) => `
    <section class="region">
      <div class="region__head">
        <span class="region__flag">${region.flag}</span>
        <h2 class="region__title">${region.title}</h2>
      </div>
      <div class="quote-grid">${region.items.map((item) => card(item, map[item.symbol], region.id)).join('')}</div>
    </section>`).join('');
}

function renderStats(quotes) {
  const up = quotes.filter((q) => q.changePct > 0.001).length;
  const down = quotes.filter((q) => q.changePct < -0.001).length;
  setText('statUp', String(up));
  setText('statDown', String(down));
  setText('statFlat', String(quotes.length - up - down));
}

function renderSummary(map, quotes) {
  const stats = REGIONS.map((region) => {
    const items = region.items.map((i) => map[i.symbol]).filter(Boolean);
    return `${region.title} ${items.filter((q) => q.changePct > 0).length}/${items.length}`;
  });
  const rising = quotes.filter((q) => q.changePct > 0).length;
  const vix = map['^VIX'];
  const riskOn = rising >= Math.ceil(quotes.length * 0.55) && (!vix || vix.changePct <= 0);
  const mood = riskOn ? '全球偏多' : rising >= Math.ceil(quotes.length * 0.4) ? '区域分化' : '整体偏谨慎';
  const moodEl = $('sentimentValue');
  if (moodEl) {
    moodEl.textContent = mood;
    moodEl.className = `insight-card__value ${riskOn ? 'up' : rising >= Math.ceil(quotes.length * 0.4) ? 'flat' : 'down'}`;
  }
  setText('sentimentLine1', `中/日/韩/美指数 ${rising}/${quotes.length} 上涨。`);
  setText('sentimentLine2', vix ? `VIX ${fmt(vix.price)} (${pct(vix.changePct)})` : 'VIX 暂无数据');
  setText('breadthValue', stats.join(' · '));
  setText('activityValue', riskOn ? '风险偏好回升' : '观望为主');
}

function showError(msg) {
  const el = $('marketError');
  if (el) { el.hidden = false; el.textContent = msg; }
  setText('marketUpdated', '行情加载失败');
}

async function loadMarket() {
  const items = REGIONS.flatMap((r) => r.items);
  const itemSettled = await Promise.allSettled(items.map(loadItemQuote));
  const extraSettled = await Promise.allSettled(EXTRA.map(fetchQuote));
  const itemQuotes = itemSettled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const extraQuotes = extraSettled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  if (!itemQuotes.length) throw new Error('没有拿到市场行情');

  const quotes = [...itemQuotes, ...extraQuotes];
  const map = Object.fromEntries(quotes.map((q) => [q.symbol, q]));
  renderRegions(map);
  renderStats(itemQuotes);
  renderSummary(map, itemQuotes);
  const err = $('marketError');
  if (err) err.hidden = true;
  setText('marketUpdated', `更新 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`);
  setText('marketLive', '实时行情');
}

loadMarket().catch((err) => showError(err.message));
setInterval(() => loadMarket().catch((err) => showError(err.message)), REFRESH_MS);
