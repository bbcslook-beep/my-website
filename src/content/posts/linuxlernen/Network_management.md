---
title: Linux 下的网络管理笔记，从命令到配置文件
published: 2026-06-11
description: 记录 Linux 常用网络管理技巧，涵盖 nmcli、ip 命令、底层 NetworkManager 配置文件，以及 DNS 解析与常用网络工具的详细用法。
tags: [Linux, 网络管理, nmcli, 基础教程, wget, curl]
category: '技术笔记'
draft: false
---

:::note
在 Red Hat 系列的 Linux 发行版中，虽然我们可以使用 `nm-connection-editor`（图形界面）或 `nmtui`（终端字符图形界面）来进行网络配置，但在实际的服务器运维中，熟练掌握命令行和配置文件的操作更为高效和重要。本文除了简要提及图形化工具，将主要聚焦于纯命令行的网络管理及底层排错操作。
:::

## 1. 图形与 TUI 模式网络管理

如果您拥有桌面环境或者不熟悉命令行，系统提供了两款直观的工具：

* **nm-connection-editor**：在终端输入该命令，即可调出纯图形界面的网络配置窗口，支持设定 DHCP（动态获取 IP）和静态 IP。
* **nmtui**：在没有桌面环境的终端下，可以输入 `nmtui` 调出字符图形界面（TUI 模式），通过键盘上下键和回车即可完成网卡的增删改查以及激活操作。

---

## 2. 使用 nmcli 命令控制网络

`nmcli` 是 NetworkManager 的命令行工具，功能非常强大，主要分为对 **网络总控**、**设备 device** 和 **连接 connection** 的管理。

### 2.1 网络功能总开关

你可以随时查看、开启或关闭系统的整体网络功能。

```bash title="全局网络状态控制"
# 检测网络功能状态（会输出 enabled 或 disabled）
[root@node1 Desktop]# nmcli networking 
enabled

# 关闭全局网络功能
[root@node1 Desktop]# nmcli networking off
[root@node1 Desktop]# nmcli networking 
disabled

# 开启全局网络功能
[root@node1 Desktop]# nmcli networking on 
```
*执行关闭操作后，如果使用 `ip a` 查看，会发现除了环回网卡 `lo` 之外，其他物理网卡（如 `ens160`）的状态会变为 `DOWN`。*

### 2.2 设备管理 (device)

设备通常对应物理网卡（如 `ens160`）。

```bash title="网卡设备管理"
# 查看所有网卡设备的信息（包含硬件地址、MTU、状态及分配的 IP 信息）
[root@node1 Desktop]# nmcli device show 
GENERAL.DEVICE:                         ens160
GENERAL.TYPE:                           ethernet
GENERAL.HWADDR:                         00:0C:29:3A:36:B0
GENERAL.STATE:                          100 (connected)
GENERAL.CONNECTION:                     haha
...
IP4.ADDRESS[1]:                         172.25.254.200/24

# 查看特定网卡设备的信息
[root@node1 Desktop]# nmcli device show ens160

# 关闭设备 / 断开设备
[root@node1 Desktop]# nmcli device down ens160 
Device 'ens160' successfully disconnected.

[root@node1 Desktop]# nmcli device disconnect ens160 
Device 'ens160' successfully disconnected.

# 开启设备 / 连接设备
[root@node1 Desktop]# nmcli device up ens160 
Device 'ens160' successfully activated with '0d0208c4-ae09-41a8-93bf-05f653a9abfc'.

[root@node1 Desktop]# nmcli device connect ens160 
Device 'ens160' successfully activated with '0d0208c4-ae09-41a8-93bf-05f653a9abfc'.
```


### 2.3 连接管理 (connection)

连接是一组针对设备的配置。一个设备可以有多个连接配置文件，但同一时间只能激活一个。

```bash title="网络连接配置"
# 查看所有连接
[root@node1 Desktop]# nmcli connection show  
NAME  UUID                                  TYPE      DEVICE 
lee   37a5d826-f467-49df-b2e4-0039dce3a66a  ethernet  ens160 
lo    3a0611ff-ccb9-451e-9de3-b29a451bd772  loopback  lo

# 删除名为 lee 的连接
[root@node1 Desktop]# nmcli connection delete lee
Connection 'lee' (37a5d826-f467-49df-b2e4-0039dce3a66a) successfully deleted.

# 新增 DHCP 动态获取 IP 的连接
[root@node1 Desktop]# nmcli connection add type ethernet con-name lee ifname ens160 ipv4.method auto

# 新增静态 IP 的连接
[root@node1 Desktop]# nmcli connection add type ethernet con-name lee ifname ens160 ipv4.method manual ipv4.addresses 172.25.254.200/24

# 更改已有连接信息（修改 IP 地址为 168 结尾）
[root@node1 Desktop]# nmcli connection modify lee ipv4.addresses 172.25.254.168/24 

# 将已有连接改为 DHCP 模式
[root@node1 Desktop]# nmcli connection modify lee ipv4.method auto 
```


:::tip
修改完 connection 的配置后，务必执行 `nmcli connection up <连接名>`（例如 `nmcli connection up lee`）来让配置生效！
系统会提示 `Connection successfully activated` 表示成功。
:::

---

## 3. 通过配置文件设定 IP

除了使用 `nmcli`，我们还可以直接去编辑 NetworkManager 的底层配置文件。配置文件默认存放在 `/etc/NetworkManager/system-connections/` 目录下。

:::important
如果是手动新建或修改了 `.nmconnection` 配置文件，一定要确保文件的权限为 `600`，并且修改后需要重载网络连接。
:::

```bash title="编辑底层网络配置文件"
cd /etc/NetworkManager/system-connections/

# 创建或编辑名为 haha 的配置文件
vim haha.nmconnection
```

### 3.1 动态与静态模式配置示例

**动态获取 IP (DHCP)**：
```ini title="haha.nmconnection (动态IP)"
[connection]
id=haha                 # 连接名称
type=ethernet           # 连接类型
interface-name=ens192   # 绑定的网卡设备名

[ipv4]
method=auto             # IP 获取方式为自动获取
```

**静态指定 IP**：
```ini title="haha.nmconnection (静态IP)"
[connection]
id=haha
type=ethernet
interface-name=ens192

[ipv4]
method=manual                     # 手动配置
address1=192.168.0.100/24         # 设定的静态 IP 和子网掩码
```

### 3.2 让配置文件生效并验证

```bash title="重载并激活连接"
[root@node1 system-connections]# chmod 600 haha.nmconnection
[root@node1 system-connections]# nmcli connection reload
[root@node1 system-connections]# nmcli connection up haha

# 查看配置结果
[root@node1 system-connections]# ifconfig ens192
ens192: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.0.100  netmask 255.255.255.0  broadcast 192.168.0.255
...
        RX packets 9  bytes 2636 (2.5 KiB)
        TX packets 215  bytes 31149 (30.4 KiB)
```
*可以看到，指定的 `192.168.0.100` 已经成功绑定到 `ens192` 网卡上。*

---

## 4. IP 与连通性测试命令

日常排错最离不开的就是网络状态查看和连通性测试。

### 4.1 ip 命令

`ip` 命令是现代 Linux 管理网络的核心指令，比老旧的 `ifconfig` 更全面。

```bash title="ip 命令常用操作"
# 查看指定设备 (如 ens160) 的 IP
[root@node1 Desktop]# ip a s dev ens160
2: ens160: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP ...
    inet 172.25.254.168/24 brd 172.25.254.255 scope global noprefixroute ens160

# 给指定网卡临时添加辅助 IP
[root@node1 Desktop]# ip a a 172.25.254.10/24 dev ens160

# 删除绑定的某个 IP
[root@node1 ~]# ip a d 172.25.254.131/24 dev ens160
```
*(注：上述示例引用自实际操作输出。)*

### 4.2 ifconfig 命令

用于查看设备信息或进行临时配置。

```bash title="ifconfig 命令常用操作"
# 开启或关闭设备
[root@node1 ~]# ifconfig ens160 down 
[root@node1 ~]# ifconfig ens160 up 

# 设定设备临时 IP
[root@node1 ~]# ifconfig ens160 172.25.254.10 netmask 255.255.255.0
```

:::warning
使用 `ip a a` 或者 `ifconfig` 命令设定的 IP 地址都属于 **临时生效**。在网络服务重启（如 `nmcli connection reload` 并 `up`）或系统重启后，这些配置将会丢失。持久化配置请参考前面的配置文件方法。
:::

### 4.3 ping 命令

```bash title="连通性测试"
# 区域不可达的情况
[root@node1 ~]# ping 172.25.254.100
ping: connect: Network is unreachable

# 指定 ping 的次数 (-c)
[root@node1 ~]# ping -c3 172.25.254.131
PING 172.25.254.131 (172.25.254.131) 56(84) bytes of data.
64 bytes from 172.25.254.131: icmp_seq=1 ttl=64 time=0.049 ms
64 bytes from 172.25.254.131: icmp_seq=2 ttl=64 time=0.051 ms
64 bytes from 172.25.254.131: icmp_seq=3 ttl=64 time=0.058 ms

# 指定 ping 命令的最长等待时间为 1 秒 (-w)
[root@node1 ~]# ping -w 1 172.25.254.10
--- 172.25.254.10 ping statistics ---
1 packets transmitted, 0 received, 100% packet loss, time 0ms
```
*(注：输出示例参考自实际环境测试。)*

---

## 5. 主机网关设置

如果我们的主机需要将数据包发送到不同的网络区域，就需要配置网关。设定网关的目的是为了把不能到达网络区域的数据包发送给路由器，让路由器做地址转换（NAT）或者路由转发。网关的本质是路由器上与当前主机同网段的那个 IP。

```bash title="查看当前主机路由表"
[root@localhost Desktop]# route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
172.25.254.0    0.0.0.0         255.255.255.0   U     100    0        0 ens160
```

### 5.1 设定临时网关

```bash title="临时添加默认网关"
[root@localhost Desktop]# ping 8.8.8.8
ping: connect: Network is unreachable

# 假设网关 IP 为 172.25.254.2
[root@localhost Desktop]# ip route add default via 172.25.254.2

# 添加完成后测试外网连通性
[root@localhost Desktop]# ping 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=128 time=75.1 ms
```
*(注：命令及返回结果参考实际路由配置操作。)*

:::caution
此方法同样是临时生效的。如果你执行了 `nmcli connection reload` 并重新 `up` 了网卡，临时设定的路由表将会失效，`Gateway` 一栏又会变回 `0.0.0.0`。
:::

### 5.2 设定永久网关

```bash title="永久添加默认网关"
# 给名为 haha 的连接配置网关
[root@localhost Desktop]# nmcli connection modify haha ipv4.gateway 172.25.254.2

# 重载生效
[root@localhost Desktop]# nmcli connection reload 
[root@localhost Desktop]# nmcli connection up haha 

# 验证网关是否生效
[root@localhost Desktop]# route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         172.25.254.2    0.0.0.0         UG    100    0        0 ens160
```
*此时出现 `Destination 0.0.0.0` 对应的 `Gateway` 为 `172.25.254.2`，表示永久默认网关已生效。*

---

## 6. 地址解析 (DNS & Hosts)

地址解析就是把网址变成 IP 的过程。系统访问外网域名时，离不开本地解析和 DNS 解析。

### 6.1 本地解析 (`/etc/hosts`)

谁用电脑上网，谁就直接告诉电脑这个网址的 IP 是多少。本地解析通常在企业内部主机映射时使用，速度最快、优先级最高。

```bash title="配置本地 hosts 解析"
[root@node1 ~]# vim /etc/hosts
127.0.0.1   localhost localhost.localdomain
36.152.44.93            [www.baidu.com](https://www.baidu.com)
183.194.238.117         [www.qq.com](https://www.qq.com)
```

### 6.2 通过 DNS 解析 (`/etc/resolv.conf`)

DNS 是运营商提供给客户的一个域名和 IP 对应关系的服务器。当你在自己的主机设定了 DNS 后，去访问域名时，系统会根据你指定的 DNS 服务器去询问这个域名对应的 IP 是多少。

```bash title="配置公共 DNS 服务器"
[root@node1 ~]# vim /etc/resolv.conf 
nameserver 8.8.8.8

# 配置好后即可正常解析常规公网域名
[root@node1 ~]# ping [www.taobao.com](https://www.taobao.com)
```

---

## 7. 常用网络下载与测试命令

在确认网络连通和解析正常后，我们经常需要在终端中进行资源下载或网页请求测试。

### 7.1 wget 命令下载工具

`wget` 是非常强大的终端下载工具，支持各类断点续传和后台运行机制。

```bash title="wget 常用参数"
# 直接下载文件到当前目录
[root@node1 Desktop]# wget [https://qqdl.gtimg.cn/.../QQ_3.2.29_x86_64_01.rpm](https://qqdl.gtimg.cn/.../QQ_3.2.29_x86_64_01.rpm)

# 使用 -P 参数，指定文件下载后的保存路径（如保存到 /mnt）
[root@node1 Desktop]# wget https://... -P /mnt

# 使用 -t 参数，指定下载失败时的重试次数（例如重试 3 次）
[root@node1 Desktop]# wget -t 3 https://... -P /mnt

# 使用 -b 参数，将下载任务放入后台执行（不阻塞当前终端）
[root@node1 Desktop]# wget -t 3 https://... -P /mnt -b

# 使用 -c 参数，开启断点续传（如果下载中断，下次执行命令会从上次断开的进度继续）
[root@node1 Desktop]# wget -t 3 https://... -P /mnt -c
...
HTTP request sent, awaiting response... 206 Partial Content
Length: 184197956 (176M), 105620292 (101M) remaining 
Saving to: ‘/mnt/QQ_3.2.29_260528_x86_64_01.rpm’
```

### 7.2 curl 命令请求测试

`curl` 是一个利用 URL 语法在命令行下工作的文件传输工具，常用于测试 API 接口和网页连通性。

```bash title="curl 抓取网页并保存"
# 使用 -o 参数，将抓取到的网页源码输出并保存为指定的本地文件
[root@server ~]# curl [www.baidu.com](https://www.baidu.com) -o index.html

# 查看下载下来的文件属性
[root@server ~]# ll index.html 
```
