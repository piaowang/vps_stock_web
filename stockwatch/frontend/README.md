# StockWatch Frontend

这是宿主机 Nginx 直接托管的静态前端。

## 目录

- `index.html`: 首页
- `css/`: 样式
- `js/`: 首页交互与图表库
- `market/`, `stocks/`, `news/`, `about/`: 多页面入口

## 发布

```bash
mkdir -p /usr/local/nginx/html/stockwatch
rm -rf /usr/local/nginx/html/stockwatch/*
cp -r /opt/stockwatch/frontend/* /usr/local/nginx/html/stockwatch/
```

前端调用同域接口:

- `/api/quote?symbol=AAPL`
- `/ws`
