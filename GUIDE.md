# 本地与线上访问攻略（无需 VPS）

本项目是 Vite + Three.js 的静态前端工程。**开发/预览阶段不需要 VPS**，本机即可运行；需要分享给他人或线上访问时，可用静态托管服务（GitHub Pages/Netlify/Vercel/自有服务器）。

## 1. 本地直接查看（推荐）

> 适合开发/调试，零部署成本。

```bash
npm install
npm run dev
```

启动后终端会显示访问地址，例如：

```
http://localhost:5173/
```

直接浏览器打开即可看到效果。

## 2. 本地构建静态资源

> 适合准备发布到任意静态服务器。

```bash
npm run build
```

产物会输出到 `dist/` 目录。可以用任何静态服务器托管：

```bash
npm run preview
```

也可用 `npx serve dist` 或者任意 HTTP Server。

## 3. GitHub Pages 部署（无需 VPS）

### 方式 A：直接用 `dist` 输出

1. 先构建：
   ```bash
   npm run build
   ```
2. 将 `dist/` 内容推送到 `gh-pages` 分支（可用 `gh-pages` 包）：
   ```bash
   npm i -D gh-pages
   npx gh-pages -d dist
   ```
3. 在 GitHub 仓库 `Settings -> Pages` 选择 `gh-pages` 分支即可。

### 方式 B：使用 GitHub Actions（推荐）

- 写一个简单的 workflow 自动 build & deploy（需要我可以补一份模板）。

## 4. Netlify/Vercel 部署（无需 VPS）

- 连接 GitHub 仓库后设置：
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`

部署完成后会给你一个可公网访问的 URL。

## 5. 使用 VPS 部署（有公网 IP）

> 适合需要自有服务器、内网穿透或自定义域名的场景。

### 方式 A：VPS 直接跑静态服务器

1. 在本地构建产物：
   ```bash
   npm run build
   ```
2. 将 `dist/` 上传到 VPS（例如 `/home/demo`）：
   ```bash
   scp -r dist user@103.23.148.225:/home/demo
   ```
3. 在 VPS 上安装并启动静态服务器（任选其一）：

   **Nginx（推荐）**
   ```bash
   sudo apt-get update
   sudo apt-get install -y nginx
   ```
   配置 `/etc/nginx/sites-available/room-demo`：
   ```nginx
   server {
     listen 80;
     server_name 103.23.148.225;
     root /home/demo;
     index index.html;
     location / {
       try_files $uri $uri/ /index.html;
     }
   }
   ```
   启用并重启：
   ```bash
   sudo ln -s /etc/nginx/sites-available/room-demo /etc/nginx/sites-enabled/room-demo
   sudo nginx -t
   sudo systemctl restart nginx
   ```

   **或使用 serve（快捷）**
   ```bash
   npm i -g serve
   serve -s /home/demo -l 80
   ```

4. 浏览器访问：
   ```
   http://103.23.148.225/
   ```

### 方式 A-1：VPS 直接拉取仓库并部署（完整指令）

> 适合在 VPS 上直接拉取代码并构建部署。

**环境要求（推荐 Ubuntu/Debian）**
- Node.js 18+（含 npm）
- Git
- Nginx（可选，推荐用于生产）

**一键执行流程（示例路径 `/home/demo`）：**

```bash
# 1) 安装依赖环境
sudo apt-get update
sudo apt-get install -y git nginx

# 2) 安装 Node.js 18+（使用 NodeSource）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3) 拉取代码
sudo mkdir -p /home
cd /home

rm -rf demo && \
git -c protocol.version=1 -c http.version=HTTP/1.1 clone --depth 1 --filter=blob:none \
https://github.com/meta-xucong/micro_program.git demo

cd demo

# 4) 安装依赖 & 构建
npm install
npm run build

# 5) 将 dist 部署到 Nginx 根目录
sudo rm -rf /home/demo-dist
sudo cp -r dist /home/demo-dist

# 6) 配置 Nginx
sudo tee /etc/nginx/sites-available/room-demo >/dev/null <<'NGINX_CONF'
server {
  listen 80;
  server_name 103.23.148.225;
  root /home/demo-dist;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
NGINX_CONF

sudo ln -sf /etc/nginx/sites-available/room-demo /etc/nginx/sites-enabled/room-demo
sudo nginx -t
sudo systemctl restart nginx
```

**部署完成后查看方式：**
```
http://103.23.148.225/
```

### 方式 B：VPS 直接跑开发服务器（不推荐长期使用）

> 仅用于临时演示，不建议生产环境使用。

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

浏览器访问：
```
http://103.23.148.225:5173/
```

## 6. 微信小程序 WebView 内访问

- 本项目已内置 `MiniProgramBridge` 适配逻辑。
- 若运行在小程序 WebView 中，点击家具将调用：
  ```ts
  wx.miniProgram.navigateTo('/pages/itemDetail/index?itemId=xxx')
  ```
- 若不在小程序内，则弹出 H5 内的 Modal。

## FAQ

**Q：必须有 VPS 吗？**

不需要。开发调试用 `npm run dev`，分享/发布用 GitHub Pages、Netlify 或 Vercel 即可。

**Q：能直接双击 `index.html` 吗？**

不建议。Vite 依赖模块化与资源路径，建议通过 `npm run dev` 或静态服务器访问。
