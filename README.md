# 🍥 ChronoHex Tech Blog

<div align="center">
  <img src="public/favicon/favicon-light-596.png" width="120" height="120" alt="ChronoHex Logo" />
</div>

<p align="center">
  <a href="https://bbcslook.top">
    <img src="https://img.shields.io/badge/Live_Demo-bbcslook.top-blue?style=for-the-badge&logo=cloudflare" alt="Live Demo">
  </a>
  <a href="https://github.com/bbcslook-beep/my-website">
    <img src="https://img.shields.io/github/stars/bbcslook-beep/my-website?style=for-the-badge&logo=github" alt="GitHub Stars">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Astro-7-orange?logo=astro" alt="Astro">
  <img src="https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare" alt="Cloudflare Pages">
  <img src="https://img.shields.io/badge/Umami-Analytics-indigo?logo=umami" alt="Umami">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

> **"Code with logic, write with soul."**
> 
> 基于 [Fuwari](https://github.com/saicaca/fuwari) 主题深度魔改的个人技术博客。集成了多线路全球分发、自建隐私统计与全自动化 DevOps 流程。

---

## ⚡ 核心特性 (Features)

本项目不只是一个静态页面，更是一套完整的 **Jamstack** 解决方案：

### 🛠️ 定制功能
- **📶 多线路测速面板 (Network Dashboard)**
  - 侧边栏集成实时延迟检测组件，基于 `fetch` (no-cors) 实现。
  - 自动监测 **Cloudflare Edge**、**源站直连**、**Vercel 镜像** 及 **本地环境** 的连通性。
  - 智能高亮当前访问线路，动态显示红/黄/绿健康状态。
- **📊 自建隐私统计 (Self-hosted Analytics)**
  - 集成 **Umami** (Docker 部署)，完全掌控用户数据，无 Cookie 隐私友好。
  - 实现了多域名（Cloudflare/Vercel/源站）数据合并统计与白名单过滤。
- **🤖 自动化监控 (Uptime Monitoring)**
  - 顶部导航栏集成 **AcoFork UptimeRobot**，实时展示服务可用率。
- **💬 纯前端评论区**
  - 基于 **Giscus** (GitHub Discussions) 构建。
  - 定制化 CSS 样式，完美融入 Fuwari 的设计语言。


---

## 🏗️ 部署架构 (Architecture)

采用 **"一次推送，全球同步"** 的 DevOps 策略，确保高可用与容灾：

| 角色 | 平台/工具 | 域名/地址 | 职责 |
| :--- | :--- | :--- | :--- |
| **主线路** | ☁️ **Cloudflare Pages** | `bbcslook.top` | 全球边缘节点分发，自动构建，无限带宽 |
| **数据源站** | 🐧 **Linux (CentOS/Docker)** | `cloud.bbcslook.top` | 托管 Umami 统计服务，Nginx 反向代理 |
| **灾备镜像** | ▲ **Vercel** | `*.vercel.app` | 自动化同步的备用线路，防止单点故障 |

### 🔄 CI/CD 工作流
1. **开发**：从最新 `main` 创建工作分支，在本地编辑并用 `pnpm dev` 预览。
2. **提交 PR**：推送工作分支，向 `main` 提交 PR。GitHub Actions 执行代码质量检查、类型检查、构建和产物回归检查；Cloudflare Pages 与 Vercel 提供预览部署。
3. **验证并合并**：检查通过后，确认预览中的文章、搜索、移动端和明暗主题，再合并到 `main`。
4. **正式部署**：Cloudflare Pages、Vercel 自动更新；`Deploy to Server` 工作流在重新检查和构建后，通过 SSH 同步静态产物到服务器。

维护流程见 [贡献指南](CONTRIBUTING.md)，文章写作见 [中文使用说明](docs/README.zh-CN.md)，环境变更与已知限制见 [2026-10 升级记录](docs/environment-upgrade-2026-10.md)。

## 📝 待办事项 (To-Do)

- [x] 转移源服务器
- [x] 迁移至 Cloudflare Pages
- [x] 部署自建 Umami 统计
- [x] 配置 Giscus 评论区
- [x] 统一 Node.js 24 / pnpm 10 构建环境，升级 Astro 7
- [ ] 单独迁移 Tailwind CSS 4 并验证样式
- [ ] 评估并按需引入上游 PR
- [ ] 撰写第一篇关于 AI SVC的技术文章
- [ ] 优化移动端侧边栏交互

## 🤝 鸣谢 (Credits)

* **Framework**: [Astro](https://astro.build/)
* **Theme**: [Fuwari](https://github.com/saicaca/fuwari)
* **Analytics**: [Umami](https://umami.is/)
* **Comments**: [Giscus](https://giscus.app/)
* **Hosting**: Cloudflare & Vercel
* **一些小组件**:[二叉树树](https://github.com/afoim/fuwari)

---

## 🚀 本地开发 (Development)

运行环境统一使用 Node.js 24 LTS（精确版本见 `.nvmrc`）和 pnpm 10.34.7（见 `package.json`）。
本地、GitHub Actions 和部署平台应使用同一套版本。

如果你对本站的魔改方案感兴趣，可以克隆代码进行研究：

```bash
# 1. 克隆仓库
git clone https://github.com/bbcslook-beep/my-website.git
cd my-website

# 使用 .nvmrc 指定的 Node.js 后，安装项目指定的 pnpm
npm install --global pnpm@10.34.7

# 2. 安装依赖
pnpm install --frozen-lockfile

# 3. 启动开发服务器
pnpm dev
```

提交前运行：

```bash
pnpm check
pnpm format
pnpm lint:ci
pnpm build
pnpm test:build
```

`pnpm build` 同时生成静态页面和 Pagefind 搜索索引。构建回归检查会验证已有文章地址、RSS、搜索索引和静态资源；现有文章地址保存在 `tests/fixtures/published-routes.json`，只有主动删除或重定向文章时才应调整该清单。

### 部署环境

- GitHub Actions 从 `.nvmrc` 读取 Node.js，从 `package.json` 读取 pnpm，使用锁文件安装；服务器部署前也执行检查和构建回归验证。
- Cloudflare Pages 使用支持 Node.js 24 的构建镜像，构建命令为 `pnpm build`，输出目录为 `dist`。如后台配置了 `NODE_VERSION`，需与 `.nvmrc` 一致；`PNPM_VERSION` 应设为 `10.34.7`。
- Vercel 的 Node.js 版本应为 `24.x`，安装命令为 `pnpm install --frozen-lockfile`，构建命令为 `pnpm build`，输出目录为 `dist`。`package.json` 的 `engines.node` 声明了相同的主版本要求。
- `pnpm-workspace.yaml` 明确列出允许执行安装脚本的原生构建依赖。添加新的原生依赖后，应先审查其安装脚本再更新名单。

本轮保留 Tailwind CSS 3 的样式配置，通过标准 PostCSS 配置接入，已移除弃用的 `@astrojs/tailwind`。Tailwind 4 的视觉迁移和上游 PR 引入分别安排，避免与运行环境升级混合。
