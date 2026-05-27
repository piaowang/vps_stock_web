# StockWatch Frontend

这是宿主机 Nginx 直接托管的静态前端。

## 目录

- `index.html`: 全球市场总览（首页）
- `css/`: 样式
- `js/`: 市场总览脚本
- `stocks/`, `news/`, `about/`: 其他页面
- `market/`: 已合并至首页，保留跳转

## 发布

```bash
mkdir -p /usr/local/nginx/html/stockwatch
rm -rf /usr/local/nginx/html/stockwatch/*
cp -r /opt/stockwatch/frontend/* /usr/local/nginx/html/stockwatch/
```

前端调用同域接口:

- `/api/quote?symbol=AAPL`
- `/ws`
