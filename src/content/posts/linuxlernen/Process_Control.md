---
title: Linux 基础学习笔记：进程管理与系统服务控制
published: 2026-06-02
description: 整理了 Linux 下的进程查看、前后台调度、优先级调整、信号控制以及 systemctl 系统服务的核心管理操作。
tags: [Linux, 进程管理, systemctl, 运维]
category: '技术笔记'
draft: false
---

## 1. 进程查看命令

在 Linux 系统中，有多种方式可以查看和监控系统的进程状态。

### 1.1 `ps` 命令
`ps` 是最常用的进程查看工具，默认只显示当前终端中运行的进程。它支持不同风格的参数：

* **BSD 风格参数**：
  * `ps a`：显示系统中所有有字符设备使用的进程。
  * `ps x`：显示系统中所有无字符设备使用进程。
  * `ps aux`：查看包含用户等详细信息的全部进程。
  * `ps f`：以树状结构显示进程层级关系。
  * `ps axo`：自定义输出列，例如 `ps axo pid,comm,%cpu,%mem,stat,pri,nice`。

* **UNIX 风格参数**：
  * `ps -e`：显示所有进程。
  * `ps -H`：展示进程的树状结构。
  * `ps -Hf`：展示包含 UID、PPID 等详细信息的树状结构。

:::tip
你可以配合 `--sort` 进行排序，例如 `--sort=%cpu` 表示按 CPU 使用率正序排列，`--sort=-%cpu` 表示逆序排列。
:::

```bash title="ps_sort_example.sh"
# 按内存使用率倒序排列并查看前 10 个进程
ps axo %cpu,%mem,comm,pid --sort=-%mem | head -n 10
```

### 1.2 `pgrep` 与 `pidof`
如果你想快速通过条件检索进程，可以使用这两个命令。

* `pgrep -u` 或 `-U`：根据用户的 ID 或名称检索进程。
* `pgrep -P`：根据父进程 PID 检索子进程。
* `pgrep -l`：同时显示进程名称。
* `pidof`：直接根据进程的名称获取对应的 PID。

### 1.3 `top` 动态监控
`top` 能够实时动态地查看系统资源占用情况。支持启动参数如 `-d` (刷新频率)、`-b` (批处理模式)、`-n` (刷新次数)。

:::note
**top 内部常用快捷键：**
* `P`：按 CPU 使用率排序。
* `M`：按内存占用排序。
* `T`：按累计占用 CPU 时间排序。
* `k`：输入 PID 和 9 即可结束进程。
* `u`：查看指定用户的进程。
:::

---

## 2. 进程的前后台调用

在终端操作时，有时我们需要让耗时的任务在后台运行。

* `命令 &`：将程序直接放在后台运行，不占用当前的 shell。
* `<ctrl>+<z>`：将占用当前 shell 的进程打入后台并挂起（暂停运行）。
* `jobs`：查看当前 shell 在后台挂起的所有工作。
* `bg <任务编号>`：让后台挂起的进程继续在后台运行。
* `fg <任务编号>`：将后台进程调回前台运行。

---

## 3. 进程优先级调整

进程优先级可以通过 `nice` 值来反映，我们可以在启动时指定或者运行中调整。

:::important
使用 `watch -n 1` 可以实现每秒刷新监控特定进程的状态，例如 `watch -n 1 "ps axo pid,comm,stat,pri,nice | grep firefox"`。
:::

* **调整已开启进程**：使用 `renice -n <优先级> <PID>` 命令。
* **开启进程时指定**：使用 `nice -n <优先级> <程序名> &` 命令。

---

## 4. 进程信号控制

当我们想要终止或强制关闭某个进程时，可以使用以下命令发送信号（例如 -9 强制结束）：

* **kill**：跟据 PID 结束特定进程，如 `kill -9 10850`。
* **killall**：根据进程名批量结束，如 `killall -9 vim`。
* **pkill**：根据特定条件结束进程，比如强制结束某个用户的所有进程：`pkill -9 -u lee`。

:::caution
`-9` 信号表示强行杀掉进程，建议在常规结束无效时使用，以免造成数据丢失。
:::

---

## 5. 系统守护进程 (以 sshd 为例)

系统守护进程是由 `systemctl` 来进行控制和管理的。我们以远程连接服务 `sshd` 为例：

```bash title="systemctl_commands.sh"
# 启动与关闭
systemctl start sshd     # 启动服务
systemctl stop sshd      # 停止服务
systemctl restart sshd   # 重启服务
systemctl status sshd    # 查看服务当前状态

# 开机启动管理
systemctl enable sshd          # 设置开机自启
systemctl disable sshd         # 关闭开机自启
systemctl enable --now sshd    # 立即启动并设置开机自启
systemctl disable --now sshd   # 立即关闭并取消开机自启
```

:::warning
**关于服务冻结 (Mask)：**
如果想彻底禁用某服务使其无法被手动启动，可以使用 `systemctl mask sshd` 命令将其冻结并链接到 `/dev/null`。若需恢复，使用 `systemctl unmask sshd` 即可。
:::

### 系统启动目标 (Target) 控制
我们还可以控制系统默认进入的模式（例如图形界面或命令行界面）：
* 查看默认启动模式：`systemctl get-default`
* 设置开机不启动图形界面：`systemctl set-default multi-user.target`
* 设置开机自启动图形界面：`systemctl set-default graphical.target`
* 临时手动打开图形界面：`init 5`