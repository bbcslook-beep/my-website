---
title: 在 VMware 里跑通 eNSP：从嵌套虚拟化到跨网段 HTTP 访问
published: 2026-09-23
description: 记录在 Windows 11 26H2 上通过 VMware + Windows 10 + VirtualBox 搭建 eNSP 环境，并完成 ARP、交换、默认网关、路由与 HTTP 跨网段通信实验的全过程。
tags: [eNSP, VMware, VirtualBox, 网络, 路由, ARP, 虚拟化]
category: '网络学习'
draft: false
---

## 1. 前言

最近开始折腾华为 eNSP。

原本以为这只是一个“装好软件、拖几个路由器、敲命令”的普通实验，结果第一步就撞上了兼容性问题。

我的宿主系统比较新，是 **Windows 11 26H2**，而传统 eNSP 使用的是一套相对古老的软件栈：

- eNSP
- Oracle VirtualBox 5.x
- WinPcap 4.1.3
- Wireshark 3.x

直接在新系统上安装这套环境并不是一个特别理想的选择。

所以最后采取了一个看起来有些“套娃”，但实际上很干净的方案：

```text title="最终虚拟化结构"
Windows 11 26H2 宿主机
        │
        ▼
     VMware
        │
        ▼
 Windows 10 22H2
        │
        ▼
   VirtualBox
        │
        ▼
       eNSP
        │
        ▼
 AR / LSW / PC / Server
```

也就是专门开一台 Windows 10 虚拟机，把整套旧版网络实验环境都关在里面。

事实证明，真正麻烦的地方也正是这里：

> **虚拟化里面还要继续虚拟化。**

---

## 2. 为什么不用宿主机直接装 eNSP

老版 eNSP 和新版 Windows 之间存在不少兼容性问题。

特别是它依赖的 VirtualBox、WinPcap 等组件，本身就是很多年前的软件。

为了避免：

- 老驱动直接进入宿主系统
- VirtualBox 和新版 Windows 虚拟化组件冲突
- eNSP 环境污染日常使用的系统
- 后续卸载留下大量虚拟网卡和驱动

我最后选择：

```text
Windows 11
    ↓
VMware
    ↓
Windows 10
    ↓
完整安装 eNSP 软件栈
```

这样即使 eNSP 环境彻底炸掉，也只需要处理这一台虚拟机。

:::tip
对于这种依赖大量旧版驱动、虚拟网卡和旧虚拟化平台的软件，用专用虚拟机隔离通常比直接折腾宿主机舒服得多。
:::

---

## 3. 第一关：eNSP 能打开，但 AR 一启动系统就卡死

一开始，eNSP 本身能够正常运行。

PC 可以启动，交换机也能启动。

但是只要启动 AR 路由器，整个 VMware Guest 就会直接卡住，甚至鼠标都无法正常移动。

这显然已经不是一个普通的“设备启动失败”。

当时的实际结构是：

```text
物理 CPU
   │
Windows 11
   │
 VMware
   │
Windows 10
   │
VirtualBox
   │
 eNSP AR
```

而 eNSP 中的 AR 设备需要由里面的 VirtualBox 真正启动一个虚拟设备。

问题就在这里。

### 3.1 VMware 没有成功拿到 VT-x/EPT

最关键的一条报错是 VMware 启动时提示：

```text
此平台不支持虚拟化的 Intel VT-x/EPT。

不使用虚拟化的 Intel VT-x/EPT，是否继续？
```

这一下基本就把问题定位了。

VMware 本身虽然可以运行 Windows 10，但它没办法继续把 CPU 的硬件虚拟化能力暴露给 Guest。

于是结构实际上变成了：

```text
物理 CPU
   │
   ├── VT-x/EPT
   │
Windows 11
   │
 VMware
   │
   X  无法继续传递 VT-x/EPT
   │
Windows 10
   │
VirtualBox
   │
 eNSP AR
```

里面那一层 VirtualBox 拿不到它需要的虚拟化支持。

:::important
这次问题真正的核心并不是 eNSP 配置错误，也不是网线、IP 地址或 AR 命令错误，而是 **嵌套虚拟化没有真正跑通**。
:::

---

## 4. Hyper-V 为什么会影响 VMware 嵌套虚拟化

检查宿主机以后发现，Windows 中还启用了：

```text
Windows 虚拟机监控程序平台
虚拟机平台
```

这些组件会使用微软自己的 Hyper-V 虚拟化体系。

对于普通 VMware 使用，它们不一定会导致 VMware 完全不能运行。

但是我这里不是简单的：

```text
宿主机
↓
VMware
↓
Guest
```

而是：

```text
宿主机
↓
VMware
↓
Guest
↓
VirtualBox
↓
eNSP
```

我要把硬件虚拟化能力继续往下一层传递。

于是把当前不需要的 Windows 虚拟化功能关闭，并禁用了 Hyper-V Hypervisor 开机启动。

管理员 CMD：

```cmd title="关闭 Hyper-V Hypervisor 启动"
bcdedit /set hypervisorlaunchtype off
```

同时关闭：

```text
Windows 虚拟机监控程序平台
虚拟机平台
```

重启物理机之后，再进入 VMware 的处理器设置：

```text
☑ 虚拟化 Intel VT-x/EPT 或 AMD-V/RVI

☐ 虚拟化 CPU 性能计数器
☐ 虚拟化 IOMMU
```

然后再次启动 Windows 10。

这次 VMware 不再提示 VT-x/EPT 无法使用。

再启动 eNSP AR：

```text
Please press enter to start cmd line!

<Huawei>
```

成功。

:::note
关闭“虚拟机平台”以后会影响 WSL2；关闭 Hyper-V Hypervisor 也会使 Hyper-V 虚拟机暂时无法启动。

如果以后需要恢复，可以执行：

```cmd
bcdedit /set hypervisorlaunchtype auto
```

然后重新启用对应 Windows 功能并重启。
:::

---

## 5. 从“模拟器能开”到“设备真的启动”

AR 成功出现：

```text
<Huawei>
```

这一刻其实才算真正解决环境问题。

因为之前只是：

> eNSP 图形界面能运行。

而现在则是：

> eNSP 后面的虚拟网络设备真的跑起来了。

这两件事完全不同。

之后就可以正式进入网络实验。

---

## 6. 第一个双网段实验

搭建的基本拓扑如下：

```text
            192.168.1.0/24

 PC1 ─┐
      │
Server1
      │
     LSW1
      │
      │ GE0/0/0
      │ 192.168.1.1
     AR1
      │ 192.168.2.1
      │ GE0/0/1
     LSW2
      │
   ┌──┴─────┐
  PC2     Client1

            192.168.2.0/24
```

AR1 左右两个接口分别配置：

```text
GE0/0/0
192.168.1.1/24

GE0/0/1
192.168.2.1/24
```

配置命令如下：

```text title="AR1 基本接口配置"
system-view

interface GigabitEthernet 0/0/0
ip address 192.168.1.1 255.255.255.0
quit

interface GigabitEthernet 0/0/1
ip address 192.168.2.1 255.255.255.0
quit
```

检查：

```text
display ip interface brief
```

最后得到：

```text
GigabitEthernet0/0/0   192.168.1.1/24   up   up
GigabitEthernet0/0/1   192.168.2.1/24   up   up
```

两个 `up` 意味着：

```text
Physical = up
Protocol = up
```

物理链路和协议状态都正常。

---

## 7. 路由器为什么会有两个 IP

刚开始这里其实很容易产生一个疑问：

> AR1 到底是 192.168.1.1，还是 192.168.2.1？

答案是：

**都是。**

不是整台路由器只有一个 IP。

IP 地址实际上配置在接口上。

因此：

```text
AR1 GE0/0/0 = 192.168.1.1/24
AR1 GE0/0/1 = 192.168.2.1/24
```

可以理解成路由器的两只脚分别踩在两个网络里：

```text
192.168.1.0/24
      │
  192.168.1.1
      │
     AR1
      │
  192.168.2.1
      │
192.168.2.0/24
```

对于左边网络来说：

```text
192.168.1.1
```

就是出口。

对于右边网络来说：

```text
192.168.2.1
```

也是出口。

于是它们分别成为两个网段的默认网关。

---

## 8. 默认网关到底是什么

假设 PC2：

```text
IP：192.168.2.2
Mask：255.255.255.0
Gateway：192.168.2.1
```

如果它访问：

```text
192.168.2.3
```

主机会先利用子网掩码判断：

```text
192.168.2.2/24
192.168.2.3/24
```

双方都属于：

```text
192.168.2.0/24
```

因此：

> 目标就在本地网络，不需要找路由器。

但如果目标是：

```text
192.168.1.2
```

PC2 会发现：

```text
本机：
192.168.2.2/24
→ 192.168.2.0

目标：
192.168.1.2/24
→ 192.168.1.0
```

不是同一个网络。

这时候 PC2 才会使用：

```text
Default Gateway = 192.168.2.1
```

所以可以把默认网关理解成：

> **如果目标不属于我的本地网络，而我又没有更具体的路由，那就先把数据交给这个设备。**

:::tip
一个非常实用的判断：

```text
目标和自己同网段？
        │
   ┌────┴────┐
   │         │
   是        否
   │         │
ARP目标      ARP网关
   │         │
直接发送     交给路由器
```
:::

---

## 9. 为什么网关必须和主机在同一个网段

例如：

```text
PC2：
192.168.2.2/24
```

正确网关：

```text
192.168.2.1
```

如果错误地设置成：

```text
192.168.1.1
```

就会产生一个逻辑问题：

> 我需要通过网关才能前往其他网络，但这个“网关”本身就已经位于另一个网络。

相当于：

```text
我要出门
↓
先去找大门
↓
但是大门本身就在墙外
↓
那我怎么去找这个门？
```

所以默认网关通常必须是：

> **本机能够通过当前二层网络直接到达的三层设备接口。**

---

## 10. 同一个交换机里的 Ping 到底怎么走

假设：

```text
PC A：192.168.2.3
PC B：192.168.2.2
```

双方都在：

```text
192.168.2.0/24
```

那么：

```text
192.168.2.3 ping 192.168.2.2
```

根本不会经过 AR1。

### 10.1 主机首先需要知道 MAC

PC A 知道：

```text
目的 IP = 192.168.2.2
```

但是以太网真正发送数据时需要的是：

```text
目的 MAC
```

如果 ARP 表里没有对应记录，就发送：

```text
Who has 192.168.2.2?
Tell 192.168.2.3
```

即 ARP Request。

这个帧目的 MAC 是：

```text
FF:FF:FF:FF:FF:FF
```

也就是广播。

---

## 11. 交换机到底学什么

交换机收到 PC A 的 ARP 广播以后，会先观察：

```text
这个帧是从哪个端口进来的？
它的源 MAC 是多少？
```

然后学习：

```text
MAC_A → GE0/0/1
```

这就是交换机 MAC 地址表。

因为 ARP Request 是广播，交换机会把它从同 VLAN 的其他端口发出去。

PC B 收到以后发现：

```text
目标 IP = 192.168.2.2
```

正是自己。

于是返回：

```text
192.168.2.2 is at MAC_B
```

交换机又学到：

```text
MAC_B → GE0/0/2
```

最终：

```text
交换机 MAC 表：

MAC_A → GE0/0/1
MAC_B → GE0/0/2
```

而 PC A 的 ARP 表中则会出现：

```text
192.168.2.2 → MAC_B
```

这是两个不同的概念：

```text
主机 ARP 表：
IP → MAC

交换机 MAC 表：
MAC → 端口
```

之后真正的 ICMP Ping 才能进行。

---

## 12. 跨网段 Ping 又有什么不同

现在变成：

```text
192.168.1.2
      ↓
     ping
      ↓
192.168.2.2
```

源主机发现：

```text
192.168.2.2
```

不属于自己的：

```text
192.168.1.0/24
```

因此它**不会 ARP 查询 192.168.2.2**。

而是：

```text
ARP：谁是 192.168.1.1？
```

也就是寻找自己的默认网关。

得到 AR1 左侧接口 MAC 后，PC 封装：

```text
IP：
源 IP = 192.168.1.2
目的 IP = 192.168.2.2

Ethernet：
源 MAC = PC1
目的 MAC = AR1 左接口
```

这里有一个非常重要的区别：

> **IP 的目的地仍然是真正的远程主机，但 MAC 的目的地只是当前这一跳的路由器。**

---

## 13. 路由器收到以后发生了什么

AR1 收到数据帧以后：

首先发现：

```text
目的 MAC = 自己
```

于是接收帧。

然后去掉这一层 Ethernet 封装，查看 IP：

```text
目的 IP = 192.168.2.2
```

接着查询路由表。

因为：

```text
GE0/0/1 = 192.168.2.1/24
```

所以 AR1 天生就拥有一条直连路由：

```text
192.168.2.0/24 → GE0/0/1
```

不需要额外添加静态路由。

AR1 接下来在右边网段 ARP：

```text
Who has 192.168.2.2?
```

拿到 PC2 MAC 后，重新封装一个新的 Ethernet Frame：

```text
源 MAC = AR1 右接口
目的 MAC = PC2
```

但里面的 IP 仍然是：

```text
源 IP = 192.168.1.2
目的 IP = 192.168.2.2
```

所以：

```text
PC1
 │
 │ MAC:
 │ PC1 → AR1-left
 │
 │ IP:
 │ 1.2 → 2.2
 ▼
AR1
 │
 │ MAC:
 │ AR1-right → PC2
 │
 │ IP:
 │ 1.2 → 2.2
 ▼
PC2
```

:::important
普通路由过程中：

**二层 MAC 地址会逐跳改变。**

而：

**源 IP 和目的 IP 通常不会改变。**

如果中间存在 NAT，则是另一个问题。
:::

---

## 14. 第一次 Ping 为什么可能丢包

实验时还遇到过一个很有意思的现象：

```text
PC> ping 192.168.2.2

Request timeout!
Request timeout!

From 192.168.2.2: bytes=32 seq=3 ttl=127
From 192.168.2.2: bytes=32 seq=4 ttl=127
From 192.168.2.2: bytes=32 seq=5 ttl=127
```

看起来像：

```text
40% packet loss
```

但随后再次 Ping 往往就正常了。

原因之一就是第一次通信之前，网络设备可能还需要完成：

```text
PC → ARP 网关
AR1 → ARP 目的主机
交换机 → 学习 MAC
```

等 ARP 与 MAC 表项建立完成之后，后面的通信就不需要重新做这一整套过程。

而且 eNSP 本身又运行在：

```text
VMware
↓
Windows 10
↓
VirtualBox
↓
虚拟网络设备
```

处理延迟本身也会比真实硬件更加明显。

---

## 15. TTL = 127 也说明了数据经过路由器

在跨网段 Ping 中还观察到了：

```text
ttl=127
```

如果发送端初始 TTL 为：

```text
128
```

经过一个三层路由器：

```text
128 → 127
```

于是也可以侧面验证数据路径：

```text
PC1
 ↓
LSW1
 ↓
AR1    TTL - 1
 ↓
LSW2
 ↓
PC2
```

交换机二层转发不会像路由器一样减少 IP TTL。

---

## 16. 从 Ping 到 HTTP

在基本 ICMP 测试成功以后，又继续加入了：

```text
Server
Client
```

拓扑变成：

```text
Server1
   │
 LSW1
   │
  AR1
   │
 LSW2
   │
Client1
```

Server1 配置在：

```text
192.168.1.0/24
```

默认网关：

```text
192.168.1.1
```

Client1 配置在：

```text
192.168.2.0/24
```

默认网关：

```text
192.168.2.1
```

最开始 HTTP Client 使用了：

```text
http://0.0.0.0/default.htm
```

自然无法访问。

`0.0.0.0` 通常代表未指定地址或监听所有本地接口，并不是一个正常的远程服务器目的地址。

修改为 Server1 的真实 IP，同时在 HTTP Server 中指定网页根目录并启动 80 端口以后，再次访问：

```text
http://192.168.1.x/default.htm
```

最终获得：

```text
200 OK
```

---

## 17. 为什么 HTTP 200 OK 比 Ping 通更有意义

Ping 成功只能证明：

```text
ICMP
↓
IP
↓
二层网络
```

基本工作正常。

而 HTTP 成功意味着：

```text
HTTP
 ↓
TCP
 ↓
IP
 ↓
Router
 ↓
Ethernet / ARP
```

这一整条路径都已经能够正常工作。

于是这次实验从最底层的虚拟化环境，一直打通到了应用层。

可以画成：

```text
应用层：
HTTP
  ↓
传输层：
TCP
  ↓
网络层：
IP + Router
  ↓
数据链路层：
Ethernet + MAC + ARP
  ↓
虚拟化环境：
eNSP
  ↓
VirtualBox
  ↓
Windows 10
  ↓
VMware
  ↓
Windows 11
```

最终：

```text
HTTP/1.x 200 OK
```

---

## 18. 这次真正串起来的知识

原本很多概念都是分开的：

```text
IP 地址
子网掩码
MAC 地址
ARP
交换机
默认网关
路由器
HTTP
```

但搭完这套网络以后，它们开始变成了一条完整的链。

### 同网段

```text
IP
↓
判断同网段
↓
ARP 目标 IP
↓
得到目标 MAC
↓
交换机查 MAC 表
↓
直接到目标
```

### 跨网段

```text
IP
↓
判断不同网段
↓
ARP 默认网关
↓
把帧交给路由器
↓
路由器查询路由表
↓
路由器在下一网段 ARP
↓
重新封装 Ethernet Frame
↓
到达目标
```

归根结底：

```text
主机：
IP → MAC

交换机：
MAC → Port

路由器：
Destination Network → Next Hop / Interface
```

三者职责完全不同。

---

## 19. 几个这次踩到的坑

:::warning
### VMware 能运行不代表嵌套虚拟化正常

Windows 10 Guest 能正常开机，只能说明第一层虚拟化正常。

真正需要检查的是：

```text
VMware
↓
能不能把 VT-x/EPT 再暴露给 Guest
```

对于 eNSP + VirtualBox 这种结构，这是决定 AR 能否运行的关键。
:::

:::warning
### 不要把交换机 CLI 当成路由器 CLI

有一次打开的是 LSW1，但是执行了：

```text
sysname AR1
```

于是提示符真的变成：

```text
[AR1]
```

但设备实际上仍然是一台交换机。

设备名称只是名称，并不会把交换机变成路由器。
:::

:::warning
### 192.168.1.0/24 中的 .0 不是普通主机

例如：

```text
192.168.1.0/24
```

通常：

```text
192.168.1.0   = 网络地址
192.168.1.255 = 广播地址
```

普通终端应使用中间的可用主机地址。
:::

:::caution
如果为了 VMware 嵌套虚拟化关闭了：

```text
Hyper-V
虚拟机平台
Windows 虚拟机监控程序平台
```

那么 WSL2、Windows Sandbox、Hyper-V 虚拟机等功能可能暂时不可用。

修改之前最好明确自己当前是否使用这些功能。
:::

---

## 20. 总结

这次看起来只是在搭一个简单的双网段实验，但实际做的事情比预想中多得多。

首先解决的是：

```text
Windows 11 26H2
↓
VMware
↓
Windows 10
↓
VirtualBox
↓
eNSP
```

这一整套嵌套虚拟化环境。

真正的关键是：

> **让 Intel VT-x/EPT 成功从宿主机经过 VMware 继续提供给 Guest 中的 VirtualBox。**

解决这个问题以后，AR 才真正能够正常启动。

接下来又搭建了：

```text
192.168.1.0/24
        │
       AR1
        │
192.168.2.0/24
```

并把下面这些知识真正串了起来：

```text
IP 地址
   ↓
子网掩码
   ↓
同网段判断
   ↓
ARP
   ↓
MAC 地址
   ↓
二层交换
   ↓
默认网关
   ↓
路由
   ↓
TCP
   ↓
HTTP
```

最后成功得到：

```text
200 OK
```

到这里，环境折腾阶段基本结束。

接下来终于可以正式开始学网络了。

:::tip
这次最大的收获其实不是“把 eNSP 装好了”。

而是第一次能够真正看见：

**一个数据包为什么要找 MAC、什么时候找网关、交换机到底看什么、路由器为什么有多个 IP，以及一个 HTTP 请求究竟是怎样穿过两个局域网到达服务器的。**
:::