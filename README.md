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
  <img src="https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte" alt="Svelte">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare" alt="Cloudflare Pages">
  <img src="https://img.shields.io/badge/Umami-Analytics-indigo?logo=umami" alt="Umami">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

> **"Code with logic, write with soul."**
> 
> 基于 [Fuwari](https://github.com/saicaca/fuwari) 持续定制与维护的个人技术博客。在主题的阅读体验上，加入随机壁纸与赏图模式、多线路切换、评论与统计服务，并维护独立的依赖升级、回归检查和多平台发布流程。

这里是 **ChronoHex 的实际站点仓库，也是 Fuwari 的下游定制版本**。文章主要记录 Linux、网络基础与 HCIA 学习，以及 AI 工具、自建服务和网站开发实践。欢迎阅读文章，也欢迎参考这里的组件和维护方案。

[访问博客](https://bbcslook.top) · [中文使用说明](docs/README.zh-CN.md) · [维护与贡献](CONTRIBUTING.md) · [反馈问题](https://github.com/bbcslook-beep/my-website/issues)

---

## ✨ 这个下游版本有什么特色？

### 🖼️ 随机壁纸与赏图模式

页面通过独立图片接口加载背景，阅读时使用模糊和透明效果。背景加载完成后，**双击页面非交互区域**即可隐藏阅读界面、查看清晰壁纸；点击退出区域或按 **Esc** 返回。

赏图模式会暂时停用隐藏界面的交互，退出时恢复焦点；站内导航时也会退出赏图状态。实现集中在 [WallpaperViewer.astro](src/components/WallpaperViewer.astro)，方便单独研究或替换图片来源。

### 📶 多线路切换面板

侧边栏提供多个访问入口，显示浏览器请求耗时，并高亮当前线路。本地开发时额外显示开发服务器入口，便于调试。线路列表集中在 [NetworkStatus.astro](src/components/widget/NetworkStatus.astro)。

面板数值用于辅助选择线路：它测量的是浏览器请求耗时，会受网络、连接建立等因素影响；跨域请求使用 `no-cors`，不能据此判断目标页面的 HTTP 状态，也不等同于服务器可用率监控。

### 💬 评论、统计和状态入口

- **Giscus 评论**：文章下方接入 GitHub Discussions，按文章路径关联讨论，并同步明暗主题。配置位于 [Comment.astro](src/components/Comment.astro)。
- **自建 Umami 统计**：页面接入独立部署的统计服务，导航栏提供统计页面入口。
- **UptimeRobot 状态页**：导航栏提供独立监控页面的访问入口，与侧边栏的浏览器线路检测各司其职。

博客页面构建为静态文件；统计、评论和背景图片由各自的外部服务提供。相关说明见 [关于本站](https://bbcslook.top/about/)。

### 🛠️ 持续维护的构建与发布流程

这个下游版本也维护主题之外的工程配置，方便在更新依赖时检查已有内容与功能：

| 维护内容 | 当前仓库的处理 |
| --- | --- |
| 框架与样式迁移 | 已迁移到 Astro 7、Svelte 5、Tailwind CSS 4，保留现有文章地址与主题体验 |
| 开发环境一致性 | Node.js 与 pnpm 版本由仓库声明，本地、CI 和部署按同一套要求安装 |
| 代码检查 | 使用 Biome 2.5.15 和 Astro 检查，PR 自动验证 |
| 内容回归 | 检查已有文章地址、RSS 链接、搜索索引、静态资源及数学公式 |
| 部署前验证 | PR 提供预览；合并后发布到 Cloudflare Pages、Vercel 和服务器线路 |
| 后续更新 | Dependabot 提交依赖更新 PR，大版本迁移及上游改动单独评估 |

Tailwind 4 迁移还处理了本地开发中站内切页后主题色滑块样式丢失的问题。过程与验证记录见 [环境升级说明](docs/environment-upgrade-2026-10.md) 和 [Tailwind 4 迁移说明](docs/tailwind-4-migration.md)。

## 🍥 与上游 Fuwari 的关系

Fuwari 提供了本站的主题基础。这里延续了卡片布局、明暗模式与主题色设置、文章目录、归档与标签、Pagefind 搜索、代码高亮与复制、数学公式、图片放大、RSS 等阅读与写作功能。

本仓库在这一基础上维护自己的站点内容、服务接入、交互定制和升级记录。原始主题设计与基础功能归功于 Fuwari，部分组件也参考了 [afoim/fuwari](https://github.com/afoim/fuwari)，感谢相关作者。

上游改动会结合本站的配置与依赖逐项评估，再通过独立 PR 引入。若希望从原始主题开始搭建，可访问 [Fuwari 上游仓库](https://github.com/saicaca/fuwari)；若想参考本站的实际部署与定制，可以从下方配置入口开始。

---

## 🏗️ 部署架构 (Architecture)

同一份静态站点代码通过多个平台发布，提供不同的访问线路：

| 角色 | 平台/工具 | 域名/地址 | 职责 |
| :--- | :--- | :--- | :--- |
| **主站发布** | ☁️ **Cloudflare Pages** | `bbcslook.top` | 静态页面发布、PR 预览 |
| **镜像发布** | ▲ **Vercel** | `*.vercel.app` | 同仓库自动构建、PR 预览和备用访问入口 |
| **服务器发布** | 🐧 **GitHub Actions + SSH** | 由部署配置指定 | 验证后同步 `dist/` 到服务器站点目录 |
| **独立服务** | **Umami / Giscus / 图片接口** | 各自的服务地址 | 提供统计、评论与背景图片，不打包进静态站点 |

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
- [x] 单独迁移 Tailwind CSS 4 并验证样式
- [x] 更新 Biome 并对齐本机开发环境
- [ ] 评估并按需引入上游 PR
- [ ] 撰写第一篇关于 AI SVC的技术文章
- [ ] 优化移动端侧边栏交互

## 🧩 想复用这个下游版本？

仓库包含本站正在使用的个人资料、域名和服务配置。部署自己的站点前，可按下表替换为自己的内容：

| 要修改的内容 | 配置入口 |
| --- | --- |
| 标题、导航、头像、社交链接、主题色 | [src/config.ts](src/config.ts) |
| 正式域名、构建集成与 Markdown 处理 | [astro.config.mjs](astro.config.mjs) |
| 线路名称与访问地址 | [NetworkStatus.astro](src/components/widget/NetworkStatus.astro) |
| 背景图片接口与赏图交互 | [WallpaperViewer.astro](src/components/WallpaperViewer.astro) |
| 评论仓库与 Discussions 分类 | [Comment.astro](src/components/Comment.astro) |
| Umami 脚本地址与站点 ID | [MainGridLayout.astro](src/layouts/MainGridLayout.astro) |
| 页脚署名与备案信息 | [Footer.astro](src/components/Footer.astro) |
| 博客文章、随文资源与关于页 | [src/content/posts/](src/content/posts/) / [src/content/spec/](src/content/spec/) |
| 服务器目标目录与部署凭据名称 | [deploy.yml](.github/workflows/deploy.yml) |

评论、统计和图片接口需要自行配置相应服务；服务器部署使用仓库 Secrets。若只部署到 Cloudflare Pages 或 Vercel，可按自己的需要调整服务器部署工作流。更换域名或文章地址时，也应更新 [构建回归检查](tests/build.test.mjs) 及其 [已发布地址清单](tests/fixtures/published-routes.json)。

### 目录导览

```text
src/
├── components/       # 阅读组件、线路面板、评论与壁纸交互
├── content/posts/    # Markdown 文章和随文资源
├── content/spec/     # 关于页等特殊内容
├── layouts/          # 页面布局及服务脚本接入
├── plugins/          # Markdown 与代码块扩展
├── styles/           # Tailwind 4 入口、主题变量和扩展样式
└── config.ts         # 站点与个人资料配置
tests/                # 构建产物回归检查
docs/                 # 使用说明、升级与迁移记录
.github/              # 自动检查、部署与依赖更新配置
```

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

当前使用 Tailwind CSS 4.3.3，通过 `@tailwindcss/vite` 接入。全局样式、字体、暗色模式与扫描范围集中在 `src/styles/tailwind.css`，可复用工具样式位于 `src/styles/utilities.css`。浏览器基线为 Safari 16.4、Chrome 111、Firefox 128；迁移细节和验证记录见 [Tailwind 4 迁移说明](docs/tailwind-4-migration.md)。上游 PR 引入另行评估。

## 📄 许可与内容使用

网站代码沿用 [MIT 许可证](LICENSE)，并保留上游版权声明。本站原创文章除另有声明外采用 **CC BY-NC-SA 4.0**，转载需注明作者和原文链接；第三方图片、资料与代码遵循各自许可。详细说明见 [关于本站](https://bbcslook.top/about/)。

## 🤝 鸣谢 (Credits)

- **主题基础**：[Fuwari / saicaca](https://github.com/saicaca/fuwari)
- **部分组件参考**：[二叉树树 / afoim](https://github.com/afoim/fuwari)
- **框架与样式**：[Astro](https://astro.build/)、[Svelte](https://svelte.dev/)、[Tailwind CSS](https://tailwindcss.com/)
- **搜索与代码展示**：[Pagefind](https://pagefind.app/)、[Expressive Code](https://expressive-code.com/)
- **统计与评论**：[Umami](https://umami.is/)、[Giscus](https://giscus.app/)
- **托管与自动化**：Cloudflare Pages、Vercel、GitHub Actions
