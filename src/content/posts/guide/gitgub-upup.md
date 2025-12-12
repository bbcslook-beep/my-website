---
title: '从搬运工到开发者：我的开源博客“排雷”实战复盘'
published: 2025-12-11
description: '记录一次惊心动魄的博客维护经历。从 Git 历史冲突到 CSS 类名丢失，再到构建流水线报错，我如何一步步解决“依赖地狱”，最终让 CI/CD 全绿通过。'
image: '/images/git-merge-success.jpg'
tags: ['Git', 'Astro', 'Open Source', 'CI/CD', 'Debug']
category: '折腾记录'
draft: false
lang: 'zh'
---

> **写在前面：** 搭建一个博客很容易，但**维护**一个高度定制化的开源主题 Fork 版本，绝对是一场修行。今天，我经历了一次从“构建失败”到“全绿通过”的完整洗礼。

## 1. 缘起：昨天还能跑，今天就炸了？

故事的开始很经典：昨天我的博客还能正常访问，今天我想更新一下主题功能，结果 `pnpm build` 直接报错退出。

报错日志里赫然写着：
> `[vite:css] The btn-regular-dark class does not exist.`

这就是开源世界的常态——**上游（Upstream）更新了，而我的代码“断层”了**。主题作者重构了 CSS，删除了旧的类名，而我本地还保留着旧的调用代码。

为了解决这个问题，我踏上了一场修复之旅，没想到这只是第一关。

## 2. 战役一：打通平行宇宙 (Git Unrelated Histories)

为了获取作者的最新修复，我尝试合并上游代码：

```bash
git fetch upstream
git merge upstream/main
结果 Git 给我泼了一盆冷水：
fatal: refusing to merge unrelated histories
```
**原因分析 ：** 我的仓库虽然代码和作者的一样，但当初是直接下载源码初始化的，而不是标准的 Fork。在 Git 眼里，这俩是完全没有血缘关系的两个项目，禁止“乱伦”。

**⚔️ 解决方案：强制联姻**

我使用了一个强力参数，告诉 Git “我知道她们不同，但请把她们合在一起”：~~总感觉有点磕？~~

```bash

git merge upstream/main --allow-unrelated-histories
这一步成功打通了任督二脉，但也引爆了下一场危机——冲突。
```

## 3. 战役二：外科手术 (Conflict Resolution)
强制合并后，VS Code 里一片飘红。大量文件出现了冲突标记 <<<<<<< HEAD。

这是最考验耐心的时刻。我需要在 VS Code 中逐个文件进行“外科手术”：

对于核心代码（如 src/styles/markdown.css）： 毫不犹豫选择 “采用传入的更改 (Accept Incoming Change)”。因为作者的新代码修复了 btn-regular-dark 缺失的问题。

对于个人配置（如 src/config.ts）： 坚定选择 “保留当前更改 (Accept Current Change)”。因为这里面是我的博客标题，绝对不能被覆盖。

## 4. 战役三：隐形杀手 (Syntax Error)
当我以为一切搞定时，运行 pnpm dev 却迎来了当头一棒：

:::caution
    **ERROR**: Expected identifier but found "<<"
:::

**原因分析：** 这是最容易犯的低级错误！我在 VS Code 里虽然删掉了乱码，但忘记把修改后的文件加入暂存区 (git add) 就直接提交了。结果 Git 提交上去的，依然是那个包含冲突标记的坏文件。

**⚔️ 解决方案：补刀**

```bash

# 1. 再次确认文件内容已修复
# 2. 重新加入暂存区
git add .
# 3. 提交修复
git commit -m "fix: resolve syntax error in config"
# 4. 推送
git push
```

## 5. 战役四：机器人的骚扰 (Dependabot)
就在我以为天下太平时，GitHub 的机器人 Dependabot 突然发来一个 Pull Request，说要帮我升级 astro-check 等依赖包。

结果我看了一眼 Check 状态：❌ 红叉（构建失败）。

这是因为机器人只负责升级版本号，不管兼容性。新版的检查工具变严格了，导致我的旧代码过不了测试。

**⚔️ 应对策略**： 对于我们这种个人维护的 Fork 项目，正确的姿势是： “只跟随上游作者的步伐，不自己瞎折腾依赖。”

我直接关闭了 (Closed) 那个 PR。与其自己去踩坑，不如等作者适配好了，我再同步他的代码。

## 6. 最终胜利：绿色的对号 ✅
经过这一系列的折腾：

修复 CSS 类名报错。

解决 Git 历史隔离。

手动清理代码冲突。

无视机器人的无效升级。

最终，我的 GitHub Actions 终于亮起了久违的绿灯。更让我惊喜的是，我在上游仓库的 Contributors 列表里看到了自己的头像。

**总结：** 给后来者的护身符
如果你也在维护一个高度定制化的 Astro/Fuwari 博客，请记住这三条军规：

别怕冲突： git merge 报错是好事，它在保护你的代码不被覆盖。学会用 VS Code 的冲突编辑器是必修课。

看准报错： Exit Code 1 不可怕，往上翻几行，报错原因通常就写在 ERROR 后面。

本地代理 YYDS： 无论是 Jellyfin 的刮削还是 Git 的拉取，在网络受限的环境下，配置好本地代理能省下一半的生命。