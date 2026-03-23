---
title: Fuwari 主题进阶：零侵入实现沉浸式背景图鉴赏模式
published: 2026-03-23
description: 教你如何通过一段纯独立的前端代码，在 Fuwari 博客中实现双击隐藏 UI 的沉浸式赏图彩蛋。
tags: [Fuwari, Astro, 前端开发, 教程]
category: '折腾记录'
draft: false
---

在使用 GitHub 优秀的开源博客主题 Fuwari 时，很多小伙伴都喜欢挂载精美的全局背景图。但平时阅读时，为了保证文字可读性，背景通常会被模糊化处理，且被各种文章卡片遮挡。

如果能让用户在遇到喜欢的背景时，一键隐藏所有 UI，“沉浸式”地欣赏原图，博客的交互体验绝对会拉满！

> **核心诉求：**
> 作为开发者，我们应该老老实实写新组件，绝对不瞎改原生主题的结构代码。这样才能保证未来主题更新时，依然能够无痛升级。本文的方法完美遵循了这一“零侵入”原则。

## 1. 功能亮点

* **防误触设计：** 采用双击空白处触发，避免用户在日常阅读、点击页面时让 UI 突然消失的尴尬。
* **丝滑过渡：** 利用 CSS3 transition，实现 UI 的渐隐以及背景模糊度（Blur）的平滑过渡。
* **零代码侵入：** 纯独立的 HTML/CSS/JS 结构，无需修改 Fuwari 内部的 Layout 或 Component 逻辑。

## 2. 完整代码实现

你可以直接将以下代码保存为一个单独的 `.astro` 组件，或者直接注入到全局的自定义 HTML 结构中。

```html
<div id="my-custom-bg"></div>

<style>
  /* --- 1. 背景原生样式（增加对模糊和缩放的过渡） --- */
  #my-custom-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -1;
    pointer-events: none;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0;
    /* 关键：把 filter 和 transform 也加入过渡，让清晰化的过程变平滑 */
    transition: opacity 0.8s ease-in-out, filter 0.8s ease-in-out, transform 0.8s ease-in-out;
  }
  
  #my-custom-bg.loaded {
    opacity: 0.6;
    filter: blur(3px); /* 默认模糊 */
    transform: scale(1.02); /* 防漏边 */
  }

  /* --- 2. 沉浸模式样式控制 --- */
  
  /* 给页面上除背景外的所有外层元素加上透明度过渡 */
  body > *:not(#my-custom-bg):not(script):not(style) {
    transition: opacity 0.5s ease-in-out;
  }

  /* 当 body 加上 'bg-view-mode' 类时，隐藏主界面UI */
  body.bg-view-mode > *:not(#my-custom-bg):not(script):not(style) {
    opacity: 0 !important;
    pointer-events: none !important; /* 让隐藏的UI不再阻挡鼠标 */
  }

  /* 当进入沉浸模式时，改变背景自身的状态 */
  body.bg-view-mode #my-custom-bg.loaded {
    opacity: 1; /* 亮度拉满 */
    filter: blur(0px); /* 取消模糊 */
    transform: scale(1); /* 恢复正常大小 */
    z-index: 9999; /* 提至最前，盖住隐形的UI */
    pointer-events: auto; /* 允许响应鼠标事件（这样点击它才能退出） */
    cursor: zoom-out; /* 鼠标变成缩小放大镜，提示用户点击退出 */
  }
</style>

<script is:inline data-swup-ignore-script>
  (function() {
    // 替换为你的随机图片 API
    const apiUrl = "[https://papi.bbcslook.top/](https://papi.bbcslook.top/)";
    const bgBox = document.getElementById('my-custom-bg');
    if (!bgBox) return;

    // 1. 加载背景图片
    const img = new Image();
    img.src = apiUrl + '?t=' + new Date().getTime();
    
    img.onload = () => {
      bgBox.style.backgroundImage = `url('${img.src}')`;
      bgBox.classList.add('loaded');
    };

    // 2. 双击页面空白处进入“赏图模式”
    document.addEventListener('dblclick', function(e) {
      // 防误触：如果用户双击的是链接、按钮、图片或输入框，则不触发
      if (e.target.closest('a, button, img, input, textarea')) return;
      
      // 给 body 加上一个状态 Class
      document.body.classList.add('bg-view-mode');
    });

    // 3. 点击高清背景恢复原状
    bgBox.addEventListener('click', function() {
      if (document.body.classList.contains('bg-view-mode')) {
        document.body.classList.remove('bg-view-mode');
      }
    });
  })();
</script>
```
## 3. 原理解析：为什么要这么写？
1. 暴力的 CSS 选择器 body > *:not(...)
这是一个极其省事的“黑魔法”。它会选中 body 节点下的所有第一级标签（无论 Fuwari 把主容器叫 #app 还是其他什么），但排除了我们的背景图本身、script 和 style 标签。这正是实现“零代码侵入”的核心，你根本不需要去关心原生主题的 HTML 结构。

2. 为什么用 dblclick (双击) 代替 click (单击)
如果用单击，用户在页面上随意点一下来激活浏览器窗口，或者习惯性地无意识点击时，整个网页就会突然消失，这会被当成 Bug。改为双击后，它变成了一个“隐藏彩蛋”，只有用户真正有意识地“敲击”背景时才会触发。

3. 光标细节 cursor: zoom-out;
不要小看这行代码。进入赏图模式后，我们把背景的 z-index 提到最高，同时将鼠标光标变成了“缩小放大镜（🔍带个减号）”。这是一种无声的用户体验（UX）引导，用户会本能地知道：“点一下就会退出这个模式”，避免他们迷失在没有任何 UI 的页面里。

赶紧去试试吧，给你的博客加上这个炫酷的沉浸式彩蛋！