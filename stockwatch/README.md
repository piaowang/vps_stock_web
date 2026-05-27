# StockWatch

StockWatch 是一个前后端分离的美股行情监控站点:

- `frontend/`: 静态页面、CSS、浏览器端 JS
- `backend/`: Node.js 行情聚合服务，提供 REST API 和 WebSocket
- `docker-compose.yml`: 服务器上启动后端容器
- `.github/workflows/deploy.yml`: GitHub Actions 自动部署

## 本地启动后端

```bash
cd backend
npm install
npm start
```

默认端口为 `8090`:

- `GET http://127.0.0.1:8090/health`
- `GET http://127.0.0.1:8090/api/quote?symbol=AAPL`
- `WS  ws://127.0.0.1:8090/ws`

## 服务器部署模型

线上推荐使用宿主机 Nginx 做统一入口:

- Nginx 静态目录: `/usr/local/nginx/html/stockwatch`
- 后端容器: `127.0.0.1:8090`
- `/api/` 反代到后端
- `/ws` 反代到后端 WebSocket

## GitHub Actions 配置

在 GitHub 仓库配置 Secrets:

- `SSH_HOST`: 服务器 IP 或域名
- `SSH_USER`: SSH 用户，例如 `root`
- `SSH_PRIVATE_KEY`: 部署私钥
- `SSH_PORT`: SSH 端口，可选，默认 `22`

可选配置 Variables:

- `REMOTE_APP_DIR`: 默认 `/opt/stockwatch`
- `NGINX_STATIC_DIR`: 默认 `/usr/local/nginx/html/stockwatch`
- `NGINX_BIN`: 默认 `/usr/local/nginx/sbin/nginx`

推送到 `main` 或手动运行 `Deploy StockWatch` workflow 即可部署。
