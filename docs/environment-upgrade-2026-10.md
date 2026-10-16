# 2026-10 环境与依赖升级

本次将构建环境统一到 Node.js 24 LTS、pnpm 10，并将 Astro 5 的旧内容集合迁移到 Astro 7，保留现有文章 URL 和 Tailwind 3 样式。

本文记录 Astro 7 升级时的状态。随后进行的 Tailwind 4 迁移和最新审计结果见 [Tailwind 4 迁移说明](tailwind-4-migration.md)。

## 版本与兼容处理

| 组件 | 升级前 | 本次 |
| --- | --- | --- |
| Node.js | 本地 24.11.1，CI 22/23，部署 20 | `.nvmrc` 固定 24.22.0；托管平台使用 24.x |
| pnpm | 项目 9.14.4，部署 8 | 10.34.7 |
| Astro | 5.13.10 | 7.4.0 |
| Svelte 集成 / Svelte | 7.2.3 / 5.39.8 | 9.1.0 / 5.57.2 |
| Expressive Code | 0.41.4 | 0.44.2 |
| sharp | 0.34.5 | 0.35.5 |
| Pagefind | 1.4.0 | 1.5.2 |
| KaTeX | 0.16.27 | 0.19.0 |

- 内容集合移到 `src/content.config.ts`，使用 `glob()` loader、`entry.id` 与 `render(entry)`；图片目录根据源文件路径解析，保留大小写与嵌套目录。
- 显式使用 `unified()` 保留 remark/rehype 插件，以及 `compressHTML: true` 保留旧的行内空白处理。
- 移除弃用的 `@astrojs/tailwind`，使用 PostCSS 加载 Tailwind 3、嵌套处理和 autoprefixer。
- 修复新版编译器发现的页脚未闭合标签；删除会被 Tailwind 扫描为非法 CSS 的旧注释示例。
- Biome 保持 2.2.5，CI 改用项目版本；统一换行策略，避免 Windows/Linux 检查差异。
- GitHub 构建执行完整的 `pnpm build`，包含搜索索引。服务器部署前执行类型检查、代码质量检查和构建回归检查。
- 所有 GitHub Node/pnpm 环境设置读取仓库版本声明；构建相关 Actions 固定到已核实的版本提交，并启用 Dependabot Actions 更新。

## 依赖安全审计

2026-10-16 使用 npm registry 的审计接口检查锁文件，升级前报告 242 项：4 critical、118 high、99 moderate、21 low。升级后剩余 1 high，0 critical/moderate/low。审计数字代表依赖公告命中，不等于线上网站存在同等数量的可利用漏洞。

剩余项是 [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)：Tailwind 3 的 chokidar/micromatch 引入 `braces@3.0.3`，处理恶意深层嵌套模式时可能栈溢出。审计接口目前没有给出修复版本。本项目通过仓库内固定模式扫描文件，线上发布静态产物，访客输入不会进入这条构建路径。仍保留审计告警，后续随 Tailwind 4 迁移移除该依赖。

`pnpm-workspace.yaml` 中的兼容覆盖：

- `@swup/plugin@3.0.1>microbundle: '-'`：Swup 使用已发布的 `dist` 文件；该依赖仅用于插件作者的构建/发布 CLI，本项目不调用该 CLI。移除它同时去掉了旧 Rollup/Terser 依赖树。
- `postcss-selector-parser@<7.1.6`：统一使用含安全修复的 7.1.6 或后续兼容版本。已验证 Tailwind、代码块样式和生产 CSS 构建。
- `katex@<0.18.2`：与直接依赖统一到 0.19.x，并通过 remark-math → rehype-katex 的行内/块级公式测试。

这些覆盖需在上游依赖范围更新后重新评估，不应无限期保留。

## 验证与发布

本地使用独立安装的 Node.js 24.22.0 验证，不替换 Windows 全局 Node 安装。

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm lint:ci
pnpm build
pnpm test:build
```

构建保留 32 个页面，搜索索引包含 27 个页面（含关于页）。回归检查覆盖升级前已发布路径、RSS 文章地址、搜索索引覆盖率、构建资源文件及数学公式。浏览器验证使用本地产物并阻止外部请求；Giscus、统计服务和外部图片服务的可用性需以部署预览为准。

升级代码提交 `99efaeb` 已通过 GitHub Actions 的构建与代码质量检查，以及 Cloudflare Pages、Vercel 预览部署；[PR #13](https://github.com/bbcslook-beep/my-website/pull/13) 保留检查和预览记录。

Cloudflare/Vercel 的后台覆盖设置不能从仓库完全确认，环境要求见 README。发布采用 PR 合并流程；合并到 `main` 后，需检查该提交对应的 GitHub Actions、托管平台部署及线上页面。回滚时通过新的 PR 撤销升级变更，并按需恢复对应的托管平台版本覆盖。

Tailwind 4 迁移、TypeScript/Biome 的进一步大版本调整以及上游 PR 引入不包含在本次改动中。
