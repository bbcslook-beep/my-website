---
title: Linux 基础学习笔记：进程管理与系统服务控制
published: 2026-06-02
description: 整理了 Linux 下的进程查看、前后台调度、优先级调整、信号控制、自定义系统服务以及 systemctl 与 journalctl 的核心管理操作。
tags: [Linux, 进程管理, systemctl, 运维, bash]
category: '技术笔记'
draft: false
---

## 1. 进程查看与监控命令

在 Linux 系统中，有多种方式可以查看和监控系统的进程状态，排查性能瓶颈。

### 1.1 `ps` 命令：静态进程查看
`ps` 是最常用的进程查看工具，默认只显示当前终端中运行的进程。它支持不同风格的参数组合。

| 参数组合 | 风格 | 作用描述 |
| :--- | :--- | :--- |
| `ps a` | BSD | 显示系统中所有与终端（字符设备）有关的进程。 |
| `ps x` | BSD | 显示系统中所有与终端无关的进程。 |
| `ps aux` | BSD | 查看包含所属用户、CPU、内存使用率等详细信息的全部进程。 |
| `ps f` | BSD | 以树状结构显示进程层级与派生关系。 |
| `ps axo` | BSD | 自定义输出列（如 `pid,comm,%cpu,%mem,stat`）。 |
| `ps -e` | UNIX | 显示所有进程（等同于 BSD 的 `ax`）。 |
| `ps -H` | UNIX | 展示进程的树状结构。 |
| `ps -ef` | UNIX | 全格式显示所有进程，包含 UID、PID、PPID 和启动时间等。 |

:::tip
你可以配合 `--sort` 进行排序。例如 `--sort=%cpu` 表示按 CPU 使用率正序排列，`--sort=-%cpu` 表示逆序排列。此外，结合 `grep` 可以实现精准过滤，但常需用 `grep -v grep` 排除查询命令本身。
:::

```bash title="ps_advanced_examples.sh"
# 1. 按内存使用率倒序排列并查看前 10 个进程
ps axo %cpu,%mem,comm,pid --sort=-%mem | head -n 10

# 2. 查找 nginx 进程的详细信息，并排除掉 grep 自身的进程
ps aux | grep nginx | grep -v grep

# 3. 统计系统中状态为 Z (Zombie，僵尸进程) 的进程数量
ps aux | awk '{print $8}' | grep -c Z

```

### 1.2 `pgrep` 与 `pidof`：进程检索

如果你想快速通过条件检索进程 PID，使用这两个专用命令比 `ps | grep` 更高效。

* **pgrep -u <用户>**: 检索特定用户运行的进程 PID。
* **pgrep -P**: 根据父进程 PID 检索所有子进程。
* **pgrep -l <名称>**: 检索时同时显示进程名称，而不仅仅是 PID。
* **pidof <程序名>**: 直接精确匹配程序名并返回对应的所有 PID。

```bash title="pgrep_pidof_examples.sh"
# 查找属于 root 用户的 sshd 进程 PID
pgrep -u root sshd

# 直接获取 nginx master/worker 的所有 PID
pidof nginx

```

### 1.3 `top` 与 `htop`：动态监控

`top` 能够实时动态地查看系统资源占用情况。支持启动参数如 `-d` (刷新频率)、`-b` (批处理模式，适合导出日志)、`-n` (刷新次数)。

| top 快捷键 | 触发动作 |
| --- | --- |
| `P` | 按 CPU 使用率排序。 |
| `M` | 按内存占用排序。 |
| `T` | 按累计占用 CPU 时间排序。 |
| `k` | 输入 PID 和信号（如 9）结束进程。 |
| `u` | 仅查看指定用户的进程。 |
| `1` | 展开/折叠各个 CPU 核心的具体使用情况。 |

:::note
**推荐扩展：htop**
在现代 Linux 运维中，常使用 `htop` 替代 `top`。它提供了色彩丰富的 UI、支持鼠标点击操作、能直观展示树状结构（快捷键 `F5`），并可以直接按 `F9` 发送控制信号，对新手更加友好。
:::

---

## 2. 进程的前后台调用与脱机运行

在终端操作时，有时我们需要让耗时的任务在后台运行，或者确保退出终端后任务依然继续。

* **命令 &**：将程序直接放在后台运行，终端仍可输入，但程序输出可能会打断终端。
* **+**：将占用当前 shell 的前台进程强制打入后台并挂起（暂停运行状态 Stopped）。
* **jobs**：查看当前 shell 维护的后台任务列表及编号。
* **bg <任务编号>**：(Background) 让后台挂起的进程恢复运行，继续在后台执行。
* **fg <任务编号>**：(Foreground) 将后台进程调回前台继续运行。

:::important
**脱机运行神器：nohup**
如果你通过 `&` 将程序放入后台，当你关闭 SSH 终端时，该进程依然会被系统强杀。要实现真正的“脱机运行”，需要结合 `nohup` (No Hang Up) 命令。
:::

```bash title="background_jobs_examples.sh"
# 1. 运行一个耗时的打包任务，将其放入后台，并将标准输出与错误合并写入日志
nohup tar -czvf backup.tar.gz /var/log > backup.log 2>&1 &

# 2. 查看当前分配的后台任务
jobs
# 输出示例: [1]+  Running  nohup tar -czvf backup.tar.gz /var/log > backup.log 2>&1 &

# 3. 假设任务挂起了，将其调回前台
fg 1

```

---

## 3. 进程优先级调整 (Nice / Renice)

Linux 内核通过分配 CPU 时间片来调度进程。我们可以通过调整 `nice` 值 (-20 到 19) 来影响进程优先级。

* **数值越小**：优先级越高，抢占 CPU 能力越强（最高 -20）。
* **数值越大**：优先级越低，越谦让 CPU 资源（最低 19）。
* **权限限制**：普通用户只能调高 nice 值（降低优先级），只有 root 用户才能调低 nice 值（提高优先级）。

```bash title="priority_control.sh"
# 1. 启动时指定优先级：以极低的优先级运行一个极度消耗 CPU 的数据分析脚本
nice -n 19 python3 data_analysis.py &

# 2. 实时监控脚本的 PID, 命令名, 状态, 优先级 (PRI) 和 nice 值 (NI)
watch -n 1 "ps axo pid,comm,stat,pri,nice | grep python3"

# 3. 调整已运行进程的优先级：发现脚本太慢了，root 用户将其优先级调高
renice -n -5 10452  # 假设 10452 是 python3 的 PID

```

---

## 4. 进程信号控制

进程间的通信与控制大多依赖“信号 (Signals)”。最常用的杀进程指令，本质上是向进程发送不同的中断信号。

| 信号编号 | 信号名称 | 作用与含义 |
| --- | --- | --- |
| `-1` | SIGHUP | 挂起信号。常用于通知服务进程重新加载配置文件（不重启 PID）。 |
| `-9` | SIGKILL | 绝对强制终止。内核直接回收资源，进程无法拦截或清理善后工作。 |
| `-15` | SIGTERM | 正常终止（默认信号）。通知进程退出，进程可以保存数据并优雅关闭。 |

:::caution
通常建议先使用默认的 `kill` (即发送 -15 信号) 让进程安全退出。如果进程卡死无响应（例如处于 D 状态或无限死循环），再使用强杀 `-9` 信号，以免造成数据库损坏或文件写入中断。
:::

```bash title="kill_signals_examples.sh"
# 优雅关闭指定 PID 的进程（等同于 kill -15）
kill 10850

# 强制结束卡死的进程
kill -9 10850

# 通知 Nginx 重新加载配置文件而不中断当前连接
killall -1 nginx

# 踢出某个恶意用户的全部进程（强制下线）
pkill -9 -u hacker_lee

```

---

## 5. 系统守护进程与 systemctl 管理

现代 Linux (如 CentOS 7+, Ubuntu 16.04+) 全面采用 `systemd` 来初始化和管理系统服务。

### 5.1 服务启停与状态管理 (以 sshd 为例)

```bash title="systemctl_basic.sh"
# 基础状态控制
systemctl start sshd     # 启动服务
systemctl stop sshd      # 停止服务
systemctl restart sshd   # 重启服务 (无论之前是否运行)
systemctl reload sshd    # 重新加载配置 (平滑重载，不中断服务)
systemctl status sshd    # 查看运行状态、PID 以及最近几行日志

# 开机自启管理
systemctl enable sshd          # 仅设置开机自启
systemctl disable sshd         # 取消开机自启
systemctl enable --now sshd    # 立即启动，并设置开机自启
systemctl disable --now sshd   # 立即停止，并取消开机自启

```

### 5.2 冻结 (Mask) 与批量状态查询

如果想彻底禁用某服务使其无法被其他服务依赖或手动启动，可以使用 `mask` 将其链接到 `/dev/null`。

```bash title="systemctl_advanced.sh"
# 彻底冻结服务
systemctl mask firewalld
# 恢复冻结的服务
systemctl unmask firewalld

# 列出系统中所有服务单元的状态
systemctl list-unit-files --type=service

# 查询系统中所有启动失败的服务 (排错必备)
systemctl --failed

```

### 5.3 自定义 systemd 服务配置

当你自己写了一个后台程序并希望通过 `systemctl` 托管时，可以在 `/etc/systemd/system/` 下新建 `.service` 文件。

```ini title="/etc/systemd/system/my_app.service"
[Unit]
Description=My Custom Python Application
After=network.target

[Service]
Type=simple
User=www-data
Restart=always
RestartSec=3
ExecStart=/usr/bin/python3 /opt/my_app/main.py

[Install]
WantedBy=multi-user.target

```

:::warning
**注意守护进程重载：**
每次修改或新增 `.service` 文件后，必须先执行 `systemctl daemon-reload` 通知 systemd 重新扫描配置文件，否则新配置不会生效。
:::

### 5.4 系统启动目标 (Target) 控制

`systemd` 使用 Target 来替代传统的 Runlevel 进行启动模式管理：

| 命令操作 | 对应传统 Runlevel | 作用解释 |
| --- | --- | --- |
| `systemctl get-default` | 无 | 查看当前系统默认的启动模式 |
| `systemctl set-default multi-user.target` | `init 3` | 设置为开机进入无图形化的纯命令行模式（服务器常用） |
| `systemctl set-default graphical.target` | `init 5` | 设置为开机进入图形用户界面模式 |
| `systemctl isolate graphical.target` | `init 5` | 临时、不重启地切换到图形界面模式 |

### 5.5 配合 Journalctl 查看服务日志

由 `systemd` 托管的服务，其标准输出和错误日志会被自动接管，查阅方式如下：

```bash title="journalctl_examples.sh"
# 查看特定服务的所有日志
journalctl -u sshd

# 实时追踪特定服务的最新日志（类似 tail -f）
journalctl -u my_app.service -f

# 查看系统今天以来的所有报错级日志
journalctl --since "today" -p err

```
