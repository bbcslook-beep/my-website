# ChronoHex 中文使用说明

本仓库是基于 [Fuwari](https://github.com/saicaca/fuwari) 定制的个人博客，线上地址为 [bbcslook.top](https://bbcslook.top)。当前环境使用 Astro 7、Svelte 5 和 Tailwind CSS 4。

## 安装与预览

使用 `.nvmrc` 指定的 Node.js 24.22.0 和 `package.json` 指定的 pnpm 10.34.7，在仓库根目录执行：

```bash
npm install --global pnpm@10.34.7
pnpm install --frozen-lockfile
pnpm dev
```

开发地址以终端输出为准，通常为 `http://localhost:4321`。生产搜索依赖 Pagefind 索引，检查搜索时先执行 `pnpm build`，再用 `pnpm preview` 预览产物。

完整克隆步骤、部署环境和维护流程见 [项目 README](../README.md) 与 [贡献指南](../CONTRIBUTING.md)。

## 站点与文章

- `src/config.ts`：站点标题、导航、头像、主题色等设置。
- `astro.config.mjs`：站点 URL、构建集成和 Markdown 处理。
- `src/content.config.ts`：文章与特殊页面的内容集合及字段定义。
- `src/content/posts/`：博客文章和随文资源。
- `src/content/spec/`：关于页等特殊内容。

创建文章：

```bash
pnpm new-post my-first-post
```

脚本会生成 `src/content/posts/my-first-post.md`。文章开头的 Frontmatter 示例：

```yaml
---
title: 我的第一篇文章
published: 2026-10-16
description: 文章摘要
image: ./cover.jpg
tags: [随笔]
category: 日常
draft: false
lang: zh_CN
---
```

封面可使用相对文章目录的路径。`draft: true` 用于草稿，发布前改为 `false`。`lang` 仅在文章语言需要单独指定时填写。

已有文章路径会影响公开 URL；移动或重命名文章前，应处理旧地址的重定向，并检查 `tests/fixtures/published-routes.json`。新增文章不应移除清单中的已有地址。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 按锁文件安装依赖 |
| `pnpm dev` | 启动本地开发服务器 |
| `pnpm check` | 检查 Astro 与类型错误 |
| `pnpm format` | 格式化源文件，会写入修改 |
| `pnpm lint:ci` | 检查代码质量，不写入修改 |
| `pnpm build` | 构建网站和搜索索引至 `dist/` |
| `pnpm test:build` | 验证已构建页面、RSS、搜索索引、资源及公式 |
| `pnpm preview` | 预览已构建的网站 |
| `pnpm new-post <filename>` | 创建文章 |

## 当前维护范围

Tailwind CSS 4 通过官方 Vite 插件接入，主题配置与样式导入位于 `src/styles/tailwind.css`。支持 Safari 16.4、Chrome 111、Firefox 128 及以上版本。环境历史见 [2026-10 环境与依赖升级](environment-upgrade-2026-10.md)，最新样式迁移与审计结果见 [Tailwind 4 迁移说明](tailwind-4-migration.md)。上游 PR 引入另行处理。
