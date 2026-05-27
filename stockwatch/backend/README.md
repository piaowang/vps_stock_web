# StockWatch Backend

Node.js 行情聚合服务，负责访问 Yahoo Finance 并向前端提供同域 API。

## 启动

```bash
npm install
npm start
```

## 接口

- `GET /health`
- `GET /api/quote?symbol=AAPL`
- `GET /api/quotes`
- `WS /ws`

## Docker

根目录执行:

```bash
docker compose up -d --build aggregator
```

默认监听 `8090`，可通过 `AGG_PORT` 修改。
