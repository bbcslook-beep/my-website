---
title: Linux 入门核心，全面掌握软件管理与仓库搭建
published: 2026-06-17
description: 深入解析 Linux 下的软件包管理体系，包含 DNF/RPM 核心命令实战，以及手把手教你搭建本地、网络及第三方软件仓库。
tags: [Linux, 基础教程, 运维, 包管理]
category: '技术笔记'
draft: false
---

在学习 Linux 的过程中，掌握如何高效地安装、卸载和管理软件是必修课。与 Windows 中双击 `.exe` 文件不同，Linux 有着一套严密而强大的软件包管理机制。今天，我们就来深度探索 Linux 系统下的软件管理。

## 1. 搞懂 Linux 软件包的类型

在开始动手操作前，我们需要先了解 Linux 中常见的软件包类型：

* **压缩包 / 源码包**：这类软件通常以绿色软件形式存在（解压即用），或者是需要通过源码编译使用的（标准的编译三部曲：`./configure` -> `make` -> `make install`）。
* **DEB 软件包**：适用于类 Debian 操作系统（如 Ubuntu）。因为我们目前使用的是基于 RedHat 的系统，所以不能直接使用此类软件包。
* **RPM 软件包 (RedHat Package Manager)**：RedHat 系 Linux 最核心的包格式。其中，`rpm` 命令是最底层的管理工具，但它有一个痛点——无法自动解决软件依赖关系；而 `dnf` 则是建立在 rpm 之上的高级包管理器，它能通过访问“软件仓库”来自动识别并解决软件的依赖性问题。

:::note
**总结**：在日常运维中，我们绝大多数情况下会使用 `dnf` 来安装软件，只有在处理特殊离线包或排查底层问题时，才会直接使用 `rpm`。
:::

---

## 2. 搭建本地软件仓库 (利用系统镜像)

在使用系统镜像安装 Linux 操作系统时，系统其实并没有把镜像中包含的所有软件都安装进去。镜像本身就是一个巨大的软件宝库！我们可以把它挂载并配置成“本地软件仓库”。

### 第一步：挂载镜像并设置开机自动挂载

首先，找到系统中没有安装的软件包，将系统安装光盘或镜像挂载到指定目录。

```bash title="挂载操作"
# 1. 创建挂载点目录
mkdir /rhel9

# 2. 手动挂载光驱到指定目录
mount /dev/sr0 /rhel9/
# 输出提示: mount: /rhel9: WARNING: source write-protected, mounted read-only.
```

:::warning
手动挂载在重启后就会失效。为了让配置永久生效，我们需要将其写入开机启动脚本中。
:::

```bash title="配置开机自动挂载"
# 写入开机自动运行的脚本
vim /etc/rc.d/rc.local

# 在文件中添加以下内容：
mount /dev/sr0 /rhel9/

# 赋予该脚本可执行权限，确保开机时能够正确运行
chmod +x /etc/rc.d/rc.local
```
*(以上命令参考)*

### 第二步：配置软件源指向文件 (`.repo`)

Linux 是通过 `/etc/yum.repos.d/` 目录下的 `.repo` 配置文件来寻找软件仓库的。

```ini title="/etc/yum.repos.d/rhel9.repo"
[AppStream]
name = AppStream software
baseurl = file:///rhel9/AppStream/
gpgcheck = 1
gpgkey = file:///etc/pki/rpm-gpg/RPM-GPG-KEY-redhat-release
enabled = 1

[BaseOS]
name = BaseOS software
baseurl = file:///rhel9/BaseOS/
gpgcheck = 1
gpgkey = file:///etc/pki/rpm-gpg/RPM-GPG-KEY-redhat-release
enabled = 1
```

**参数解析**：
* `[AppStream]`：仓库名称，全局唯一。
* `name`：仓库的详细描述。
* `baseurl`：仓库真实存放的地址，这里用 `file://` 表示本地路径。
* `gpgcheck=1`：开启安装软件时的检测授权。
* `enabled=1`：表示启用该仓库。

配置好后，我们可以通过安装 `gcc` 测试一下：

```bash title="安装测试"
dnf install gcc -y
```

**部分输出示例**：
```text
Dependencies resolved.
================================================================================
 Package             Arch       Version                     Repository     Size
================================================================================
Installing:
 gcc                 x86_64     11.5.0-5.el9                AppStream      32 M
Installing dependencies:
 glibc-devel         x86_64     2.34-168.el9                AppStream      37 k
 glibc-headers       x86_64     2.34-168.el9                AppStream     543 k
 kernel-headers      x86_64     5.14.0-570.12.1.el9_6       AppStream     3.5 M
 libxcrypt-devel     x86_64     4.4.18-3.el9                AppStream      32 k
 make                x86_64     1:4.3-8.el9                 BaseOS        541 k

Transaction Summary
================================================================================
Install  6 Packages
...
Complete!
```
可以看到，`dnf` 完美地帮我们自动解析并安装了这 5 个前置依赖！

---

## 3. 进阶：搭建共享型网络软件源

本地仓库虽然好用，但如果是多台服务器，每台都挂载镜像太麻烦。我们可以利用已有的本地仓库，搭建一个供整个局域网使用的网络源！

这里假设有两台主机：
* **服务端（172.25.254.100）**：已配置好本地仓库，负责向网络共享。
* **客户端（172.25.254.200）**：用于测试共享的网络源是否可用。

### 在服务端提供共享

我们将使用 `httpd`（Apache 服务），通过 HTTP 超文本传输协议来提供文件共享。

```bash title="服务端搭建网络源"
# 1. 安装httpd服务
dnf install httpd.x86_64 -y

# 2. 启动服务并设置开机自启
systemctl enable --now httpd

# 3. 必须关闭防火墙，否则客户端无法访问
systemctl disable --now firewalld

# 4. 创建共享目录 (/var/www/html 是 httpd 默认共享的根目录)
mkdir /var/www/html/rhel9

# 5. 将光驱内容挂载到共享目录下
mount /dev/cdrom /var/www/html/rhel9/

# 6. 配置开机挂载 (vim /etc/rc.d/rc.local)
# 添加: mount /dev/sr0 /var/www/html/rhel9
```
*(以上步骤源自)*

### 在客户端配置使用网络源

在客户端机器上，修改配置文件，将 `baseurl` 指向服务端的 IP 地址。

```ini title="客户端 /etc/yum.repos.d/rhel9.repo"
[AppStream]
name = AppStream
baseurl = [http://172.25.254.100/rhel9/AppStream](http://172.25.254.100/rhel9/AppStream)
gpgcheck = 0

[BaseOS]
name = BaseOS
baseurl = [http://172.25.254.100/rhel9/BaseOS](http://172.25.254.100/rhel9/BaseOS)
gpgcheck = 0
```
配置完成后，直接使用 `dnf install gcc -y` 进行测试，当看到能正常下载即可确认搭建成功。

---

## 4. DNF 日常管理命令速查

:::important
注意：以下所有 DNF 相关的实验命令，必须在你的软件仓库配置成功并能正常读取后才能顺利操作！
:::

我把日常最高频使用的 `dnf` 命令整理成了下面的备忘录：

```bash title="DNF 高频命令表"
# 【缓存与基础操作】
dnf repolist                 # 查看当前可用的仓库信息
dnf clean all                # 清除系统中原有的仓库缓存信息
dnf makecache                # 重新建立并加载仓库元数据缓存

# 【软件的安装与卸载】
dnf install gcc -y           # 安装指定的软件 (-y 表示自动回答 yes)
dnf remove gcc -y            # 卸载指定的软件
dnf reinstall gcc -y         # 重装某个软件 (常用于修复被误删核心文件的情况)

# 【查询与检索】
dnf list all                 # 列出仓库中所有的软件
dnf list installed           # 仅列出当前系统中已经安装的软件
dnf list available           # 仅列出目前可以安装但尚未安装的软件
dnf search dhcp              # 根据提供的关键字，在软件包信息中查找包名
dnf whatprovides /bin/ls     # (神级命令) 当你只知道一个命令的路径，可以用它反向查找是由哪个软件包提供的
dnf info coreutils           # 显示软件本身的详细信息（版本、协议、描述等）

# 【操作历史】
dnf history                  # 查看软件操作历史（安装、卸载的轨迹）
dnf history info 6           # 查看ID为6的那条历史记录的详细信息

# 【软件组操作】
dnf group list               # 列出常规的软件组
dnf group list --hidden      # 列出所有软件组（包括隐藏组）
dnf group info 虚拟化平台     # 查看特定软件组的简介与包含的具体组件
dnf group install 虚拟化平台  # 一键安装组内的所有必要组件
```
*(以上命令清单整理自)*

:::tip
**实战小技巧**：如果误删了 `/bin/ls` 怎么办？
你可以先用 `dnf whatprovides /bin/ls` 查到它属于 `coreutils` 包，然后再用 `dnf reinstall coreutils -y` 轻松将其复原！
:::

---

## 5. RPM 底层命令使用姿势

虽然 DNF 很好用，但有时候我们需要安装未经仓库收录的独立 `.rpm` 包，这时候就需要用到 `rpm` 命令了。

### 基础安装与查询

```bash title="RPM 基础操作"
# 1. 安装 RPM 包 ( -i 安装，-v 显示过程，-h 以井号显示进度条 )
rpm -ivh ntfs-3g-2017.3.23-11.el8.x86_64.rpm

# 2. 卸载已安装的软件 ( -e 擦除/卸载 )
rpm -e ntfs-3g

# 3. 基础查询
rpm -qa                      # 查询当前系统中所有已安装的 RPM 包
rpm -q ntfs-3g               # 查询特定包是否安装及版本
rpm -qf /bin/ls              # 查询特定文件属于哪一个已安装的 RPM 包
```
*(操作演示来源)*

### 深度剖析软件包信息

```bash title="RPM 高级查询"
rpm -ql ntfs-3g              # 列出该软件安装在系统中的所有文件路径
rpm -qc httpd                # 仅查找该软件的配置文件路径 (Config)
rpm -qd httpd                # 仅查找该软件的说明文档路径 (Doc)
rpm -q ntfs-3g --info        # 查看这个软件包的详细属性信息
rpm -q FluffyMcAwesome --scripts # 查看该软件包在安装前后会执行哪些底层脚本 (排雷神器！)
```
*(操作演示来源)*

### 强制与暴力手段 (慎用！)

有时候使用 `rpm` 安装会遇到依赖冲突或者版本报错。

:::caution
以下命令请在明确知道后果的情况下使用，这可能导致系统环境被破坏！
:::

* `rpm -ivh xxx.rpm --force`：强制安装软件（如覆盖安装）。
* `rpm -ivh xxx.rpm --nodeps`：强行忽略依赖关系检测，进行安装。

此外，如果怀疑包被篡改过，可以使用 `rpm -Kv <文件名.rpm>` 来校验 MD5 以及 SHA256 签名是否正常。

---

## 6. 构建专属第三方软件仓库

从网上下载下来的非官方授权 RPM 包（比如 `linuxqq`），我们称之为第三方软件。如何把它们整合进 DNF 仓库中去统一管理呢？我们需要建立自己的源！

### 部署步骤

1.  **准备环境**：同样需要使用前面配置好的 `httpd`，新建一个共享目录，并将第三方的 `rpm` 包放入该目录中。
    ```bash
    mkdir /var/www/html/software
    cp softare_packages/*.rpm /var/www/html/software/
    ```
2.  **安装采集工具**：仓库不是单纯把包放进去就行，必须要有元数据。我们需要安装采集工具 `createrepo`。
    ```bash
    dnf install createrepo -y
    ```
3.  **生成数据**：对目标目录执行采集命令。
    ```bash
    createrepo -v /var/www/html/software/
    ```
    执行完毕后，该目录下会生成一个核心的 `repodata` 目录，这里存放了包的相互依赖以及版本元数据。

### 客户端接入第三方仓库

最后，客户端只需编写一个新的 repo 配置文件指向你的第三方路径即可：

```ini title="/etc/yum.repos.d/software.repo"
[software]
name = software
baseurl = [http://172.25.254.100/software](http://172.25.254.100/software)
gpgcheck = 0
enabled = 1
```

配置好之后，你的系统就可以像安装官方组件一样，使用 `dnf install linuxqq.x86_64 -y` 愉快地安装你的第三方应用，并自动处理其所需要的官方依赖组件了！
## 7. 排错与安全实战案例：深入理解包管理机制

为了让大家更深刻地理解 Linux 软件包的安全机制和依赖关系，我们再来补充两个非常经典的实战“踩坑”案例。

### 案例一：当软件包遭到篡改（RPM 安全校验）

在实际生产环境中，我们经常会从网上下载第三方的 `.rpm` 包。如果这个包在下载过程中损坏，或者被黑客植入了恶意代码（例如木马），直接安装将带来巨大的安全隐患。Linux 提供了一套完善的签名和哈希校验机制。

我们来做个破坏性实验，模拟一个被篡改的软件包：

```bash title="模拟篡改与安全校验"
# 1. 我们向原本正常的 linuxqq 安装包尾部追加一段字符（模拟被恶意篡改）
echo haha >> linuxqq_2.0.0-b2-1082_x86_64.rpm

# 2. 使用 rpm -Kv 命令对该软件包进行完整性与签名校验
rpm -Kv linuxqq_2.0.0-b2-1082_x86_64.rpm
```
*(操作命令参考)*

**输出结果示例**：
```text
linuxqq_2.0.0-b2-1082_x86_64.rpm:
    头SHA1 digest: OK
    Payload SHA256 digest: NOTFOUND
    Payload SHA256 ALT digest: NOTFOUND
    MD5 digest: BAD (Expected ce8a51d7fc009a9eabee1c75a92746e2 != 43f37756cf6aff3fd0020de419c44357)
```

:::caution
**原理解析**：可以看到，最关键的 `MD5 digest` 变成了 **BAD**！ RPM 包在构建时会生成唯一的校验值，任何对文件哪怕一个字节的修改（比如我们刚才追加的 `haha`），都会导致校验值发生剧变。
在运维工作中，养成使用 `rpm -Kv` 检查不明来源软件包的习惯，能帮你避开绝大多数的供应链投毒攻击。
:::

---

### 案例二：第三方仓库的依赖缺失（缺失官方源）

前面我们成功搭建了存放 `linuxqq` 的第三方网络仓库。但是，很多新手会犯一个致命错误：**认为只要配了第三方仓库，就可以直接安装里面的软件了，从而忽略了官方基础仓库（AppStream / BaseOS）的配置。**

假设我们现在的机器是一台纯净的系统，在 `/etc/yum.repos.d/` 目录下**只有**我们自己写的 `software.repo`，没有官方仓库配置。

当我们满怀信心地敲下安装命令时，灾难发生了：

```bash title="缺失官方依赖的安装报错"
# 假设当前系统仅启用了自定义的 software 仓库
dnf install linuxqq.x86_64 -y
```

**输出报错示例**：
```text
software                                                        1.1 MB/s | 5.2 kB     00:00
错误：
 问题: conflicting requests
  - nothing provides libgtk-x11-2.0.so.0()(64bit) needed by linuxqq-2.0.0-b2.x86_64
  - nothing provides gtk2 >= 2.24 needed by linuxqq-2.0.0-b2.x86_64
(尝试在命令行中添加 '--skip-broken' 来跳过无法安装的软件包，或添加 '--nobest' 来不只使用最佳选择的软件包)
```

:::warning
**为什么会这样？**
第三方软件（如 QQ）在开发时，并不是把所有底层代码都打包进自己的 `.rpm` 文件里的，它需要调用系统底层的图形库（比如 `gtk2`、`glibc` 等）。

虽然 DNF 找到了你放在第三方仓库里的 `linuxqq` 本身，但它去解析依赖时，发现需要 `gtk2`。接着 DNF 去翻遍了当前已配置的仓库（此时只有 `software` 仓库），没找到 `gtk2`，于是宣告失败。
:::

:::tip
**解决方案与核心逻辑**：
DNF 的强大之处在于它可以**跨仓库组合依赖**。解决这个问题的正确姿势是：**不仅要配置第三方仓库，还必须同时保证系统的官方本地/网络仓库（AppStream 和 BaseOS）可用。**
当多个仓库同时生效时，DNF 就会从 `software` 仓库拉取 QQ 本体，从 `AppStream` 仓库自动拉取 `gtk2` 等依赖，最终完美完成安装组合！
:::
---
希望这篇详尽的笔记能帮你彻底攻克 Linux 的包管理系统！有疑问的话欢迎随时回顾。