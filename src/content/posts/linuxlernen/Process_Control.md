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

**示例** 

```bash
# ==========================================
# 1. 默认执行 (不带任何参数)
# ==========================================
[root@localhost ~]# ps
    PID TTY          TIME CMD
   2765 pts/2    00:00:00 bash
   3415 pts/2    00:00:00 vim
   3416 pts/2    00:00:00 ps

# 默认情况下，只显示当前终端（TTY）中运行的进程。


# ==========================================
# 2. BSD 风格参数 (通常不带连字符 '-')
# ==========================================
# x 表示显示系统中所有没有控制终端（无字符设备）的进程，通常是后台的服务或守护进程。
[root@localhost ~]# ps x
    PID TTY      STAT   TIME COMMAND
      2 ?        S      0:00 [kthreadd]
      3 ?        S      0:00 [pool_workqueue_]
      4 ?        I<     0:00 [kworker/R-rcu_g]
      5 ?        I<     0:00 [kworker/R-sync_]
      6 ?        I<     0:00 [kworker/R-slub_]
      7 ?        I<     0:00 [kworker/R-netns]

# a 表示显示系统中所有带有控制终端（有字符设备）的进程，无论它是哪个用户启动的。
[root@localhost ~]# ps a
    PID TTY      STAT   TIME COMMAND
   1997 tty2     Ssl+   0:00 /usr/libexec/gdm-wayland-session env GNOME_SHELL_SESSION_MODE=classic gnom
   2006 tty2     Sl+    0:00 /usr/libexec/gnome-session-binary
   2703 pts/1    Ss+    0:00 -bash
   2765 pts/2    Ss     0:00 -bash
   3415 pts/2    T      0:00 vim
   3552 pts/2    R+     0:00 ps a

# ax 结合了 a 和 x，作用是查看系统中所有的进程（相当于全景图）。
[root@localhost ~]# ps ax

# u 表示以面向用户的详细格式显示（User-oriented），增加显示进程所有者、CPU使用率、内存使用率等重要指标。
# 配合 ax 使用 (ps aux) 是 Linux 中最常用的查看所有进程详细状态的命令组合。
[root@localhost ~]# ps aux
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.4 174072 16560 ?        Ss   17:51   0:01 /usr/lib/systemd/systemd rhgb --swit
root           2  0.0  0.0      0     0 ?        S    17:51   0:00 [kthreadd]
root           3  0.0  0.0      0     0 ?        S    17:51   0:00 [pool_workqueue_]
root           4  0.0  0.0      0     0 ?        I<   17:51   0:00 [kworker/R-rcu_g]


# f (BSD风格) 表示以树状结构（forest）显示进程间的层级/父子关系，通过 \_ 符号连接。
[root@localhost ~]# ps f
    PID TTY      STAT   TIME COMMAND
   2765 pts/2    Ss     0:00 -bash
   3415 pts/2    T      0:00  \_ vim
   3564 pts/2    R+     0:00  \_ ps f
   2703 pts/1    Ss+    0:00 -bash
   1997 tty2     Ssl+   0:00 /usr/libexec/gdm-wayland-session env GNOME_SHELL_SESSION_MODE=classic gnom
   2006 tty2     Sl+    0:00  \_ /usr/libexec/gnome-session-binary


# o 表示允许用户自定义输出的列（Format）。
# 下面逐步增加需要显示的列名：
# 仅显示进程 PID：
[root@localhost ~]# ps axo pid
    PID
      1

# 显示 PID 和 命令名称(comm)：
[root@localhost ~]# ps axo pid,comm
    PID COMMAND
      1 systemd

# 显示 PID、命令名称、CPU利用率(%cpu)：
[root@localhost ~]# ps axo pid,comm,%cpu
    PID COMMAND         %CPU
      1 systemd          0.0

# 显示 PID、命令名称、CPU利用率、内存利用率(%mem)：
[root@localhost ~]# ps axo pid,comm,%cpu,%mem
    PID COMMAND         %CPU %MEM
      1 systemd          0.0  0.4

# 追加显示进程状态(stat)：
[root@localhost ~]# ps axo pid,comm,%cpu,%mem,stat
    PID COMMAND         %CPU %MEM STAT
      1 systemd          0.0  0.4 Ss

# 追加显示进程优先级(pri)：
[root@localhost ~]# ps axo pid,comm,%cpu,%mem,stat,pri
    PID COMMAND         %CPU %MEM STAT PRI
      1 systemd          0.0  0.4 Ss    19

# 追加显示进程的 nice 值(nice，用于调节优先级)：
[root@localhost ~]# ps axo pid,comm,%cpu,%mem,stat,pri,nice
    PID COMMAND         %CPU %MEM STAT PRI  NI
      1 systemd          0.0  0.4 Ss    19   0


# ==========================================
# 3. UNIX / System V 风格参数 (通常带有连字符 '-')
# ==========================================

# -e 表示显示所有进程（Every），效果等同于 BSD 风格的 ax。
[root@localhost ~]# ps -e
    PID TTY          TIME CMD
      1 ?        00:00:01 systemd
      2 ?        00:00:00 kthreadd
      3 ?        00:00:00 pool_workqueue_
      4 ?        00:00:00 kworker/R-rcu_g

# -H 表示以缩进的层级结构显示进程树（Hierarchy），表现父子进程关系。
[root@localhost ~]# ps -H
    PID TTY          TIME CMD
   2765 pts/2    00:00:00 bash
   3415 pts/2    00:00:00   vim
   3627 pts/2    00:00:00   ps

# -f 表示全格式输出（Full-format），会多出 UID, PPID(父进程ID), C(CPU使用指数), STIME(启动时间) 等字段。
# 这里与 -H 组合使用，既有全格式输出，又带有进程树层级缩进。
[root@localhost ~]# ps -Hf
UID          PID    PPID  C STIME TTY          TIME CMD
root        2765    2763  0 17:52 pts/2    00:00:00 -bash
root        3415    2765  0 18:19 pts/2    00:00:00   vim
root        3628    2765  0 18:40 pts/2    00:00:00   ps -Hf


# ==========================================
# 4. 排序输出 (--sort) 与结果截取 (head)
# ==========================================

# --sort=%cpu：按照 CPU 使用率进行【正序】排列（从小到大）。
# | head -n 10：利用管道符过滤，只显示前 10 行（包含1行表头，实际为前9个最不占CPU的进程）。
[root@localhost ~]# ps axo %cpu,%mem,comm,pid --sort=%cpu | head -n 10
%CPU %MEM COMMAND             PID
 0.0  0.4 systemd               1
 0.0  0.0 kthreadd              2
 0.0  0.0 pool_workqueue_       3
 0.0  0.0 kworker/R-rcu_g       4
 0.0  0.0 kworker/R-sync_       5
 0.0  0.0 kworker/R-slub_       6
 0.0  0.0 kworker/R-netns       7
 0.0  0.0 kworker/R-mm_pe      11
 0.0  0.0 rcu_tasks_kthre      13

# --sort=-%cpu：加上减号(-)表示按照 CPU 使用率进行【倒序】排列（从大到小）。
# 这是排查系统中“哪些进程最吃CPU”的标准操作。
[root@localhost ~]# ps axo %cpu,%mem,comm,pid --sort=-%cpu | head -n 10
%CPU %MEM COMMAND             PID
 1.2  9.4 gnome-shell        2062
 0.1  1.0 vmtoolsd           2270
 0.1  3.9 gnome-software     2271
 0.1  0.0 kworker/1:3-eve    3311
 0.0  0.4 systemd               1
 0.0  0.0 kthreadd              2
 0.0  0.0 pool_workqueue_       3
 0.0  0.0 kworker/R-rcu_g       4
 0.0  0.0 kworker/R-sync_       5

# --sort=%mem：按照内存使用率【正序】排列（从小到大）。
[root@localhost ~]# ps axo %cpu,%mem,comm,pid --sort=%mem | head -n 10
%CPU %MEM COMMAND             PID
 0.0  0.0 kthreadd              2
 0.0  0.0 pool_workqueue_       3
 0.0  0.0 kworker/R-rcu_g       4
 0.0  0.0 kworker/R-sync_       5
 0.0  0.0 kworker/R-slub_       6
 0.0  0.0 kworker/R-netns       7
 0.0  0.0 kworker/R-mm_pe      11
 0.0  0.0 rcu_tasks_kthre      13
 0.0  0.0 rcu_tasks_rude_      14

# --sort=-%mem：按照内存使用率【倒序】排列（从大到小）。
# 常用于排查内存泄漏，或者找寻当前系统中“最占用内存”的进程。
[root@localhost ~]# ps axo %cpu,%mem,comm,pid --sort=-%mem | head -n 10
%CPU %MEM COMMAND             PID
 1.2  9.4 gnome-shell        2062
 0.1  3.9 gnome-software     2271
 0.0  1.7 rhsm-service       2397
 0.0  1.6 gsd-xsettings      2403
 0.0  1.6 ibus-x11           2460
 0.0  1.5 xdg-desktop-por    2454
 0.0  1.3 evolution-alarm    2266
 0.0  1.2 Xwayland           2381
 0.0  1.1 firewalld           847

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

**示例** 

```bash
#实验素材
# 提示：打开两个shell执行，为了模拟多终端下的进程状态
# 切换用户身份到 lee（模拟用户登录行为，产生 bash 和 su 进程）
[root@localhost Desktop]# su - lee

# 查看用户 lee 的身份信息，获取其 UID（这里 UID 为 2007）
[root@localhost ~]# id lee
用户id=2007(lee) 组id=2009(lee) 组=2009(lee)

# pgrep 命令用于查找进程
# -u 参数：根据有效用户ID (EUID) 查找进程。这里查找 EUID 为 2007 的进程 PID
[root@localhost ~]# pgrep  -u 2007
3783
3847

# -l 参数：在输出 PID 的同时，显示进程的名称
[root@localhost ~]# pgrep  -lu 2007
3783 bash
3847 bash

# -U 参数：根据真实用户 (Real User) 查找进程。可以直接使用用户名 lee 进行查找
[root@localhost ~]# pgrep  -lU lee
3783 bash
3847 bash

# -a 参数：显示完整的命令行（包含启动参数），比 -l 显示的信息更详细
[root@localhost ~]# pgrep  -aU lee
3783 -bash
3847 -bash

# 运行 vim 编辑器，并通过在末尾加上 & 将其放入后台挂起运行
[root@localhost ~]# vim &
[2] 3886

# ps 命令：查看当前终端下的活动进程（默认只显示当前终端的进程）
[root@localhost ~]# ps
    PID TTY          TIME CMD
   2765 pts/2    00:00:00 bash
   3415 pts/2    00:00:00 vim
   3886 pts/2    00:00:00 vim

# ps f 命令：以树状（层级/森林）格式显示进程列表，直观展示进程间的父子关系
[root@localhost ~]# ps f
    PID TTY      STAT   TIME COMMAND
   3816 pts/3    Ss     0:00 bash
   3846 pts/3    S      0:00  \_ su - lee
   3708 pts/0    Ss     0:00 bash
   3782 pts/0    S      0:00  \_ su - lee
   2765 pts/2    Ss     0:00 -bash
   3415 pts/2    T      0:00  \_ vim
   3886 pts/2    T      0:00  \_ vim

# -P 参数：根据父进程ID (PPID) 查找子进程。这里查找父进程PID为 2765 (-bash) 的所有子进程
[root@localhost ~]# pgrep -P 2765
3415
3886

# -lP 组合参数：查找父进程PID为 2765 的子进程，并同时显示这些子进程的名字 (vim)
[root@localhost ~]# pgrep -lP 2765
3415 vim
3886 vim

# -t 参数：根据终端号 (Terminal/TTY) 查找进程。这里查找运行在 pts/0 虚拟终端上的所有进程及名字
[root@localhost ~]# pgrep  -lt pts/0
3708 bash
3782 su
3783 bash
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

**示例** 

```bash
[root@localhost ~]# top
top - 19:53:38 up  2:02,  4 users,  load average: 0.00, 0.00, 0.06
Tasks: 316 total,   1 running, 313 sleeping,   2 stopped,   0 zombie
%Cpu(s):  0.0 us,  0.0 sy,  0.0 ni, 96.9 id,  0.0 wa,  3.1 hi,  0.0 si,  0.0 st
MiB Mem :   3623.1 total,   1408.5 free,   1493.8 used,    992.3 buff/cache
MiB Swap:   1024.0 total,   1024.0 free,      0.0 used.   2129.3 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
      1 root      20   0  174072  16560  10736 S   0.0   0.4   0:01.15 systemd
      2 root      20   0       0      0      0 S   0.0   0.0   0:00.01 kthreadd
      3 root      20   0       0      0      0 S   0.0   0.0   0:00.00 pool_workqueue_
      4 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 kworker/R-rcu_g
      5 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 kworker/R-sync_
      6 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 kworker/R-slub_
      7 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 kworker/R-netns
     11 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 kworker/R-mm_pe
     13 root      20   0       0      0      0 I   0.0   0.0   0:00.00 rcu_tasks_kthre
     14 root      20   0       0      0      0 I   0.0   0.0   0:00.00 rcu_tasks_rude_
     15 root      20   0       0      0      0 I   0.0   0.0   0:00.00 rcu_tasks_tra
```

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

**示例** 

**1.kill**
```bash title="kill.sh"
#kill：通过进程号 (PID) 结束进程
#使用 kill 命令时，需要明确知道目标进程的具体 PID。
# 在后台启动 gedit 编辑器（'&' 表示将任务放入后台运行）
[root@localhost Desktop]# gedit &
[1] 10850  # 系统返回作业号 [1] 和该进程的 PID 10850

# 查看当前终端下的进程状态
[root@localhost Desktop]# ps 
    PID TTY          TIME CMD
  10785 pts/1    00:00:00 bash
  10850 pts/1    00:00:00 gedit  # 确认 gedit 的 PID 确实是 10850
  10872 pts/1    00:00:00 ps

# 使用 kill 命令强制结束指定的 PID（'-9' 代表发送 SIGKILL 信号，即强制杀掉）
[root@localhost Desktop]# kill -9 10850
2. killall：通过进程名称结束进程
当有多个同名进程时，使用 killall 可以一次性清理掉所有匹配该名称的进程，不需要一个个查 PID。
```
**2.killall**
```bash title="killall.sh"
# 连续三次在后台启动 vim 编辑器
[root@localhost Desktop]# vim &
[1] 11237  # 第 1 个 vim 的 PID
[root@localhost Desktop]# vim &
[2] 11242  # 第 2 个 vim 的 PID

[1]+  Stopped                 vim  # 提示：vim 放入后台后默认会处于挂起（Stopped）状态
[root@localhost Desktop]# vim &
[3] 11247  # 第 3 个 vim 的 PID

[2]+  Stopped                 vim

# 查看当前进程，可以看到有三个 vim 进程同时存在
[root@localhost Desktop]# ps 
    PID TTY          TIME CMD
  10649 pts/0    00:00:00 bash
  11237 pts/0    00:00:00 vim
  11242 pts/0    00:00:00 vim
  11247 pts/0    00:00:00 vim
  11252 pts/0    00:00:00 ps

[3]+  Stopped                 vim

# 演示：先用基础的 kill 杀掉 PID 为 11237 的第一个 vim 进程
[root@localhost Desktop]# kill -9 11237
[1]   Killed                  vim  # 系统提示后台作业 [1] 已被杀死

# 再次查看进程，发现 11237 已经消失，还剩下两个 vim 进程
[root@localhost Desktop]# ps 
    PID TTY          TIME CMD
  10649 pts/0    00:00:00 bash
  11242 pts/0    00:00:00 vim
  11247 pts/0    00:00:00 vim
  11262 pts/0    00:00:00 ps

# 演示：使用 killall 命令，通过进程名批量强制杀死剩下所有名为 'vim' 的进程
[root@localhost Desktop]# killall -9 vim 
[2]-  Killed                  vim  # 后台作业 [2] 被杀死
[3]+  Killed                  vim  # 后台作业 [3] 被杀死
3. pkill：通过特定条件（如用户名、终端等）结束进程
pkill 非常灵活，可以结合进程的所有者、运行的终端等属性来进行批量查杀。
```
**3.pkill**
```bash title="pkill.sh"
# 前置准备：假设开启了三个 shell，并切换到普通用户 lee 执行了一些操作
[root@localhost Desktop]# su - lee

# 回到 root 终端
# 使用 pkill 按条件批量杀进程：
# '-9' 表示强制执行，'-u lee' 表示匹配所有归属于 'lee' 用户的进程并将其结束
[root@localhost Desktop]# pkill -9 -u lee
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

```bash
[root@localhost Desktop]# systemctl status  sshd 
● sshd.service - OpenSSH server daemon
     Loaded: loaded (/usr/lib/systemd/system/sshd.service; enabled #开机启动; preset: ena>
     Active: active (running)#程序当前开启 since Tue 2026-06-02 20:21:08 CST; 26s ago
       Docs: man:sshd(8)
             man:sshd_config(5)
   Main PID: 2965 (sshd)
      Tasks: 1 (limit: 22789)
     Memory: 1.5M
        CPU: 10ms
     CGroup: /system.slice/sshd.service
             └─2965 "sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups"

             [root@localhost Desktop]# systemctl status sshd 
○ sshd.service - OpenSSH server daemon
     Loaded: loaded (/usr/lib/systemd/system/sshd.service; enabled; preset: enabled)
     Active: inactive (dead) #程序当前关闭 since Tue 2026-06-02 20:21:47 CST; 1min 30s ago
   Duration: 38.680s
       Docs: man:sshd(8)
             man:sshd_config(5)
    Process: 2965 ExecStart=/usr/sbin/sshd -D $OPTIONS (code=exited, status=0/SUCCESS)
   Main PID: 2965 (code=exited, status=0/SUCCESS)
        CPU: 11ms

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

## 系统启动目标 (Target) 控制
我们还可以控制系统默认进入的模式（例如图形界面或命令行界面）：
* 查看默认启动模式：`systemctl get-default`
* 设置开机不启动图形界面：`systemctl set-default multi-user.target`
* 设置开机自启动图形界面：`systemctl set-default graphical.target`
* 临时手动打开图形界面：`init 5`