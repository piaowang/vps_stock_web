const TRACKED = [
  { symbol: '^IXIC', label: '纳斯达克指数' },
  { symbol: '^GSPC', label: '标普 500' },
  { symbol: '^DJI', label: '道琼斯' },
  { symbol: '^VIX', label: 'VIX 波动率' },
  { symbol: 'SPY', label: 'SPY' },
  { symbol: 'QQQ', label: 'QQQ' },
  { symbol: 'DIA', label: 'DIA' },
  { symbol: 'NVDA', label: 'NVDA' },
];

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

function renderCards(quotes) {
  const map = Object.fromEntries(quotes.map((q) => [q.symbol, q]));
  const cards = TRACKED.slice(0, 4).map((item) => {
    const q = map[item.symbol];
    const cls = tone(q?.changePct);
    return `<section class="card"><div class="k">${item.label}</div><div class="v">${fmt(q?.price)}</div><div class="${cls}">${pct(q?.changePct)}</div></section>`;
  });
  document.getElementById('marketGrid').innerHTML = cards.join('');
}

function renderSummary(quotes) {
  const rising = quotes.filter((q) => q.changePct > 0).length;
  const vix = quotes.find((q) => q.symbol === '^VIX');
  const riskOn = rising >= 5 && (!vix || vix.changePct <= 0);
  const sentiment = riskOn ? '偏多' : rising >= 4 ? '震荡' : '偏谨慎';
  const sentimentClass = riskOn ? 'up' : rising >= 4 ? 'flat' : 'down';

  const sentimentValue = document.getElementById('sentimentValue');
  sentimentValue.textContent = sentiment;
  sentimentValue.className = `v ${sentimentClass}`;
  document.getElementById('sentimentLine1').textContent = `跟踪标的中 ${rising}/${quotes.length} 个上涨。`;
  document.getElementById('sentimentLine2').textContent = vix ? `VIX 当前 ${fmt(vix.price)}，涨跌幅 ${pct(vix.changePct)}。` : 'VIX 暂无数据。';
  document.getElementById('sentimentLine3').textContent = '基于实时行情简单估算，仅供观察。';

  document.getElementById('breadthValue').textContent = `${quotes.length} 选 ${rising} 上涨`;
  document.getElementById('breadthLine1').textContent = '科技成长参考 QQQ 与 NVDA。';
  document.getElementById('breadthLine2').textContent = '宽基市场参考 SPY、DIA 与主要指数。';
  document.getElementById('breadthLine3').textContent = '后续可加入行业 ETF 扩展热度面。';

  document.getElementById('activityValue').textContent = riskOn ? '活跃' : '观望';
  document.getElementById('activityLine1').textContent = 'SPY 代表标普宽基风险偏好。';
  document.getElementById('activityLine2').textContent = 'QQQ 代表纳斯达克科技风格。';
  document.getElementById('activityLine3').textContent = 'DIA 代表道琼斯蓝筹风格。';
}

async function loadMarket() {
  const settled = await Promise.allSettled(TRACKED.map((item) => quote(item.symbol)));
  const quotes = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  if (!quotes.length) throw new Error('没有拿到市场行情');
  renderCards(quotes);
  renderSummary(quotes);
  document.getElementById('marketUpdated').textContent = `美股盘中快照（真实行情） · 更新时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`;
}

loadMarket().catch((err) => {
  document.getElementById('marketUpdated').textContent = `行情加载失败：${err.message}`;
});
