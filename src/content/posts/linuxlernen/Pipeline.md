---
title: Linux 管道及基础密码练习
published: 2026-05-19
description: 记录我的 Linux 命令行基础练习与操作笔记
tags: [测试, Markdown, Linux]
category: '技术笔记'
draft: false
---

## 1. Linux 基础命令练习笔记

### 1.1 字符转换与重定向 (`tr`, `<`)

`tr` 命令常用于字符转换，但它**不具备直接读取文件的能力**。如果要处理文件内容，必须使用输入重定向符 `<`。

```bash
# 错误示范：直接在后面加文件名会报错
[lee@localhost 桌面]$ tr 'a-z' 'A-Z' lee
tr: 额外的操作数 "lee"
请尝试执行 "tr --help" 来获取更多信息。

# 正确操作：把 lee 文件的内容输入到 tr 命令中进行转换
[lee@localhost 桌面]$ cat lee
hello lee
hello linux
lee

[lee@localhost 桌面]$ tr 'a-z' 'A-Z' < lee
HELLO LEE
HELLO LINUX
LEE
```

### 1.2 密码修改 (`passwd`)

`passwd` 命令在执行时，需要人为非交互或交互式地输入字符串来充当密码。

```bash
[lee@localhost 桌面]$ passwd
更改用户 lee 的密码。
当前的密码:
新的密码:
重新输入新的密码:
passwd: 所有的身份验证令牌已经成功更新。
```

### 1.3 管道符与输出重定向 (`|`, `>`, `tee`)

管道符 `|` 的作用是将前一条命令的输出传递给后一条命令处理。**注意：默认情况下，管道只处理正确输出。**

```bash
# 统计输出字符数
[lee@localhost 桌面]$ date | wc -m
31

# 结合 tee 命令：将命令输入保存到指定文件，同时继续向下传递给 wc 处理
[lee@localhost 桌面]$ date | tee date.txt | wc -m
31
[lee@localhost 桌面]$ cat date.txt
2026年 05月 19日 星期二 18:48:34 CST
```

如果想让管道也处理错误输出，可以通过 `2>&1` 将标准错误（`2`）重定向到标准输出（`1`）：

```bash
[lee@localhost 桌面]$ find /etc/ -name passwd 2>&1 | wc -l
18
```

---

## 2. 第三单元练习项目实战

**练习需求：**
1. 登录系统中的 `tao` 用户，并修改当前用户密码。
2. 在 `tao` 用户中查找 `/etc` 目录中的 `passwd` 文件，确保**只有正确输出**显示。
3. 查找 `/etc` 目录中的 `passwd` 文件，保存正确输出到 `/tmp/tab.out`，错误输出保存到 `/tmp/tab.err`。
4. 查找文件，统计并保存所有的输出内容到 `/tmp/tab4` 中。
5. 用非交互的方式把用户的密码改为 `198711`。

**实操演示：**

```bash
# 需求2：过滤掉权限不够的错误信息 (2>/dev/null)
[lee@localhost 桌面]$ find /etc/ -name passwd 2>/dev/null
/etc/passwd
/etc/pam.d/passwd

# 需求3：分离正确输出与错误输出
[lee@localhost 桌面]$ find /etc/ -name passwd > /tmp/tab.out 2> /tmp/tab.err

# 需求4：将所有输出合并，打印行数，并使用 tee 存入文件
[lee@localhost 桌面]$ find /etc/ -name passwd 2>&1 | tee /tmp/tab4 | wc -l
18
```

---

## 3. 用户与组管理基础

### 3.1 查看系统用户配置 (`/etc/passwd`)

用户和系统交流时相关的配置都存在 `/etc/passwd` 中，它的字段格式为：
`用户名 : 密码占位符 : 用户ID : 主组ID : 用户说明 : 用户家目录 : 默认shell`

```bash
[root@localhost Desktop]# vim /etc/passwd
root:x:0:0:root:/root:/bin/bash
bin:x:1:1:bin:/bin:/sbin/nologin
```

### 3.2 查看用户身份 (`whoami`, `id`)

```bash
# 查看当前 shell 的运行用户
[root@localhost Desktop]# whoami
root

# 查看当前用户的详细 ID 信息
[root@localhost Desktop]# id
uid=0(root) gid=0(root) groups=0(root)...

# 查看指定用户 lee 的信息
[root@localhost Desktop]# id lee
uid=1000(lee) gid=1000(lee) groups=1000(lee),1001(timinglee)

# 常用 id 选项：
[root@localhost Desktop]# id -u lee   # 只显示 UID
1000
[root@localhost Desktop]# id -g lee   # 只显示主组 GID
1000
[root@localhost Desktop]# id -G lee   # 显示所有相关组的 GID
1000 1001
[root@localhost Desktop]# id -Gn lee  # 打印所有相关组的名称
lee timinglee
```

### 3.3 切换用户 (`su` vs `su -`)

*   **`su 用户名`**：只切换用户身份，不切换环境。这会导致身份和环境不配套，引发权限问题。
*   **`su - 用户名`**：身份和环境变量同时彻底切换（推荐）。

```bash
# 错误示范：身份与环境不配套
[root@localhost Desktop]# su lee
[lee@localhost Desktop]$ pwd
/root/Desktop
[lee@localhost Desktop]$ touch file
touch: cannot touch 'file': Permission denied

# 正确示范：完全切换
[root@localhost Desktop]# su - lee
[lee@localhost ~]$ pwd
/home/lee
```

### 3.4 创建与删除用户 (`useradd`, `userdel`)

```bash
# 建立用户
[root@localhost Desktop]# useradd lee

# 删除用户（仅删除身份，不删除家目录等资源）
[root@localhost Desktop]# userdel lee

# 如果只是 userdel，重新创建同名用户时会报错提示资源已存在：
[root@localhost Desktop]# useradd lee
useradd: warning: the home directory /home/lee already exists...

# 彻底删除用户身份及关联资源 (-r)
[root@localhost Desktop]# userdel -r lee
```

### 3.5 监控文件变化 (`watch`)

如果想实时查看某几条命令的输出，可以使用 `watch`。例如每秒执行一次，显示密码和组文件的最后三行，以及家目录内容：

```bash
[root@localhost Desktop]# watch -n 1 "tail -n 3 /etc/passwd /etc/group ; ls -l /home/"
```