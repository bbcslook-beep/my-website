---
title: Linux 基础学习笔记：通配符与输出重定向
published: 2026-05-15
description: 记录 Linux 基础命令中的通配符使用方法，以及标准输入输出重定向的原理与实战。
tags: [Linux, 笔记, 基础命令, 终端]
category: '技术笔记'
draft: false
---

## 1. 常见的通配符与正则匹配

在 Linux 系统中，熟练使用通配符可以极大地提高批量处理文件的效率：

:::tip
**通配符基础：**
* `*`：匹配 0 到任意多个字符。
* `?`：匹配单个字符。
* `[abc]`：匹配括号内的任意**一个**字符（如 a、b 或 c）。
* `[^abc]` 或 `[!abc]`：匹配**除了**括号内字符以外的任意单个字符。
* `{a,b,c}`：精确匹配集合中的项（常用于 `touch file{a,b,c}` 批量创建）。
* `{a..c}` 或 `{1..3}`：匹配连续的字母或数字范围。
:::

### POSIX 字符类 (Character Classes)

除了普通通配符，Linux 还支持一些特殊的字符集匹配：

~~~bash title="POSIX_字符匹配示例"
[[:alpha:]] # 匹配单个字母（包含大小写）
[[:upper:]] # 匹配单个大写字母
[[:lower:]] # 匹配单个小写字母
[[:digit:]] # 匹配单个数字
[[:punct:]] # 匹配单个符号
[[:space:]] # 匹配单个空格
[[:alnum:]] # 匹配单个数字或字母
~~~

## 2. 输入输出与重定向原理 (I/O Redirection)

Linux 终端中的命令执行涉及“文件描述符（File Descriptor）”，它们分别是 0、1 和 2：
* `0` 代表标准输入 (stdin)
* `1` 代表标准正确输出 (stdout)
* `2` 代表标准错误输出 (stderr)

:::important
命令后的 `>` 符号默认等同于 `1>`，只会重定向**正确**的执行结果。
:::

### 覆盖重定向 (`>`)

会清空并覆盖目标文件的所有内容：

~~~bash title="覆盖重定向示例"
# 1. 重定向正确输出（屏幕上只提示“权限不够”等错误，正确结果写入 lee）
find /etc/ -name passwd > lee

# 2. 重定向错误输出（屏幕显示正确路径，错误信息写入 lee.err）
find /etc/ -name passwd 2> lee.err

# 3. 重定向所有输出（正确与错误结果统统写入 lee.all，屏幕无回显）
find /etc/ -name passwd &> lee.all
~~~

### 追加重定向 (`>>`)

如果不想覆盖原文件内容，可以使用追加重定向，内容会添加在文件最末尾：

:::note
* `>>`：追加正确输出
* `2>>`：追加错误输出
* `&>>`：追加所有输出
:::

### 数据黑洞 (`/dev/null`)

如果你不希望看到某些报错信息，可以将其重定向到“黑洞”设备中直接丢弃：

~~~bash title="忽略报错输出"
# 执行命令时抛弃错误输出到系统无限空设备中
find /etc/ -name passwd 2> /dev/null
~~~

## 3. 综合实战练习

结合通配符和目录操作的经典练习记录：

~~~bash title="目录与文件批量管理练习"
# 1. 批量创建生产部文件
mkdir -p /tmp/SHENGCHAN
touch /tmp/SHENGCHAN/shengchan_{d,n}_tream{1..6}

# 2. 批量创建季度计划文件
mkdir -p /tmp/SEASON
touch /tmp/SEASON/season{1..4}

# 3. 备份生产部文件（按 d 和 n 分类备份）
mkdir -p /tmp/shengchan_d /tmp/shengchan_n
cp /tmp/SHENGCHAN/*d* /tmp/shengchan_d/
cp /tmp/SHENGCHAN/*n* /tmp/shengchan_n/

# 4. 模拟 U 盘备份，移动计划文件
mkdir -p /tmp/usb
mv /tmp/SEASON/* /tmp/usb/

# 5. 备份 /etc 目录下所有以 .conf 结尾且名字中含有数字的文件
mkdir -p /tmp/confback
cp /etc/*[0-9]*.conf /tmp/confback/
~~~