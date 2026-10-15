---
title: Fuwari 主题进阶：用独立组件实现平滑的沉浸式赏图模式
published: 2026-03-23
updated: 2026-10-16
description: 修复 Fuwari 赏图模式中 UI 突然消失、恢复时闪现的问题，用独立透明度层实现渐隐渐显，并保留主题原有动画与面板状态。
tags: [Fuwari, Astro, 前端开发, 教程]
category: '折腾记录'
draft: false
---

给博客挂上喜欢的背景图以后，总想留一个能看清原图的入口：双击页面空白处，让导航、文章卡片、侧栏和页脚慢慢淡出，背景随之变清晰；看完再点一下，继续阅读。

这个功能最初只用了几条 CSS 和一个双击事件，看起来很简单。但后面改了几次，模块还是经常“一闪就没”或者突然出现。问题出在赏图模式和主题动画争用了同一个属性，以及背景层级切换遮住了过渡过程。

> **2026-10-16 更新：** 本文已替换为本站修复后的实现。旧版“直接隐藏各模块，再把背景提到最前”的代码不再使用。新版把功能集中在一个独立组件中，需要在 `Layout.astro` 导入组件并包裹默认插槽，因此也不再称为“零侵入”。

## 1. 为什么写了 transition，还是会闪？

### 和主题的入场动画争用了 opacity

Fuwari 的 `.onload-animation` 使用关键帧控制透明度和位移，并通过 `animation-fill-mode: forwards` 保留结束状态。如果赏图模式又对同一个元素设置 `opacity: 0 !important`，就会在关键帧结果与强制样式之间切换。这种情况下，即使补上 `transition`，也不能保证得到预期的渐隐渐显。

把过渡时间从 0.5 秒改成 1 秒，解决不了这个控制权冲突。

### 背景切换层级，把淡出过程盖住了

旧版进入赏图模式时，会把背景从 `z-index: -1` 提到 `9999`。背景一旦盖到页面上方，下方模块即使还在淡出，用户也看不到了。

后来增加定时器，等半秒再置顶，仍有另一个问题：按 `.card-base` 等类名枚举模块，会遗漏不带这些类的页脚、目录或其他内容。这些元素会在背景置顶时突然消失，背景退回底层时又突然露出来。

### 恢复时不应该把所有模块设成 opacity: 1

主题中的一些元素本来就应该隐藏，例如关闭的浮动面板、尚未到显示条件的“回到顶部”按钮。恢复阶段统一设置 `opacity: 1 !important`，会让它们短暂出现，等恢复样式移除后又消失。

退出赏图模式应该恢复页面的可见性，同时保留各模块自己的显隐状态。

## 2. 新方案：给页面加一层专门负责淡入淡出的容器

页面分成三个部分：

- **页面容器 `#wallpaper-ui`**：包住导航、正文、侧栏、目录和页脚，只负责整体透明度过渡。
- **背景 `#my-custom-bg`**：始终留在底层，只改变透明度、模糊程度和缩放。
- **透明退出按钮 `#wallpaper-exit`**：赏图时覆盖视口，接收点击并显示 `zoom-out` 光标，不绘制背景。

子组件继续使用自己的入场动画和显隐逻辑。页面容器淡出时，它们一起淡出；页面容器恢复时，原本隐藏的元素仍然隐藏。也不需要用定时器等待动画结束再切换层级，动画中途退出时，浏览器可以从当前透明度自然反向过渡。

交互保留双击空白处进入、单击退出，并增加了 Esc 退出。链接、按钮、输入框等交互区域不会触发赏图；背景尚未加载成功时，也不会隐藏页面。

## 3. 创建 WallpaperViewer 组件

新建 `src/components/WallpaperViewer.astro`，内容如下。代码与本站当前组件一致；使用时把 `image.src` 中的地址换成自己的图片地址或随机图片接口。

这是一份 Astro 组件代码，其中的脚本包含 TypeScript 类型。保留普通的 `<script>`，交给 Astro 处理，不要直接改成 `is:inline` 后粘进普通 HTML。

```astro
<!-- 独立的透明度层：不要和子组件的入场动画、菜单显隐争用 opacity。 -->
<div id="wallpaper-ui">
    <slot />
</div>
<div id="my-custom-bg" aria-hidden="true"></div>
<button id="wallpaper-exit" type="button" aria-label="退出赏图模式" hidden></button>

<style is:global>
    #wallpaper-ui {
        isolation: isolate;
        opacity: 1;
        transition: opacity 0.5s ease-in-out;
    }

    body.bg-view-mode #wallpaper-ui {
        opacity: 0;
    }

    #my-custom-bg {
        position: fixed;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: 0;
        filter: blur(3px);
        transform: scale(1.02);
        transition: opacity 0.8s ease-in-out, filter 0.8s ease-in-out, transform 0.8s ease-in-out;
    }

    #my-custom-bg.loaded {
        opacity: 0.6;
    }

    body.bg-view-mode #my-custom-bg.loaded {
        opacity: 1;
        filter: blur(0);
        transform: scale(1);
    }

    /* 用透明按钮接管点击，背景始终留在底层，不切换 z-index。 */
    #wallpaper-exit {
        position: fixed;
        inset: 0;
        z-index: 9999;
        width: 100%;
        height: 100%;
        border: 0;
        padding: 0;
        background: transparent;
        outline: none;
        cursor: zoom-out;
    }

    @media (prefers-reduced-motion: reduce) {
        #wallpaper-ui,
        #my-custom-bg {
            transition: none;
        }
    }
</style>

<script>
    const ui = document.getElementById('wallpaper-ui');
    const background = document.getElementById('my-custom-bg');
    const exitButton = document.getElementById('wallpaper-exit');

    if (ui && background && exitButton) {
        let previousFocus: HTMLElement | null = null;

        const setViewing = (viewing: boolean) => {
            if (viewing === document.body.classList.contains('bg-view-mode')) return;

            if (viewing) {
                previousFocus = document.activeElement instanceof HTMLElement
                    ? document.activeElement : null;
            }

            document.body.classList.toggle('bg-view-mode', viewing);
            ui.inert = viewing;
            exitButton.hidden = !viewing;

            if (viewing) {
                exitButton.focus({ preventScroll: true });
            } else if (previousFocus?.isConnected) {
                previousFocus.focus({ preventScroll: true });
            }
        };

        // 只请求一次图片；先注册回调，再设置 src，兼容缓存命中。
        const image = new Image();
        image.onload = () => {
            background.style.backgroundImage = `url('${image.src}')`;
            background.classList.add('loaded');
        };
        image.src = `https://papi.bbcslook.top/?t=${Date.now()}`;

        document.addEventListener('dblclick', (event) => {
            if (!(event.target instanceof Element)) return;
            if (event.target.closest('a, button, img, input, textarea, select, [contenteditable], [role="button"]')) return;
            if (!background.classList.contains('loaded')) return;
            setViewing(true);
        });

        exitButton.addEventListener('click', () => setViewing(false));
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') setViewing(false);
        });

        // 浏览器前进/后退也可能在赏图时触发站内导航。
        const setupNavigation = () => {
            window.swup.hooks.on('visit:start', () => setViewing(false));
        };
        if (window.swup) setupNavigation();
        else document.addEventListener('swup:enable', setupNavigation, { once: true });
    }
</script>

```

### 为什么还需要 inert？

`opacity: 0` 只让元素看不见，不会阻止它们接受鼠标或键盘操作。进入赏图模式时设置 `ui.inert = true`，可以让整个页面容器暂时不可交互，避免 Tab 键落到看不见的链接上。

同时把焦点移到退出按钮，退出时再尝试恢复到原来的元素。`preventScroll: true` 用于避免焦点切换带动页面滚动。背景始终设置 `pointer-events: none`，退出操作由透明按钮负责。

### 主题切换和站内导航怎么处理？

赏图组件没有改写子组件的颜色、位移或透明度规则，因此不需要在退出时逐个重设它们。

本站使用 Fuwari 的 Swup 导航。组件监听 `visit:start`，在站内导航开始时退出赏图，防止浏览器前进、后退后留下透明且不可交互的页面。这个外层组件位于 Swup 替换区域之外，切换文章时无需重新加载背景或反复绑定事件。如果你的主题没有启用 Swup，可以移除这段导航接入代码。

系统开启“减少动态效果”时，组件会跳过过渡，直接完成显隐。这是对用户偏好的适配，不属于动画闪现问题。

## 4. 在 Layout.astro 中接入

在 `src/layouts/Layout.astro` 顶部已有的 frontmatter 导入区增加：

```ts
import WallpaperViewer from "@components/WallpaperViewer.astro";
```

找到 `<body>` 内原来的默认插槽：

```astro
<ConfigCarrier></ConfigCarrier>
<slot />
```

替换为：

```astro
<ConfigCarrier></ConfigCarrier>
<WallpaperViewer>
    <slot />
</WallpaperViewer>
```

其余布局代码保持原样，包括 `<head>` 中的具名插槽，以及用于页面切换的 `#page-height-extend`。导航、正文、侧栏等通过默认插槽进入新的透明度容器，不需要逐个修改组件。

**如果已经用过本文旧版代码，接入前务必清理旧实现：**

- 删除旧的 `#my-custom-bg` 标签，避免出现重复 ID。
- 删除旧版背景样式，以及 `bg-view-mode`、`bg-view-front`、`bg-view-restoring` 对应的赏图规则。
- 删除旧的背景加载、双击进入、点击退出脚本和相关定时器。

这里删除的是旧赏图功能的代码，不是主题原本的动画和事件。新版组件已经包含图片加载与交互逻辑，只需在全局布局中放置一次。本站之前还重复写了两份背景加载脚本，迁移时也一并清掉，避免两个随机图片请求先后覆盖背景。

## 5. 如何确认修好了？

可以按下面几种场景检查，而不只是看“最后有没有隐藏”：

1. 等页面加载完成，双击空白处，观察导航、卡片、目录和页脚是否一起逐渐变透明。
2. 正常退出，确认原本关闭的菜单、设置面板和隐藏的“回到顶部”按钮没有闪现。
3. 在淡出尚未结束时立即单击，确认能从当前状态平滑恢复，而不是先跳到全透明或全不透明。
4. 滚动到文章中段，进入再退出，确认阅读位置不变，并尝试 Esc 退出。
5. 切换文章、返回上一页后再次使用，确认事件仍有效，背景没有重复加载。
6. 分别检查桌面和手机宽度的布局。手机端是否产生双击事件还取决于浏览器的触摸行为，布局验证不等于所有设备都支持相同手势。

这次修复已在 Edge 浏览器中检查了桌面和手机宽度下的透明度变化、快速退出、焦点恢复、滚动位置、Swup 导航，以及背景加载失败和“减少动态效果”的情况；类型检查和完整构建也已通过。浏览器回归检查使用固定测试背景，真实图片接口的可用性仍取决于你使用的服务。

以后再添加页面模块，只要它位于默认插槽内，就会跟随外层容器一起淡入淡出。这样维护赏图模式时，不用再追着每张卡片和每个按钮补选择器了。
