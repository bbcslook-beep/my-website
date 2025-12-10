<<<<<<< HEAD
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
=======
# 🍥Fuwari  
![Node.js >= 20](https://img.shields.io/badge/node.js-%3E%3D20-brightgreen) 
![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue) 
[![DeepWiki](https://img.shields.io/badge/DeepWiki-saicaca%2Ffuwari-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/saicaca/fuwari)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari?ref=badge_shield&issueType=license)

A static blog template built with [Astro](https://astro.build).

[**🖥️ Live Demo (Vercel)**](https://fuwari.vercel.app)

![Preview Image](https://raw.githubusercontent.com/saicaca/resource/main/fuwari/home.png)

🌏 README in
[**中文**](https://github.com/saicaca/fuwari/blob/main/docs/README.zh-CN.md) /
[**日本語**](https://github.com/saicaca/fuwari/blob/main/docs/README.ja.md) /
[**한국어**](https://github.com/saicaca/fuwari/blob/main/docs/README.ko.md) /
[**Español**](https://github.com/saicaca/fuwari/blob/main/docs/README.es.md) /
[**ไทย**](https://github.com/saicaca/fuwari/blob/main/docs/README.th.md) /
[**Tiếng Việt**](https://github.com/saicaca/fuwari/blob/main/docs/README.vi.md) /
[**Bahasa Indonesia**](https://github.com/saicaca/fuwari/blob/main/docs/README.id.md) (Provided by the community and may not always be up-to-date)

## ✨ Features

- [x] Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com)
- [x] Smooth animations and page transitions
- [x] Light / dark mode
- [x] Customizable theme colors & banner
- [x] Responsive design
- [x] Search functionality with [Pagefind](https://pagefind.app/)
- [x] [Markdown extended features](https://github.com/saicaca/fuwari?tab=readme-ov-file#-markdown-extended-syntax)
- [x] Table of contents
- [x] RSS feed

## 🚀 Getting Started

1. Create your blog repository:
    - [Generate a new repository](https://github.com/saicaca/fuwari/generate) from this template or fork this repository.
    - Or run one of the following commands:
       ```sh
       npm create fuwari@latest
       yarn create fuwari
       pnpm create fuwari@latest
       bun create fuwari@latest
       deno run -A npm:create-fuwari@latest
       ```
2. To edit your blog locally, clone your repository, run `pnpm install` to install dependencies.
    - Install [pnpm](https://pnpm.io) `npm install -g pnpm` if you haven't.
3. Edit the config file `src/config.ts` to customize your blog.
4. Run `pnpm new-post <filename>` to create a new post and edit it in `src/content/posts/`.
5. Deploy your blog to Vercel, Netlify, GitHub Pages, etc. following [the guides](https://docs.astro.build/en/guides/deploy/). You need to edit the site configuration in `astro.config.mjs` before deployment.

## 📝 Frontmatter of Posts

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg
tags: [Foo, Bar]
category: Front-end
draft: false
lang: jp      # Set only if the post's language differs from the site's language in `config.ts`
---
```

## 🧩 Markdown Extended Syntax

In addition to Astro's default support for [GitHub Flavored Markdown](https://github.github.com/gfm/), several extra Markdown features are included:

- Admonitions ([Preview and Usage](https://fuwari.vercel.app/posts/markdown-extended/#admonitions))
- GitHub repository cards ([Preview and Usage](https://fuwari.vercel.app/posts/markdown-extended/#github-repository-cards))
- Enhanced code blocks with Expressive Code ([Preview](https://fuwari.vercel.app/posts/expressive-code/) / [Docs](https://expressive-code.com/))

## ⚡ Commands

All commands are run from the root of the project, from a terminal:

| Command                    | Action                                              |
|:---------------------------|:----------------------------------------------------|
| `pnpm install`             | Installs dependencies                               |
| `pnpm dev`                 | Starts local dev server at `localhost:4321`         |
| `pnpm build`               | Build your production site to `./dist/`             |
| `pnpm preview`             | Preview your build locally, before deploying        |
| `pnpm check`               | Run checks for errors in your code                  |
| `pnpm format`              | Format your code using Biome                        |
| `pnpm new-post <filename>` | Create a new post                                   |
| `pnpm astro ...`           | Run CLI commands like `astro add`, `astro check`    |
| `pnpm astro --help`        | Get help using the Astro CLI                        |

## ✏️ Contributing

Check out the [Contributing Guide](https://github.com/saicaca/fuwari/blob/main/CONTRIBUTING.md) for details on how to contribute to this project.

## 📄 License

This project is licensed under the MIT License.

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari.svg?type=large&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari?ref=badge_large&issueType=license)
>>>>>>> upstream/main
