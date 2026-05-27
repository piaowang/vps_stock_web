# StockWatch 最简线上部署（宿主机 Nginx + Docker Aggregator）

## 1) 启动后端容器

在项目目录 `/opt/stockwatch`:

```bash
docker compose up -d --build
docker ps --filter "name=stockwatch-aggregator"
curl -i http://127.0.0.1:8090/health
```

## 2) 发布前端静态文件

```bash
mkdir -p /usr/local/nginx/html/stockwatch
rm -rf /usr/local/nginx/html/stockwatch/*
cp -r /opt/stockwatch/frontend/* /usr/local/nginx/html/stockwatch/
```

## 3) 宿主机 Nginx 配置

推荐直接参考 `deploy/nginx-aggregator.conf.example`，并确保静态部分如下:

```nginx
root /usr/local/nginx/html/stockwatch;
index index.html;

location = /index.html {
    try_files $uri =404;
}

location / {
    try_files $uri $uri/ /index.html;
}

location /api/ {
    proxy_pass http://127.0.0.1:8090;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /ws {
    proxy_pass http://127.0.0.1:8090/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

## 4) 重载与验证

```bash
/usr/local/nginx/sbin/nginx -t
/usr/local/nginx/sbin/nginx -s reload

curl -i https://test.yuemingchen.top/
curl -i https://test.yuemingchen.top/api/quote?symbol=AAPL
```

如果首页异常，优先检查:

```bash
ls -lah /usr/local/nginx/html/stockwatch
tail -n 80 /usr/local/nginx/logs/error.log
```

## GitHub Actions 自动部署

仓库已提供 `.github/workflows/deploy.yml`。需要在 GitHub 仓库配置:

- Secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`
- 可选 Secrets: `SSH_PORT`
- 可选 Variables: `REMOTE_APP_DIR`, `NGINX_STATIC_DIR`, `NGINX_BIN`

默认部署路径:

- 项目目录: `/opt/stockwatch`
- Nginx 静态目录: `/usr/local/nginx/html/stockwatch`
- Nginx 命令: `/usr/local/nginx/sbin/nginx`
