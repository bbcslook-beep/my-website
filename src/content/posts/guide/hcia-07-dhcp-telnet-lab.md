---
title: 网络学习（七）：DHCP 与 Telnet 实验，从手动建池到远程登录
published: 2026-11-04
description: 延续 DHCP 与路由表练习，在 eNSP 中为双网段的四台 PC 配置全局地址池，再通过 AAA、VTY 和 Telnet 完成路由器远程登录，附完整命令、验证方法与排错顺序。
tags: [HCIA, eNSP, DHCP, Telnet, AAA, 华为, 网络]
category: '网络学习'
draft: false
---

## 1. 自动获取地址以后，还要完成什么

[上一篇：DHCP 自动获取地址，再读懂路由表](/posts/guide/hcia-06-dhcp-routing/)讲了 DORA、租约和路由转发。这次把它们用在一次完整的作业里：

> 下方四台电脑通过 DHCP 自动获取 IP 地址；路由器开启 Telnet，完成远程登录。

刚看到要求时，我有两个疑问：之前已经让路由器给两个网段自动分配地址了，老师为什么又要“手动配置号池”？电脑拿到 IP 以后，开启 Telnet 又是在做什么？

把任务拆开就清楚了：

| 任务 | 管理员配置什么 | 客户端完成什么 |
| --- | --- | --- |
| DHCP | 地址池、网关、DNS 和服务接口 | 自动领取网络参数 |
| Telnet | 远程服务、登录账户和 VTY 规则 | 通过网络进入路由器命令行 |

**DHCP 解决电脑怎样获得地址，Telnet 解决怎样通过网络管理路由器。** 四台电脑拿到地址，只完成了前半部分。

:::note
本文把作业要求整理成一个可独立复现的双网段实验，沿用上一篇的 `192.168.1.0/24` 和 `192.168.2.0/24`。命令面向传统 eNSP AR 路由器常见的 VRP 版本；接口编号和密码语法以实际设备为准。文中的地址示例、登录提示和验收结果均用于说明预期行为，不作为模拟器实测记录。
:::

## 2. “手动建池”与“自动分配”并不矛盾

“号池”就是地址池，可以理解成一批允许 DHCP 分配的地址，以及随地址一起提供的参数。

管理员手动规定：

```text
左边：从 192.168.1.0/24 中分配地址，网关是 192.168.1.1
右边：从 192.168.2.0/24 中分配地址，网关是 192.168.2.1
两边：保留 .1～.20，客户端使用剩余可分配地址
```

之后电脑发起 DHCP 请求，由服务器自动分配。因此要区分三种操作：

| 操作 | 含义 |
| --- | --- |
| 手动创建 DHCP 地址池 | 管理员在路由器上定义分配规则 |
| PC 手动配置 IP | 用户在电脑上填写固定的地址、掩码等参数 |
| DHCP 静态绑定 | 服务器为特定客户端保留指定地址，客户端仍可通过 DHCP 获取 |

这次使用第一种，四台 PC 都选择 DHCP，不逐台填写固定 IP，也不做静态绑定。

### 2.1 接口地址池与全局地址池

之前如果用过下面这条命令，使用的是接口地址池方式：

```text
dhcp select interface
```

它以接口的地址和掩码确定所在网段，其他 DHCP 参数也在接口视图中配置。

本次使用全局地址池：在系统视图通过 `ip pool LAN1` 等命令创建池，再在接入接口下执行 `dhcp select global`。两种方式都能让 PC 自动获取地址，区别在于配置组织方式，不能只凭“手动”或“自动”判断。[华为 AR 的 DHCP 检查说明](https://info.support.huawei.com/network/ptmngsys/Web/tsrev_ar/cn/content/ar/35_edesk_terminal_cannot_connect/edesk_terminal_cannot_connect_edesk004.html)列出了这两种接口配置。

## 3. 拓扑与地址规划

准备一台 AR 路由器、两台二层交换机和四台 PC。这里把路由器命名为 `AR1`，对应上一篇的 `R1`。

![DHCP 与 Telnet 实验拓扑：AR1 的两个三层接口分别连接 LSW1、LSW2，PC1 与 PC2 位于 LAN1，PC3 与 PC4 位于 LAN2，四台 PC 均使用 DHCP。](/images/network/hcia-07-dhcp-telnet.svg)

连接关系也可以写成：

```text
PC1 ─┐                            ┌─ PC3
     LSW1 ─────── AR1 ─────── LSW2
PC2 ─┘                            └─ PC4
           GE0/0/0   GE0/0/1
        192.168.1.1  192.168.2.1
             /24         /24
```

| 项目 | 左侧 LAN1 | 右侧 LAN2 |
| --- | --- | --- |
| PC | PC1、PC2 | PC3、PC4 |
| 网段 | 192.168.1.0/24 | 192.168.2.0/24 |
| AR1 接口 | GE0/0/0 | GE0/0/1 |
| 默认网关 | 192.168.1.1 | 192.168.2.1 |
| 全局地址池名称 | LAN1 | LAN2 |
| 保留地址 | 192.168.1.1～192.168.1.20 | 192.168.2.1～192.168.2.20 |
| 动态分配范围 | 192.168.1.21～192.168.1.254 | 192.168.2.21～192.168.2.254 |
| 租期 | 1 天 | 1 天 |

每台交换机上参与实验的端口处于同一 VLAN 即可。两台交换机之间不另接链路，避免把两个规划为独立广播域的网络接在一起。

这个拓扑中，AR1 自己就是两侧的 DHCP 服务器和默认网关，不需要 DHCP Relay；两个网段都直接连接 AR1，也不需要额外的静态路由。

:::tip
下面的完整配置建议在新建拓扑中执行。若继续使用上一篇的设备，先用 `display current-configuration` 检查已有接口和地址池，复用或调整现有配置，避免重复建池。原来使用接口地址池的接口，应先退出该 DHCP 模式，再改用全局地址池；具体撤销语法可通过 `undo dhcp select ?` 确认。
:::

## 4. 第一步：配置 AR1 的两个接口

打开 AR1 的 Console，从用户视图开始输入：

```text title="AR1：启用 DHCP 并配置接口"
system-view
sysname AR1
dhcp enable

interface GigabitEthernet 0/0/0
ip address 192.168.1.1 255.255.255.0
undo shutdown
quit

interface GigabitEthernet 0/0/1
ip address 192.168.2.1 255.255.255.0
undo shutdown
quit
```

此时停留在 `[AR1]` 系统视图，继续创建地址池。接口名称按实际连线调整，不能只看图上左右位置判断接口编号。

## 5. 第二步：手动创建两个全局地址池

```text title="AR1：创建 LAN1 与 LAN2"
ip pool LAN1
network 192.168.1.0 mask 255.255.255.0
gateway-list 192.168.1.1
excluded-ip-address 192.168.1.2 192.168.1.20
dns-list 114.114.114.114 8.8.8.8
lease day 1 hour 0 minute 0
quit

ip pool LAN2
network 192.168.2.0 mask 255.255.255.0
gateway-list 192.168.2.1
excluded-ip-address 192.168.2.2 192.168.2.20
dns-list 114.114.114.114 8.8.8.8
lease day 1 hour 0 minute 0
quit
```

几条命令各有职责：

| 命令 | 作用 |
| --- | --- |
| `ip pool LAN1` | 创建并进入名为 LAN1 的全局地址池 |
| `network ... mask ...` | 指定地址池对应的网段与掩码 |
| `gateway-list ...` | 向客户端下发默认网关 |
| `excluded-ip-address ...` | 排除不参与动态分配的地址 |
| `dns-list ...` | 向客户端下发 DNS 地址 |
| `lease ...` | 设置租约有效期 |

这里沿用上一篇的保留规则：`gateway-list` 中的 `.1` 不参与普通动态分配，再排除 `.2～.20`；`.0` 和 `.255` 分别是该 `/24` 子网的网络地址与广播地址。

`LAN1`、`LAN2` 是管理员取的名字，并不代表 VLAN 编号，也不是客户端要填写的参数。

DNS 地址只用于演示参数下发。这个封闭实验没有配置互联网出口，收到公网 DNS 地址并不意味着能访问公网或成功解析域名。

### 5.1 地址池创建完成，还要启用接入接口

继续在 `[AR1]` 系统视图输入：

```text title="AR1：让两个接入接口使用全局地址池"
interface GigabitEthernet 0/0/0
dhcp select global
quit

interface GigabitEthernet 0/0/1
dhcp select global
quit
return
```

`dhcp select global` 启用当前接口的全局地址池服务。在本实验的本地直连场景中，服务器根据客户端接入接口所在的子网匹配相应地址池。

因此，这条命令后面不需要跟 `LAN1` 或 `LAN2`。**地址池的网段、网关与接入接口必须匹配；只创建地址池，不能代替接口上的服务配置。**

## 6. 第三步：让四台 PC 自动获取地址

在 eNSP 中逐台打开 PC 的基础配置，把 IPv4 地址获取方式改为 DHCP，并应用设置。没有立即获取到地址时，使用当前模拟终端提供的重新获取功能，或重新应用 DHCP 设置。

不要直接把 Windows 的 `ipconfig /renew` 当成所有 eNSP PC 都支持的命令；如果使用的是实际 Windows DHCP 客户端，才按 Windows 的方式续租。

检查四台 PC 的实际配置，预期如下：

| PC | IP 应处于的范围 | 掩码 | 默认网关 |
| --- | --- | --- | --- |
| PC1、PC2 | 192.168.1.21～192.168.1.254 | 255.255.255.0 | 192.168.1.1 |
| PC3、PC4 | 192.168.2.21～192.168.2.254 | 255.255.255.0 | 192.168.2.1 |

同一网段内两台 PC 的地址必须不同，但不要求 PC1 一定拿到 `.21`、PC2 一定拿到 `.22`。分配结果会受已有租约和地址使用情况影响。

### 6.1 路由器侧检查

在 AR1 用户视图执行：

```text title="AR1：检查接口、地址池与路由"
display ip interface brief
display ip pool name LAN1
display ip pool name LAN2
display ip routing-table
```

确认两个接口的 Physical、Protocol 都为 `up`，地址池网段、网关和使用情况与客户端对应，并能看到两个网段的直连路由。

### 6.2 按顺序测试通信

先在 PC1 上测试自己的网关：

```text
ping 192.168.1.1
```

再在 PC3 上测试自己的网关：

```text
ping 192.168.2.1
```

最后用 PC1 Ping **PC3 实际获取到的 IP**，再反向测试。例如，只有 PC3 的实际地址确实是 `192.168.2.21` 时，才使用：

```text
ping 192.168.2.21
```

这个过程检验的是“客户端地址正确 → 本地网关可达 → 跨网段通信成立”。目标在另一网段时，PC1 把包交给 AR1；AR1 查路由表，通过右侧直连网络转发给 PC3，回复再经过 PC3 的默认网关返回。

## 7. Telnet：通过网络打开路由器的命令行

平时双击 AR1 打开的 Console，适合初次配置。Telnet 则允许一个具备网络连通性的客户端，通过路由器的接口 IP 访问它的命令行。

```text
Telnet 客户端
    │  连接路由器的实际 IP，通常使用 TCP 23
    ↓
AR1 的 Telnet 服务
    ↓
VTY 检查协议与认证方式
    ↓
AAA 校验本地账户并提供相应权限
    ↓
进入 <AR1>，执行路由器命令
```

Telnet 使用 TCP，DHCPv4 使用 UDP 67/68，Ping 使用 ICMP。三者完成的是不同任务，**Ping 通路由器，不代表已经能登录 Telnet**。Telnet 与 TCP 的关系见 [RFC 854](https://www.rfc-editor.org/rfc/rfc854.html)。

:::caution
Telnet 会明文传输登录信息和会话内容，本实验仅用于隔离的学习网络。实际远程管理应采用 SSH 等加密方式；密码配置中的 `cipher` 不会加密 Telnet 在网络上传输的内容。
:::

## 8. 第四步：配置 Telnet、AAA 与 VTY

下面从 AR1 用户视图开始。**先将 `REPLACE_WITH_LAB_PASSWORD` 替换为自己设置、满足设备复杂度要求的实验密码，再执行命令。** 示例用户名为 `labadmin`。

```text title="AR1：配置 Telnet 远程登录"
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
idle-timeout 10 0
quit
return
```

把它分成三组理解：

| 配置位置 | 关键命令 | 作用 |
| --- | --- | --- |
| 系统视图 | `telnet server enable` | 开启 Telnet 服务器功能 |
| AAA 视图 | `local-user ...` | 配置账户、密码、权限与允许的服务 |
| VTY 视图 | `authentication-mode aaa`、`protocol inbound telnet` | 规定远程会话使用 AAA 认证，并允许 Telnet 接入 |

`vty 0 4` 指编号 0～4 的五条虚拟终端线路，**不是开放 TCP 0～4 端口**。`idle-timeout 10 0` 表示会话空闲 10 分钟后超时。

这里将本地用户权限设为 3，供传统 VRP 实验中的管理操作使用。认证采用 AAA 时，应关注本地用户的权限配置，而不是把 VTY 线路编号和用户权限混在一起。

不同版本可能使用 `password irreversible-cipher`，也可能要求显式指定 Telnet 服务的源接口。遇到命令不接受，或配置后仍不能接入时，先查看 `display version`，再用 `local-user labadmin password ?`、`telnet server-source ?` 核对对应型号的语法和要求。服务开关、AAA 与 VTY 的组合可参照[华为 Telnet 配置示例](https://support.huawei.com/enterprise/de/doc/EDOC1100212297/c947deef/example-for-configuring-an-acl-to-limit-telnet-login)，其中的交换机源接口命令需按实际 AR 版本调整。

## 9. 第五步：真正登录一次 AR1

### 9.1 使用支持 Telnet 的电脑终端

客户端需要具备 Telnet 功能，并实际接入实验网络、能够到达 AR1。仅在宿主机安装 Telnet 客户端，不会自动让宿主机接入 eNSP 的虚拟网段。

左侧客户端先测试连通性，再发起登录：

```text
ping 192.168.1.1
telnet 192.168.1.1
```

右侧客户端可以使用 AR1 的右侧接口地址 `192.168.2.1`。

按提示输入 `labadmin` 和自己设置的密码。成功后的提示形如：

```text title="登录提示示意，非实测输出"
Login authentication
Username: labadmin
Password:
<AR1>
```

输入密码时不显示字符是常见的终端行为。进入 `<AR1>` 后执行 `display ip interface brief`，应能查看到服务器 AR1 的接口。

登录目标必须是路由器的实际接口地址，不能输入 `telnet 192.168.1.0`；这里的 `.0/24` 表示网络，不是 AR1 的地址。

### 9.2 eNSP PC 不支持 Telnet 时，用另一台 AR 验证

部分 eNSP 内置 PC 的命令功能有限。如果终端不识别 `telnet`，可以额外放置一台 AR 路由器作为客户端，命名为 `AR2`，把它的 GE0/0/0 接到 LSW1 的空闲端口。

```text
AR2 GE0/0/0：192.168.1.10/24
        │
       LSW1 ─── AR1 GE0/0/0：192.168.1.1/24
```

`.10` 位于提前排除的地址范围内，不会与本实验的 DHCP 动态地址冲突。额外确认网络中没有其他设备使用它。

在 **AR2** 上配置：

```text title="AR2：作为 Telnet 客户端"
system-view
sysname AR2
interface GigabitEthernet 0/0/0
ip address 192.168.1.10 255.255.255.0
undo shutdown
quit
return

ping 192.168.1.1
telnet 192.168.1.1
```

这次连接在同一网段内，不需要给 AR2 添加静态路由，也不需要在 AR2 上开启 Telnet **服务器**。AR1 是被登录的服务器，AR2 是发起连接的客户端。

认证通过后，提示符应从客户端的 `<AR2>` 变为服务器的 `<AR1>`。在远程会话中运行：

```text
display ip interface brief
display users
```

前者检查当前操作的设备接口，后者查看登录用户和会话信息。远程操作完成后，在 AR1 用户视图输入 `quit` 退出会话，返回 AR2。

这里为额外的客户端路由器配置固定地址，只是提供 Telnet 验证工具；作业中原来的四台 PC 仍全部通过 DHCP 获取地址。如果作业明确要求从电脑发起连接，应使用已接入实验网络的真实或虚拟电脑终端完成对应验收。

## 10. 验证与保存：怎样才算完成作业

可以按下面的清单留下自己的实验截图：

| 检查项 | 应记录的结果 |
| --- | --- |
| PC1～PC4 的网络配置 | 四台均为 DHCP，地址分别属于正确网段，掩码和网关正确 |
| AR1 接口状态 | 两个三层接口均为 `up/up` |
| 两个地址池 | 网段与网关正确，能看到与客户端相符的地址使用情况 |
| 基础通信 | 各自网关可达，左右 PC 能按实际地址互相 Ping |
| Telnet 登录 | 在客户端发起连接并通过认证，出现 `<AR1>` |
| 远程操作 | 在 Telnet 会话中成功查看 AR1 接口或用户信息 |
| 配置保存 | AR1 已保存，使用额外 AR2 时也保存它的接口配置 |

在 AR1 用户视图中保存：

```text
save
```

按设备提示完成确认；保存结束后再执行：

```text
display saved-configuration
display startup
```

检查保存配置与下次启动使用的配置文件。`save` 保存的是设备配置，不等于所有动态租约、ARP 缓存和登录会话都成为永久状态。

## 11. 卡住时，按现象逐层排查

| 现象 | 优先检查 |
| --- | --- |
| 四台 PC 都拿不到地址 | 设备是否启动、链路、`dhcp enable`、地址池、接口上的 `dhcp select global` |
| 只有某一侧拿不到地址 | 对应接口与交换机 VLAN、该侧地址池网段和可用地址 |
| 拿到的地址或网关不符合规划 | 当前租约、地址池参数、网络中是否存在其他 DHCP 服务器 |
| 能 Ping 本地网关，不能 Ping 对侧 PC | 两侧地址与掩码、对端默认网关、接口状态和访问限制 |
| PC 提示找不到 `telnet` 命令 | 当前客户端是否支持 Telnet，换用合适的终端或 AR2 |
| Ping 通，但 Telnet 无法建立连接 | 服务器开关、VTY 允许协议、版本要求的服务源接口、访问限制和会话数量 |
| 已出现登录提示，但认证失败 | 用户名、密码、账户 `service-type telnet` 与 VTY 的 AAA 模式 |
| 登录成功，但不能执行预期命令 | 当前视图、AAA 用户权限和实际产品权限定义 |
| 重启后配置丢失 | 是否执行 `save`、下次启动配置文件是否正确 |

排查顺序可以固定为：**链路 → 地址与网关 → IP 连通性 → Telnet 服务与 VTY → AAA 认证与权限 → 保存。**

## 12. 回到这次实验的两个问题

“手动配置号池”，是管理员手动定义 DHCP 的分配规则；电脑照样自动获取地址。

“路由器开启 Telnet”，是让一个能到达路由器的客户端，通过网络登录它的命令行。真正完成这部分，需要客户端发起连接、通过认证，并成功操作一次远程设备。

继续复习时，可以把这几篇连起来看：

- [第五篇：VRP 从命令视图到远程登录与配置保存](/posts/networklearning/hcia-05-vrp-management/)
- [第六篇：DHCP 自动获取地址，再读懂路由表](/posts/guide/hcia-06-dhcp-routing/)
- [环境篇：在 VMware 里跑通 eNSP](/posts/networklearning/environment-get-started/)
