---
title: Linux 下的网络管理笔记，从命令到配置文件
published: 2026-06-11
description: 记录 Linux 常用网络管理技巧，涵盖 nmcli、ip 命令以及底层 NetworkManager 配置文件的详细用法。
tags: [Linux, 网络管理, nmcli, 基础教程]
category: '技术笔记'
draft: false
---

:::note
在 Red Hat 系列的 Linux 发行版中，虽然我们可以使用 `nm-connection-editor`（图形界面）或 `nmtui`（终端字符图形界面）来进行网络配置，但在实际的服务器运维中，熟练掌握命令行和配置文件的操作更为高效和重要。本文主要聚焦于纯命令行的网络管理操作。
:::

## 1. 使用 nmcli 命令控制网络

`nmcli` 是 NetworkManager 的命令行工具，功能非常强大，主要分为对**网络总控**、**设备（device）**和**连接（connection）**的管理。

### 1.1 网络功能总开关

你可以随时查看、开启或关闭系统的整体网络功能。

```bash title="全局网络状态控制"
# 检测网络功能状态（会输出 enabled 或 disabled）
nmcli networking 

# 关闭全局网络功能
nmcli networking off

# 开启全局网络功能
nmcli networking on 
```

### 1.2 设备管理 (device)

设备通常对应物理网卡（如 `ens160`）。

```bash title="网卡设备管理"
# 查看所有网卡设备的信息
nmcli device show 

# 查看特定网卡设备的信息
nmcli device show ens160

# 关闭设备 / 断开设备
nmcli device down ens160 
nmcli device disconnect ens160 

# 开启设备 / 连接设备
nmcli device up ens160 
nmcli device connect ens160 
```

### 1.3 连接管理 (connection)

连接是一组针对设备的配置。一个设备可以有多个连接配置文件，但同一时间只能激活一个。

```bash title="网络连接配置"
# 查看所有连接
nmcli connection show  

# 删除名为 lee 的连接
nmcli connection delete lee

# 新增 DHCP 动态获取 IP 的连接
nmcli connection add type ethernet con-name lee ifname ens160 ipv4.method auto

# 新增静态 IP 的连接
nmcli connection add type ethernet con-name lee ifname ens160 ipv4.method manual ipv4.addresses 172.25.254.200/24

# 更改已有连接信息（修改 IP 地址）
nmcli connection modify lee ipv4.addresses 172.25.254.168/24 

# 将已有连接改为 DHCP 模式
nmcli connection modify lee ipv4.method auto 
```

:::tip
修改完 connection 的配置后，务必执行 `nmcli connection up <连接名>`（例如 `nmcli connection up lee`）来让配置生效！
:::

---

## 2. 通过配置文件设定 IP

除了使用 `nmcli`，我们还可以直接去编辑 NetworkManager 的底层配置文件。配置文件默认存放在 `/etc/NetworkManager/system-connections/` 目录下。

:::important
如果是手动新建或修改了 `.nmconnection` 配置文件，一定要确保文件的权限为 `600`，并且修改后需要重载网络连接。
:::

```bash title="编辑底层网络配置文件"
cd /etc/NetworkManager/system-connections/

# 创建或编辑名为 haha 的配置文件
vim haha.nmconnection
```

### 2.1 动态模式 (DHCP) 配置示例

```ini title="haha.nmconnection (动态IP)"
[connection]
id=haha                 # 连接名称
type=ethernet           # 连接类型
interface-name=ens192   # 绑定的网卡设备名

[ipv4]
method=auto             # IP 获取方式为自动获取
```

### 2.2 静态模式配置示例

```ini title="haha.nmconnection (静态IP)"
[connection]
id=haha
type=ethernet
interface-name=ens192

[ipv4]
method=manual                     # 手动配置
address1=192.168.0.100/24         # 设定的静态 IP 和子网掩码
```

### 2.3 让配置文件生效

```bash title="重载并激活连接"
chmod 600 haha.nmconnection
nmcli connection reload
nmcli connection up haha

# 查看配置结果
ifconfig ens192
```

---

## 3. IP 与连通性测试命令

日常排错最离不开的就是网络状态查看和连通性测试。

### 3.1 ip 命令

`ip` 命令是现代 Linux 管理网络的核心指令，比老旧的 `ifconfig` 更全面。

```bash title="ip 命令常用操作"
# 查看所有设备的 IP
ip a

# 查看指定设备 (如 ens160) 的 IP
ip a s dev ens160

# 给指定网卡临时添加多个 IP
ip a a 172.25.254.10/24 dev ens160

# 删除绑定的某个 IP
ip a d 172.25.254.131/24 dev ens160
```

### 3.2 ifconfig 命令

用于查看设备信息或进行临时配置。

```bash title="ifconfig 命令常用操作"
# 开启或关闭设备
ifconfig ens160 down 
ifconfig ens160 up 

# 设定设备临时 IP
ifconfig ens160 172.25.254.10 netmask 255.255.255.0
```

:::warning
使用 `ip a a` 或者 `ifconfig` 命令设定的 IP 地址都属于 **临时生效**。在网络服务重启或系统重启后，这些配置将会丢失。持久化配置请参考第一和第二节的方法。
:::

### 3.3 ping 命令

```bash title="连通性测试"
# 指定 ping 的次数 (-c)
ping -c3 172.25.254.131

# 指定 ping 命令的最长执行时间为 1 秒 (-w)
ping -w1 172.25.254.10
```

---

## 4. 主机网关设置

如果我们的主机需要将数据包发送到不同的网络区域，就需要配置网关。网关的本质是路由器上与当前主机同网段的那个 IP。

```bash title="查看当前主机路由表"
route -n
```

### 4.1 设定临时网关

```bash title="临时添加默认网关"
# 假设网关 IP 为 172.25.254.2
ip route add default via 172.25.254.2

# 添加完成后测试外网连通性
ping 8.8.8.8
```

:::caution
此方法同样是临时生效的。如果你执行了 `nmcli connection reload` 并重新 `up` 了网卡，临时设定的路由表将会失效。
:::

### 4.2 设定永久网关

要想一劳永逸，依然需要借助 `nmcli` 修改 connection 属性并重载。

```bash title="永久添加默认网关"
# 给名为 haha 的连接配置网关
nmcli connection modify haha ipv4.gateway 172.25.254.2

# 重载生效
nmcli connection reload 
nmcli connection up haha 

# 验证网关是否生效
route -n
```