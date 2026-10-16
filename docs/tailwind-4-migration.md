# Tailwind CSS 4 迁移

本轮从主分支 `e3361ae` 独立迁移 Tailwind CSS 3.4.19 到 4.3.3，保留 Astro 7、Node.js 24 和 pnpm 10 的环境声明。

## 构建和样式入口

- 使用 `@tailwindcss/vite`，配置位于 `astro.config.mjs`。
- 样式入口为 `src/styles/tailwind.css`，集中导入全局、正文、代码块、图片查看器、滚动条和页面过渡样式。
- 主题字体、手动暗色模式、Typography 插件和源文件扫描范围移到 CSS 配置。
- `src/styles/utilities.css` 使用 `@utility` 注册供 `@apply` 复用的样式；Astro 内联样式通过 `@reference` 获取主题定义。
- `variables.styl` 与 `markdown-extend.styl` 在布局中显式加载。图片组件仅扫描支持的图片扩展名，避免间接引入样式和其他源码。
- 移除 Tailwind 3 的 JavaScript 配置和旧 PostCSS 配置及其直接依赖。
- 将旧的 important 写法改为后缀 `!`，保留标签分隔符的伪元素顺序，并显式定义开启横幅时的桌面首页样式。

## 兼容性

按 [官方迁移指南](https://tailwindcss.com/docs/upgrade-guide) 调整重命名的工具类，并保留现有字体、按钮光标和默认边框行为。Tailwind 4 的浏览器基线为 Safari 16.4、Chrome 111、Firefox 128；更旧浏览器不在本次迁移的兼容范围内。

## 验证范围

本地使用 Node.js 24.22.0 验证：

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm format
pnpm lint:ci
pnpm build
pnpm test:build
pnpm audit
```

- 类型检查为 0 errors / warnings / hints，质量检查通过，5 项构建回归检查通过；保留 32 个页面与 27 页 Pagefind 索引。
- 使用本机 Edge 对比 1440px 桌面尺寸和 390px 手机尺寸下的首页、文章页、归档页；6 个场景各抽查 120 个元素，位置、尺寸、字号、行高、内边距、圆角和显示方式未发现差异，并检查了明暗主题截图。
- 浏览器交互验证通过：主题切换、桌面与手机搜索、站内跳转、手机菜单、代码复制、图片查看器打开和关闭、赏图模式进入和退出。
- 可选横幅的响应式规则检查通过：桌面首页应用偏移，手机尺寸不应用该偏移。
- 浏览器测试阻止外部请求，以隔离第三方图片、评论和统计服务；不代表这些外部服务的可用性验证。Safari 和 Firefox 未在本地实测，最低版本依据官方迁移指南。

## 依赖审计

2026-10-16 的 `pnpm audit` 返回 0 项已知告警。Tailwind 3 引入的 `braces` 已从依赖树移除，上一轮的 1 项 high 告警消失。此结果仅代表当次依赖公告扫描。

`pnpm-workspace.yaml` 中其他兼容覆盖仍保留：Typography / Expressive Code 仍使用 `postcss-selector-parser`；Swup 与 KaTeX 的覆盖原因未因本轮迁移改变。

上游 PR 和其他依赖的大版本升级不包含在本轮改动中。迁移采用独立 PR，合并前检查云端构建与部署预览；若需回滚，通过 PR 撤销本轮迁移即可，Node/pnpm 和托管平台环境不需随之降级。
