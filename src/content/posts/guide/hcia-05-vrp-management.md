---
title: 网络学习（五）：VRP 从命令视图到远程登录与配置保存
published: 2026-10-16
description: 整理华为 VRP 的用户视图、系统视图、接口配置、AAA 和 VTY，补全隔离实验中的 Telnet 登录步骤，并区分当前配置与保存配置。
tags: [HCIA, eNSP, 华为, VRP, Telnet, SSH, 运维]
category: '网络学习'
draft: false
---

## 1. 认识协议之后，还要能管理设备

[上一篇](/posts/guide/hcia-04-tcpip-tcp-mtu/)讲了数据如何封装和传输。这一篇回到设备命令行，整理第二天、第八天和第九天笔记中的管理操作。

VRP 是华为的通用路由平台。刚开始敲命令时，最容易遇到的问题往往不是命令太长，而是忘了自己正在哪个视图。

:::note
下面以传统 eNSP AR 路由器常见的 VRP 命令形式为例。不同产品和软件版本在密码命令、远程服务默认状态、服务源接口等方面可能不同；输入 `?` 查看当前设备支持的语法。本文给出复现步骤与检查方法，不把示例输出当作实测记录。
:::

## 2. 看提示符，就知道当前配置范围

| 提示符示例 | 视图 | 常见用途 |
| --- | --- | --- |
| `<Huawei>` | 用户视图 | 查看、测试、保存等操作 |
| `[Huawei]` | 系统视图 | 修改名称、启用全局功能 |
| `[Huawei-GigabitEthernet0/0/0]` | 接口视图 | 配置当前接口 |
| `[Huawei-aaa]` | AAA 视图 | 配置本地用户等认证信息 |
| `[Huawei-ui-vty0-4]` | VTY 用户界面视图 | 配置虚拟终端接入规则 |

基本切换方式：

```text title="进入系统视图并修改名称"
system-view
sysname R1
```

此时提示符应变成 `[R1]`。

`quit` 通常退回上一级视图，`return` 或 `Ctrl+Z` 返回用户视图。

用户视图主要用于查看和维护，但不能把它理解为“绝对不会改变设备状态”：例如 `save` 就是有实际作用的操作。能否执行某条命令也取决于用户权限。

### 2.1 名字不会改变设备类型

对交换机执行 `sysname R1`，只是把名字改成 R1。它不会因此获得路由器的接口能力。

如果一条路由器配置在交换机接口下不被接受，应该先确认设备型号、接口类型和当前视图。

## 3. 从一个接口地址开始

准备一个独立练习：

```text
管理 PC：192.168.1.10/24
        │
       LSW
        │
R1 GE0/0/0：192.168.1.1/24
```

进入 R1 用户视图后执行：

```text title="配置 R1 的管理侧接口"
system-view
sysname R1
interface GigabitEthernet 0/0/0
ip address 192.168.1.1 255.255.255.0
undo shutdown
quit
return
display ip interface brief
```

重点检查地址是否正确，以及 Physical 和 Protocol 两列是否都为 `up`。如果链路未连接或对端未启动，输入地址并不会自动让接口恢复正常。

同网段 PC 测试这个接口，不需要经过默认网关；为了后续访问其他网段，可以给 PC 设置网关 `192.168.1.1`。

```text
ping 192.168.1.1
```

要撤销这个地址，应在对应接口视图中使用 `undo`，并确认参数与实际地址一致：

```text
undo ip address 192.168.1.1 255.255.255.0
```

这条是撤销示例，不是上面配置流程的下一步。正在通过该地址远程管理时，删除地址也会影响当前连接。

## 4. 带外管理与带内管理

Console 管理通常不依赖业务 IP 连通性，适合设备初次配置或网络中断后的恢复。部分设备使用串口 Console，部分有 USB Console；普通 USB 接口不一定具备 Console 功能。

带内管理则通过 IP 网络访问设备，例如 Telnet、SSH、Web 管理或 SNMP。

因此，远程登录失败至少要分两层排查：

```text
能否到达设备 IP？
        ↓
管理服务是否启用、允许接入且认证正确？
```

Ping 通只能说明相关 ICMP 通信成立，不能证明 TCP 23 或 TCP 22 已经开放。

## 5. AAA 与 VTY 分别管什么

AAA 指 Authentication、Authorization、Accounting，即认证、授权、计费或审计记录。

在这里先用最简单的本地账户理解：用户是谁、密码是否正确、允许什么接入方式、能执行哪些命令。

VTY 是虚拟终端用户界面。`user-interface vty 0 4` 选择编号 0 到 4 的五条 VTY 线路，设置它们的认证与协议规则。

**VTY 编号不是 TCP 端口号。** Telnet 仍通常使用 TCP 23。

完整登录需要这些条件配合：设备 IP 可达、服务器功能启用、VTY 允许协议、账户允许该服务、认证方式匹配。

## 6. 在隔离实验网中完成 Telnet 登录

Telnet 会以明文传输登录信息与会话内容。这里保留它作为课堂实验，用于观察 AAA、VTY 与 TCP 连接的配合；实际设备远程管理应采用 SSH 等加密方式。

以下命令从 R1 用户视图开始。先把 `REPLACE_WITH_LAB_PASSWORD` 替换为自行设置的实验密码，不要原样粘贴这个占位值。

```text title="R1：传统 eNSP VRP 的 Telnet 配置示例"
system-view
telnet server enable
aaa
local-user labadmin password cipher REPLACE_WITH_LAB_PASSWORD
local-user labadmin privilege level 3
local-user labadmin service-type telnet
quit
user-interface vty 0 4
authentication-mode aaa
protocol inbound telnet
quit
return
```

在传统 VRP 权限划分中，3 级属于管理级，足以进行本篇练习；实际权限仍需结合产品定义。`cipher` 涉及本地配置中的密码存储形式，**不会把 Telnet 网络传输变成加密通信**。

某些版本使用 `password irreversible-cipher`，或需要显式指定远程服务的源接口。如果命令不被接受，先用命令帮助和对应版本文档确认，不要把其他型号的配置全部照搬。AAA、VTY 与服务开关的组合可参照[华为 Telnet 配置示例](https://support.huawei.com/enterprise/de/doc/EDOC1100212297/c947deef/example-for-configuring-an-acl-to-limit-telnet-login)。

### 6.1 客户端发起连接

在已经具备 Telnet 客户端、且能到达 R1 的终端上执行：

```text
telnet 192.168.1.1
```

如果当前 eNSP PC 不支持该客户端，可以使用同网段另一台已配置地址的 AR 路由器，在用户视图中发起 Telnet 连接。

输入 `labadmin` 和自己设置的密码。预期现象是出现 R1 的用户视图提示符，再尝试执行查看命令。

出现“连接超时”，优先检查网络路径、服务监听和访问限制；能出现登录提示但密码不通过，重点检查 AAA 用户、密码、服务类型和 VTY 认证方式。

## 7. SSH 不是 Telnet 加 SSL

课堂简写把 SSH 与“加密的远程登录”联系起来，有助于记忆用途，但不能写成协议定义。

SSH 有自己的安全传输、用户认证与连接机制，不是把 Telnet 套上一层 SSL。其结构见 [RFC 4251](https://www.rfc-editor.org/info/rfc4251/)。

在华为设备上，SSH 终端登录常见名称是 STelnet。具体配置还涉及主机密钥、SSH 用户与 VTY 协议等，不能把 Telnet 示例中的一个单词替换掉就视为配置完成。

## 8. 改好了，还要知道配置保存在哪里

第九天笔记里的四条命令值得单独记住：

| 命令 | 用途 |
| --- | --- |
| `display this` | 查看当前视图下的配置 |
| `display current-configuration` | 查看当前生效的配置 |
| `save` | 按提示将当前配置保存到配置文件 |
| `display saved-configuration` | 查看已保存的配置 |

`display this` 不是操作历史，`display current-configuration` 也不是设备内存中所有内容。它们查看的是配置，不是 ARP 表、动态路由或全部运行状态。

### 8.1 一次配置的收尾流程

在相关视图中先用 `display this` 检查局部设置，再回到用户视图：

```text
return
display current-configuration
save
```

遇到保存确认或文件名提示时，阅读提示后完成保存，再检查：

```text
display saved-configuration
display startup
```

后者可以帮助确认下次启动所使用的配置文件。仅仅看到“现在能登录”，并不代表重启后仍会加载同样的配置。

不必为了检查保存而立即重启设备。先核对保存文件、启动配置和关键配置项，就能发现很多遗漏。

## 9. 常见现象与检查方向

| 现象 | 优先检查 |
| --- | --- |
| 命令无法识别 | 当前视图、设备型号、软件版本、命令帮助 |
| 接口有 IP 但仍然 Down | 连接、对端状态、接口是否被关闭 |
| Ping 通但无法远程登录 | 服务开关、VTY 协议、访问限制 |
| 出现认证提示但登录失败 | AAA 用户、密码、service-type、认证方式 |
| 重启后配置不见了 | 是否保存、下次启动配置文件是否正确 |

设备管理形成习惯后，一次修改就可以完整地走完“进入正确视图、配置、检查、验证、保存”的过程。

下一篇：[DHCP 自动分配地址与路由表](/posts/guide/hcia-06-dhcp-routing/)。
