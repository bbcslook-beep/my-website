---
title: Linux 入门：远程文件传输与归档操作
published: 2026-06-04
description: 记录 Linux 学习过程中的环境搭建、scp/rsync 远程传输及 tar 归档实战操作。
tags: [Linux, 学习笔记, scp, rsync, tar]
category: '技术笔记'
draft: false
---

## 1. 实验环境设定

在开始远程传输实验前，我们需要准备两台主机，配置好主机名并安装终端工具。

:::note
**主机信息**
* **主机 1**：IP 地址为 `172.25.254.100`，主机名修改为 `node1`。
* **主机 2**：IP 地址为 `172.25.254.128`，主机名修改为 `node2`。
:::

修改主机名的命令非常简单，在终端输入即可：

```bash title="修改主机名"
# 主机 1 中
hostnamectl hostname node1

# 主机 2 中
hostnamectl hostname node2
```

:::tip
**终端工具推荐**
实验中我们使用了 `MobaXterm`。下载便携版（如 `MobaXterm_Portable_v25.4.chs`）并解压后，直接运行桌面上的可执行文件即可开启高效的 SSH 连接体验。
:::

---

## 2. 文件传输命令 scp

`scp` 是 Linux 下基于 SSH 登陆进行安全文件拷贝的命令。

### 2.1 上传文件到远程主机

上传操作的基本语法是将本地文件指向远程接收路径：

```bash title="scp-upload.sh"
# 语法：scp 本地文件路径 远程主机用户@远程主机ip:远程主机接收绝对路径

# 传输单个文件
scp anaconda-ks.cfg root@172.25.254.100:/root/Desktop

# 传输整个目录（使用 -r 参数）
scp -r /etc/ root@172.25.254.100:/root/Desktop

# 静默传输目录（使用 -qr 参数）
scp -qr /etc/ root@172.25.254.100:/root/Desktop
```

### 2.2 从远程主机下载文件

下载操作只需将远程路径和本地路径对调即可：

```bash title="scp-download.sh"
# 语法：scp 远程主机用户@远程主机ip:远程主机接收绝对路径 本地文件路径

scp root@172.25.254.100:/root/Desktop/haha /root/Desktop/
```

---

## 3. rsync 远程文件同步

`rsync` 是一个非常强大的文件同步工具，相比于 `scp`，它可以精确控制需要同步的属性（如权限、时间戳、软链接等）。

### 3.1 rsync 核心参数解析

在实验中，我们创建了用户、测试文件以及软链接来测试不同的同步参数。以下是 `rsync` 常用的核心参数说明：

:::important
* `-r`：复制目录
* `-l`：复制链接
* `-p`：复制权限
* `-t`：复制时间戳
* `-o`：复制拥有者
* `-g`：复制拥有组
* `-D`：复制设备文件
:::

### 3.2 组合使用示例

我们通常会将这些参数组合起来使用，以保证文件属性的一致性：

```bash title="rsync-sync.sh"
# 完整复制目录及所有属性（含链接、权限、时间戳、所有者、组、设备文件）
rsync -lpogtrD /dev/pts root@172.25.254.100:/mnt/
```

---

## 4. 优化远程传输：tar 文件归档

在传输大量小文件时，先将它们打包成一个归档文件再传输，可以极大提升传输效率。这就是 `tar` 命令的用武之地。

:::note
归档就是把多个文件变成一个归档文件，便于统一管理和传输。
:::

### 4.1 tar 核心参数解析

以下是 `tar` 命令操作的高频参数：

| 参数 | 作用 |
| :--- | :--- |
| `c` | 创建归档 |
| `f` | 指定文件名称 |
| `x` | 解开归档 |
| `v` | 显示处理过程 |
| `t` | 查看归档文件内容 |
| `r` | 向归档文件中追加文件 |
| `--get` | 仅解档指定文件 |
| `--delete` | 从归档中删除指定文件 |
| `-C` | 指定解压输出的路径 |

### 4.2 常用实战操作

```bash title="tar-examples.sh"
# 1. 创建归档
tar cf etc.tar /etc/

# 2. 查看归档内容
tar tf etc.tar

# 3. 解档指定文件 (例如提取 etc 目录)
tar f etc.tar --get etc

# 4. 从归档中删除指定文件 (例如删除 lee 文件)
tar f etc.tar --delete lee

# 5. 解档到指定路径 (使用 -C 参数解压到 /root/ 目录)
tar xf etc.tar -C /root/
```

:::caution
使用 `tar cf` 创建归档时，系统通常会提示“从成员名中删除开头的 `/` ”。这是系统为了防止解压时覆盖根目录下原有文件的安全机制，属于正常现象。
:::