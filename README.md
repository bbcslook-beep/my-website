# 🍥 ChronoHex Tech Blog

<div align="center">
  <img src="public/favicon/favicon-light-596.png" width="120" height="120" alt="ChronoHex Logo" />
</div>

<p align="center">
  <a href="https://072145.xyz">
    <img src="https://img.shields.io/badge/Live_Demo-072145.xyz-blue?style=for-the-badge&logo=cloudflare" alt="Live Demo">
  </a>
  <a href="https://github.com/bbcslook-beep/my-website">
    <img src="https://img.shields.io/github/stars/bbcslook-beep/my-website?style=for-the-badge&logo=github" alt="GitHub Stars">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Astro-5.0-orange?logo=astro" alt="Astro">
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
| **主线路** | ☁️ **Cloudflare Pages** | `072145.xyz` | 全球边缘节点分发，自动构建，无限带宽 |
| **数据源站** | 🐧 **Linux (CentOS/Docker)** | `cloud.072145.xyz` | 托管 Umami 统计服务，Nginx 反向代理 |
| **灾备镜像** | ▲ **Vercel** | `*.vercel.app` | 自动化同步的备用线路，防止单点故障 |

### 🔄 CI/CD 工作流
1.  **Develop**: 本地 VS Code 撰写 Markdown，`pnpm dev` 预览。
2.  **Push**: 代码推送至 GitHub `main` 分支。
3.  **Build & Deploy**:
    * **Cloudflare Pages**: 自动触发构建 (`pnpm build`)，产物发布至全球边缘网络 (Edge Network)。
    * **Vercel**: 并行触发构建，更新灾备镜像。

## 📝 待办事项 (To-Do)

- [x] 完成多线路测速组件
- [x] 迁移至 Cloudflare Pages
- [x] 部署自建 Umami 统计
- [x] 配置 Giscus 评论区
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

如果你对本站的魔改方案感兴趣，可以克隆代码进行研究：

```bash
# 1. 克隆仓库
git clone [https://github.com/bbcslook-beep/my-website.git](https://github.com/bbcslook-beep/my-website.git)

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev