# 🍥 ChronoHex Blog

![Deployment Status](https://img.shields.io/github/actions/workflow/status/bbcslook-beep/my-website/deploy.yml?label=Deploy&logo=github-actions)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel)
![Astro](https://img.shields.io/badge/Astro-v4.0-orange?logo=astro)
![License](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey)

> 闲来无事整点活。
> 
> 基于 [Fuwari](https://github.com/saicaca/fuwari) 主题微改的个人技术博客，集成了多线路状态监控与全自动化部署流程。

## ⚡ 核心特性 (Features)

本项目在原版 Fuwari 主题的基础上，进行了以下定制：

### 🛠️ 功能
- **📶 多线路测速面板 (Network Dashboard)**
  - 侧边栏集成实时延迟检测组件。
  - 自动监测 **Cloudflare 全球加速**、**源站直连**、**Vercel 镜像** 及 **本地环境** 的连通性。
  - 智能高亮当前访问线路，支持红/黄/绿三色状态显示。
  - 感谢来自[二叉树树](https://github.com/afoim/fuwari)的开源。
- **💬 评论区**
  - 基于 GitHub Discussions 的无后端评论系统。
  - **定制化 UI**：重写了评论区容器，使其拥有与文章卡片一致的圆角与背景。

### 🎨 原版优秀特性
- 基于 **Astro** + **Tailwind CSS** 构建，极致的加载速度。
- 丝滑的 View Transitions 页面过渡动画。
- 完善的 Markdown 扩展语法（支持提示块 Admonitions、数学公式 LaTeX）。
- 全响应式设计，完美适配移动端。

## 🏗️ 部署架构 (Architecture)

本项目采用 **多线部署 + 自动化 CI/CD** 架构，确保高可用性：

| 线路 | 承载平台 | 域名 | 说明 |
| :--- | :--- | :--- | :--- |
| **主线路** | ☁️ **Cloudflare** | `072145.xyz` | 全球 CDN 加速，抗攻击 |
| **备用线** | ▲ **Vercel** | `*.vercel.app` | 自动同步的灾备镜像站 |

### 自动化工作流
1. **本地写作**：使用 VS Code 撰写 Markdown 文章。
2. **推送到 GitHub**：`git push` 触发 GitHub Actions。
3. **并行分发**：
   - **Job 1**: 通过 Vercel 自动拉取构建，更新镜像站。
   - **Job 2**: 通过 GitHub Actions 编译生成静态文件，利用 `rsync` 自动同步至宝塔服务器。

## 🚀 本地开发 (Development)

如果你想克隆本项目并在本地运行：

1. **安装依赖**
   ```bash
   pnpm install