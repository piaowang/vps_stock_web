const MARKET_IDS = ['us', 'cn', 'jp', 'kr'];
const RANGE = '5y';

const $ = (id) => document.getElementById(id);
const setText = (id, text) => { const el = $(id); if (el) el.textContent = text; };
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) => `${n >= 0 ? '+' : ''}${Number(n || 0).toFixed(2)}%`;
const tone = (n) => (n > 0.001 ? 'up' : n < -0.001 ? 'down' : 'flat');

function getMarketId() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id || !MARKET_IDS.includes(id)) return null;
  return id;
}

function drawChart(canvas, points) {
  if (!canvas || !points?.length) return;
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 960;
  const cssH = 320;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const pad = { t: 16, r: 16, b: 28, l: 52 };
  const plotW = cssW - pad.l - pad.r;
  const plotH = cssH - pad.t - pad.b;
  const prices = points.map((p) => p.p);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;

  const xAt = (idx) => pad.l + (idx / Math.max(points.length - 1, 1)) * plotW;
  const yAt = (price) => pad.t + (1 - (price - min) / span) * plotH;

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = pad.t + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(cssW - pad.r, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#64748b';
  ctx.font = '11px Segoe UI, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(fmt(max), pad.l - 8, yAt(max) + 4);
  ctx.fillText(fmt(min), pad.l - 8, yAt(min) + 4);

  const first = points[0].p;
  const last = points[points.length - 1].p;
  const up = last >= first;
  const lineColor = up ? '#16c784' : '#ea3943';
  const fillColor = up ? 'rgba(22, 199, 132, 0.12)' : 'rgba(234, 57, 67, 0.12)';

  ctx.beginPath();
  points.forEach((point, idx) => {
    const x = xAt(idx);
    const y = yAt(point.p);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.lineTo(xAt(points.length - 1), pad.t + plotH);
  ctx.lineTo(xAt(0), pad.t + plotH);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  const startYear = new Date(points[0].t).getFullYear();
  const endYear = new Date(points[points.length - 1].t).getFullYear();
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'left';
  ctx.fillText(String(startYear), pad.l, cssH - 8);
  ctx.textAlign = 'right';
  ctx.fillText(String(endYear), cssW - pad.r, cssH - 8);
}

function renderIndices(indices) {
  const root = $('indexGrid');
  if (!root) return;
  root.innerHTML = indices.map((item) => {
    if (item.error || item.returnPct == null) {
      return `<article class="return-card"><div class="return-card__label">${item.label || item.symbol}</div><div class="return-card__symbol">${item.symbol}</div><div class="return-card__value flat">暂无</div></article>`;
    }
    const cls = tone(item.returnPct);
    return `<article class="return-card"><div class="return-card__label">${item.label}</div><div class="return-card__symbol">${item.symbol}</div><div class="return-card__value ${cls}">${pct(item.returnPct)}</div></article>`;
  }).join('');
}

function renderRank(stocks) {
  const body = $('stockRankBody');
  if (!body) return;
  if (!stocks.length) {
    body.innerHTML = '<tr><td colspan="6" class="muted">暂无可用数据</td></tr>';
    return;
  }
  body.innerHTML = stocks.map((item, idx) => {
    const cls = tone(item.returnPct);
    return `<tr>
      <td class="rank-no">${idx + 1}</td>
      <td>${item.symbol}</td>
      <td>${item.name || '--'}</td>
      <td>${fmt(item.startPrice)}</td>
      <td>${fmt(item.endPrice)}</td>
      <td class="${cls}">${pct(item.returnPct)}</td>
    </tr>`;
  }).join('');
}

function renderChartPanel(chart, indices) {
  const primary = chart || indices.find((item) => item.returnPct != null);
  if (!primary) return;

  const label = chart?.label || primary.label || primary.symbol;
  setText('chartTitle', `${label} · 近 5 年`);
  const ret = primary.returnPct ?? 0;
  const retEl = $('chartReturn');
  if (retEl) {
    retEl.textContent = pct(ret);
    retEl.className = `chart-panel__return ${tone(ret)}`;
  }
  setText('chartMeta', `区间 ${fmt(primary.startPrice)} → ${fmt(primary.endPrice)} · 数据来源 Yahoo Finance`);

  if (chart?.points?.length) {
    const canvas = $('indexChart');
    canvas.dataset.points = JSON.stringify(chart.points);
    drawChart(canvas, chart.points);
  }
}

function showError(msg) {
  const el = $('detailError');
  if (el) { el.hidden = false; el.textContent = msg; }
  setText('detailUpdated', '加载失败');
}

async function loadDetail(marketId) {
  const res = await fetch(`/api/market/${encodeURIComponent(marketId)}?range=${RANGE}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json?.ok || !json?.data) throw new Error('empty payload');
  return json.data;
}

async function init() {
  const marketId = getMarketId();
  if (!marketId) {
    showError('无效的市场参数，请从首页点击进入。');
    return;
  }

  const data = await loadDetail(marketId);
  setText('detailTitle', `${data.title}市场 · 5 年回顾`);
  setText('detailFlag', data.flag || '--');
  document.title = `StockWatch · ${data.title} · 5 年回顾`;

  renderChartPanel(data.chart, data.indices);
  renderIndices(data.indices || []);
  renderRank(data.topStocks || []);

  const err = $('detailError');
  if (err) err.hidden = true;
  setText('detailUpdated', `更新 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`);

  if (data.errors?.length) {
    const el = $('detailError');
    if (el) {
      el.hidden = false;
      el.textContent = `部分标的暂无数据：${data.errors.map((e) => e.symbol).join(', ')}`;
    }
  }
}

window.addEventListener('resize', () => {
  const canvas = $('indexChart');
  if (!canvas?.dataset.points) return;
  drawChart(canvas, JSON.parse(canvas.dataset.points));
});

init().catch((err) => showError(err.message));
