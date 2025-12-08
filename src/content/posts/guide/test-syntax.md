---
title: Fuwari 核心语法测试
published: 2025-12-08
description: 测试一下这个主题的高级 Markdown 功能
image: "" 
tags: [测试, Markdown]
category: 技术
draft: false
---

## 1. 漂亮的提示块 (Admonitions)

Fuwari 内置了很好看的提示块，不需要装插件：

:::tip
这是一个 **提示** 块。适合放一些小技巧。
:::

:::warning
这是一个 **警告** 块。注意前方高能！
:::

:::note
这是一个 **Note (笔记)** 块（蓝色/灰色）。
:::

:::important
这是一个 **Important (重要)** 块（紫色）。
:::

:::caution
这是一个 **Caution (危险/注意)** 块（红色）。
:::

## 2. 代码块 (带标题)

```python title="app.py"
def hello():
    print("Hello, World!")