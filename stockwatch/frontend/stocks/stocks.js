const WATCHLIST = [
  { symbol: 'AAPL', name: 'Apple Inc.', note: '消费电子龙头', tag: '美股核心资产' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', note: '云与企业软件', tag: '科技成长' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', note: 'AI 产业链核心', tag: '科技成长' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', note: '电商 + 云服务', tag: '科技成长' },
  { symbol: 'META', name: 'Meta Platforms', note: '广告与 AI 应用', tag: '科技成长' },
  { symbol: 'TSLA', name: 'Tesla Inc.', note: '高波动成长', tag: '风险分层' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', note: '宽基指数 ETF', tag: '高流动性 ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', note: '纳斯达克 100 ETF', tag: '高流动性 ETF' },
  { symbol: 'DIA', name: 'SPDR Dow Jones ETF', note: '道琼斯 ETF', tag: '高流动性 ETF' },
];

const TAGS = ['全部', ...new Set(WATCHLIST.map((item) => item.tag))];

let activeTag = '全部';
let quoteMap = {};

const fmt = (n) => Number(n || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const pct = (n) => `${n >= 0 ? '+' : ''}${Number(n || 0).toFixed(2)}%`;
const tone = (n) => (n > 0.001 ? 'up' : n < -0.001 ? 'down' : 'flat');
const timeText = (iso) => new Date(iso || Date.now()).toLocaleString('zh-CN', { hour12: false });

async function loadQuotes() {
  const res = await fetch('/api/quotes');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json?.data?.length) throw new Error('empty payload');
  return Object.fromEntries(json.data.map((q) => [q.symbol, q]));
}

function filteredList() {
  if (activeTag === '全部') return WATCHLIST;
  return WATCHLIST.filter((item) => item.tag === activeTag);
}

function renderChips() {
  const root = document.getElementById('stockChips');
  root.innerHTML = TAGS.map((tag) => {
    const cls = tag === activeTag ? 'chip chip--active' : 'chip';
    return `<button type="button" class="${cls}" data-tag="${tag}">${tag}</button>`;
  }).join('');

  root.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTag = btn.dataset.tag;
      renderChips();
      renderTable();
    });
  });
}

function renderTable() {
  const list = filteredList();
  const rows = list.map((item) => {
    const q = quoteMap[item.symbol];
    if (!q) {
      return `<tr><td>${item.symbol}</td><td>${item.name}</td><td colspan="4" class="muted">暂无数据</td></tr>`;
    }
    const cls = tone(q.changePct);
    return `<tr>
      <td>${item.symbol}</td>
      <td>${item.name}</td>
      <td>${fmt(q.price)}</td>
      <td class="${cls}">${pct(q.changePct)}</td>
      <td>${fmt(q.previousClose)}</td>
      <td>${item.note}</td>
    </tr>`;
  });

  const body = document.getElementById('stockBody');
  body.innerHTML = rows.length
    ? rows.join('')
    : '<tr><td colspan="6" class="muted">该分类暂无标的</td></tr>';

  const sample = list.find((item) => quoteMap[item.symbol]) || WATCHLIST[0];
  const label = activeTag === '全部' ? '全部自选股' : activeTag;
  document.getElementById('stockUpdated').textContent =
    `${label} · 盘中真实行情 · 更新时间：${timeText(quoteMap[sample?.symbol]?.updatedAt)}`;
}

async function init() {
  quoteMap = await loadQuotes();
  renderChips();
  renderTable();
}

init().catch((err) => {
  document.getElementById('stockUpdated').textContent = `行情加载失败：${err.message}`;
});
