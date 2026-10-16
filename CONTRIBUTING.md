# 维护与贡献

本仓库是基于 Fuwari 定制的 ChronoHex 博客。站点内容和个人定制均可在这里提交；通用主题改进如需贡献给上游，应另行遵循上游的贡献流程。

## 开发流程

1. 从最新 `main` 创建工作分支，每个 PR 聚焦一项改动。环境升级、视觉迁移和上游功能引入分别处理。
2. 使用 `.nvmrc` 指定的 Node.js，以及 `package.json` 的 `packageManager` 指定的 pnpm。安装与启动步骤见 [README](README.md)。
3. 修改后执行相应检查，提交信息尽量使用 `feat:`、`fix:`、`docs:`、`chore:` 等 Conventional Commits 前缀。
4. 推送分支并提交 PR，说明改动原因、验证结果和已知限制。界面变更附桌面端和移动端截图，并检查明暗主题。
5. 检查 GitHub Actions 和部署预览通过后再合并。合并到 `main` 会触发 Cloudflare Pages、Vercel 和服务器正式部署。

## 提交前验证

源码、配置或依赖变更运行：

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm format
pnpm lint:ci
pnpm build
pnpm test:build
```

`pnpm format` 会修改源文件，提交前需检查差异。纯文档变更检查内容、相对链接和命令是否与仓库一致；PR 的自动检查仍会执行。

`pnpm build` 同时生成页面和 Pagefind 搜索索引，`pnpm test:build` 需要先有构建产物。依赖变更应同步提交 `pnpm-lock.yaml` 并检查 `pnpm audit`；现有审计告警和兼容覆盖记录在 [环境升级说明](docs/environment-upgrade-2026-10.md)。

## 内容和兼容性

- 文章位于 `src/content/posts/`，站点配置位于 `src/config.ts`，内容集合定义位于 `src/content.config.ts`。
- `tests/fixtures/published-routes.json` 保存已发布 URL。新增文章无需删除原有记录；删除或调整已有 URL 时，需明确处理重定向并同步检查清单。
- 合并前核对预览中的文章、封面、RSS 和搜索。外部评论、统计和图片服务需要联网验证。
- 上游 PR 先评估与本仓库定制功能的兼容性，再单独引入和验证。
