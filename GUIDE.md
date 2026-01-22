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

## 5. 微信小程序 WebView 内访问

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
