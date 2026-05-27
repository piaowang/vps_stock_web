const REGIONS = [
  {
    title: '美国',
    items: [
      { symbol: '^GSPC', label: '标普 500' },
      { symbol: '^IXIC', label: '纳斯达克' },
      { symbol: '^DJI', label: '道琼斯' },
      { symbol: '^VIX', label: 'VIX 波动率' },
    ],
  },
  {
    title: '中国',
    items: [
      { symbol: '^SSEC', label: '上证指数' },
      { symbol: '^HSI', label: '恒生指数' },
    ],
  },
  {
    title: '日本',
    items: [{ symbol: '^N225', label: '日经 225' }],
  },
  {
    title: '韩国',
    items: [{ symbol: '^KS11', label: 'KOSPI 综合' }],
  },
];

const SUMMARY_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'NVDA'];
const ALL_SYMBOLS = [...new Set([
  ...REGIONS.flatMap((r) => r.items.map((i) => i.symbol)),
  ...SUMMARY_SYMBOLS,
])];

const fmt = (n) => Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const pct = (n) => `${n >= 0 ? '+' : ''}${Number(n || 0).toFixed(2)}%`;
const tone = (n) => (n > 0.001 ? 'up' : n < -0.001 ? 'down' : 'flat');

async function quote(symbol) {
  const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`${symbol} HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok || !json.data) throw new Error(`${symbol} empty payload`);
  return json.data;
}

function cardHtml(item, q) {
  const cls = q ? tone(q.changePct) : 'flat';
  return `<section class="card"><div class="k">${item.label}</div><div class="v">${q ? fmt(q.price) : '--'}</div><div class="${cls}">${q ? pct(q.changePct) : '--'}</div></section>`;
}

function renderRegions(map) {
  document.getElementById('regionMarkets').innerHTML = REGIONS.map((region) => {
    const cards = region.items.map((item) => cardHtml(item, map[item.symbol])).join('');
    return `<section class="region"><h2 class="region__title">${region.title}</h2><div class="grid">${cards}</div></section>`;
  }).join('');
}

function regionStats(map) {
  return REGIONS.map((region) => {
    const quotes = region.items.map((i) => map[i.symbol]).filter(Boolean);
    const rising = quotes.filter((q) => q.changePct > 0).length;
    return { title: region.title, rising, total: quotes.length };
  });
}

function renderSummary(map, quotes) {
  const stats = regionStats(map);
  const rising = quotes.filter((q) => q.changePct > 0).length;
  const vix = map['^VIX'];
  const riskOn = rising >= Math.ceil(quotes.length * 0.55) && (!vix || vix.changePct <= 0);
  const sentiment = riskOn ? '全球偏多' : rising >= Math.ceil(quotes.length * 0.4) ? '区域分化' : '整体偏谨慎';
  const sentimentClass = riskOn ? 'up' : rising >= Math.ceil(quotes.length * 0.4) ? 'flat' : 'down';

  document.getElementById('sentimentValue').textContent = sentiment;
  document.getElementById('sentimentValue').className = `v ${sentimentClass}`;
  document.getElementById('sentimentLine1').textContent =
    `中/日/韩/美主要指数中 ${rising}/${quotes.length} 个上涨。`;
  document.getElementById('sentimentLine2').textContent = vix
    ? `美国 VIX ${fmt(vix.price)}，涨跌幅 ${pct(vix.changePct)}。`
    : 'VIX 暂无数据。';
  document.getElementById('sentimentLine3').textContent = '数据来自后端聚合接口，仅供观察。';

  document.getElementById('breadthValue').textContent = stats
    .map((s) => `${s.title} ${s.rising}/${s.total}`)
    .join(' · ');
  document.getElementById('breadthLine1').textContent = '中国：上证与恒生代表 A 股与港股情绪。';
  document.getElementById('breadthLine2').textContent = '日本：日经 225 代表东证主板风格。';
  document.getElementById('breadthLine3').textContent = '韩国：KOSPI 代表首尔综合指数。';

  document.getElementById('activityValue').textContent = riskOn ? '风险偏好回升' : '观望为主';
  document.getElementById('activityLine1').textContent = '美国 SPY / QQQ / DIA 观察宽基与风格。';
  document.getElementById('activityLine2').textContent = 'NVDA 等龙头用于观察科技链条。';
  document.getElementById('activityLine3').textContent = '亚太与美股指数可对照观察联动。';
}

async function loadMarket() {
  const settled = await Promise.allSettled(ALL_SYMBOLS.map((symbol) => quote(symbol)));
  const quotes = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const indexQuotes = quotes.filter((q) => REGIONS.some((r) => r.items.some((i) => i.symbol === q.symbol)));
  if (!indexQuotes.length) throw new Error('没有拿到市场行情');

  const map = Object.fromEntries(quotes.map((q) => [q.symbol, q]));
  renderRegions(map);
  renderSummary(map, indexQuotes);
  document.getElementById('marketUpdated').textContent =
    `全球主要市场快照（真实行情） · 更新时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`;
}

loadMarket().catch((err) => {
  document.getElementById('marketUpdated').textContent = `行情加载失败：${err.message}`;
});
