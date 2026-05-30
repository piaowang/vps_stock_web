const ETF_GROUPS = [
  {
    id: 'bosera',
    title: '博时 · 美国 ETF',
    note: 'A 股场内 QDII，跟踪美国主要指数',
    items: [
      {
        symbol: '513500.SS',
        code: '513500',
        name: '博时标普500ETF',
        track: '标普 500',
        market: '上交所',
      },
      {
        symbol: '513390.SS',
        code: '513390',
        name: '博时纳斯达克100ETF',
        track: '纳斯达克 100',
        market: '上交所',
      },
      {
        symbol: '159659.SZ',
        code: '159659',
        name: '博时纳斯达克100ETF',
        track: '纳斯达克 100',
        market: '深交所',
      },
    ],
  },
  {
    id: 'us-ref',
    title: '对照 · 美股 ETF',
    note: '美国本土 ETF，便于与 QDII 对比参考',
    items: [
      {
        symbol: 'SPY',
        code: 'SPY',
        name: 'SPDR 标普500 ETF',
        track: '标普 500',
        market: 'NYSE',
      },
      {
        symbol: 'QQQ',
        code: 'QQQ',
        name: 'Invesco 纳指100 ETF',
        track: '纳斯达克 100',
        market: 'NASDAQ',
      },
    ],
  },
];

const ETF_SYMBOLS = ETF_GROUPS.flatMap((group) => group.items.map((item) => item.symbol));

function getEtfGroups() {
  return ETF_GROUPS;
}

module.exports = {
  ETF_GROUPS,
  ETF_SYMBOLS,
  getEtfGroups,
};
