---
title: 项目复盘：57元打造百兆带宽的“云端”私人影院
published: 2025-12-12
description: '无需昂贵NAS，利用廉价VPS+网盘+存算分离架构，打造高性能个人媒体库的全过程记录。涵盖从Rclone挂载到.strm影子库的架构演进。'
image: ''
tags: [Jellyfin, VPS, Alist, Docker, Nginx]
category: '折腾记录'
draft: false
lang: 'zh-CN'
---

## 1. 项目背景与目标

**核心需求：** 想要一个可以随时随地观看 4K/1080P 影视的私人媒体库。

**痛点分析：**
* **台湾/海外服务器：** 带宽太小（通常仅 5-10Mbps），无法流畅播放高清视频。
* **大陆服务器：** 带宽高但硬盘极其昂贵（30GB 系统盘），根本存不下电影。
* **本地 NAS：** 硬件投入大，不仅要买硬盘，还需要公网 IP 和复杂的内网穿透。

**解决方案：** 采用 **“存算分离”** 架构。
利用大陆廉价的大带宽服务器做“计算节点”，利用阿里云盘做“无限存储节点”。

---

## 2. 硬件与成本清单

| 组件 | 规格/说明 | 成本 | 作用 |
| :--- | :--- | :--- | :--- |
| **计算节点** | 雨云 KVM 进阶版 <br> (4核 4G 100M带宽 1TB流量) | 20元/月 | 负责流量转发、Jellyfin 服务运行、WebDAV 挂载 |
| **存储节点** | 阿里云盘 (Open接口) | 37元/月 | 存放 TB 级的影视资源，作为“无限云硬盘” |
| **中转节点** | 闲置的台湾/海外服务器 | 已有资源 | **关键辅助**：用于拉取 Docker 镜像并打包回传国内 |
| **刮削节点** | 本地 Windows 电脑 + TMM | 0元 | 负责生成标准 NFO 和海报，避免服务器联网刮削失败 |

---

## 3. 架构设计图

存储层文件存放在阿里云盘，通过 AList 转化为 WebDAV 协议，最终由 Jellyfin 读取。

```mermaid

    User["用户 (手机/电视/PC)"]
    Jellyfin["Jellyfin 容器 (大陆服务器)"]
    MergerFS["MergerFS 合并文件系统"]
    Rclone["Rclone 挂载点"]
    Alist["Alist 容器"]
    Aliyun["阿里云盘 (云端存储)"]
    PC["本地电脑 (TMM)"]

    User -->|"Direct Play/100Mbps"| Jellyfin
    Jellyfin -->|读取本地路径| MergerFS
    MergerFS -->|直通模式| Rclone
    Rclone -->|WebDAV协议| Alist
    Alist -->|API调用| Aliyun

    subgraph Local [本地管理]
        direction TB
        PC -->|"生成NFO/刮削"| Aliyun
```

**存储层：** 电影存放在阿里云盘。

**接入层：** AList 通过官方 API 连接网盘，将其转化为 WebDAV 协议。

**挂载层：** Rclone 将 WebDAV 挂载为服务器本地目录，配合 MergerFS 进行路径管理。

**应用层：** Jellyfin 读取挂载路径，建立媒体库。

**展现层：** 用户通过 Jellyfin 客户端利用 100M 带宽流畅播放。

## 4. 实施过程中的“填坑”实录
我们在部署过程中遇到了 5 个关键的技术障碍，并逐一攻克：

**🛑 障碍一：** 大陆服务器拉取 Docker 镜像超时
现象： docker pull jellyfin/jellyfin 卡死，报错 i/o timeout。

**解决方案：** “曲线救国”。

利用海外服务器下载镜像：docker pull ...

打包镜像：docker save -o jellyfin.tar jellyfin/jellyfin

回传大陆服务器：scp jellyfin.tar root@ip:/root/

导入镜像：docker load -i jellyfin.tar

:::note
事后还是充了七块大洋买了个付费加速线路（doge）
:::
🛑 **障碍二：** 播放报错“无法找到有效的媒体源”
现象： 能够看到海报，但点击播放直接报错，FFmpeg 进程崩溃 (Code 183)。

原因： 服务器是 KVM 架构（无显卡），但 Jellyfin 默认开启了硬件加速，试图调用 /dev/dri 导致崩溃；同时挂载参数不当导致读取 0B 文件。

**解决方案：**

在 Jellyfin 控制台将硬件加速改为 “无 (None)”。

修复底层挂载（见障碍五）。

使用客户端（Jellyfin Media Player）解码代替浏览器解码，减轻服务器 CPU 压力。

**🛑 障碍三：** 剧集识别错误 (Season -1)
现象： 剧集被归类为“第 -1 季”，无法播放。

原因： 目录结构不规范（如直接放在根目录），Jellyfin 无法识别。

**解决方案：** 规范命名法。将文件夹严格重命名为 剧名 (年份)/Season 01/ 结构，配合 TMM 生成 NFO 文件强制纠正。

**🛑 障碍四：** 元数据刮削失败 (网络墙)
现象： 电影能看，但没有海报，日志显示连接 TMDB 超时。

原因： 大陆服务器无法访问 TMDB 的 API 服务器。

**解决方案：** 本地刮削策略。

在 Windows 电脑上挂载网盘。

用 TMM (TinyMediaManager) 刮削好数据（NFO+图片），上传到网盘。

Jellyfin 设置为“不联网下载，仅读取 NFO”。

**🛑 障碍五：** 0B“幽灵文件”与挂载失效 (最棘手)
现象： 系统能看到文件名，但文件大小显示为 0B，无法播放；或者 MergerFS 无法正确显示网盘内容。

原因： Rclone 默认缓存模式 (writes) 不支持流媒体完整读取。MergerFS 缓存了错误的空状态，未穿透到底层。

**解决方案：**

Rclone 参数： 必须开启 --vfs-cache-mode full 并设置合理的缓存大小。

MergerFS 参数： 必须添加 direct_io 参数，强迫读取底层真实数据。

权限： 确保 /etc/fuse.conf 开启 user_allow_other。

## 5. 最终成果与性能表现
画质： 实测播放 40Mbps 码率的 4K 原盘电影，秒开不卡顿（得益于 100M 专享带宽）。

负载： 服务器 CPU 占用率长期低于 10%（因为使用了 Direct Play 客户端解码，服务器只负责传输数据）。

流量： 1TB 流量包足够每月观看 20-50 部高质量大片，对于个人影院绰绰有余。

维护： 全自动流程。只需在本地整理好文件上传，云端自动同步，无需维护服务器网络。

### 给后继者的建议：

不要省那 10 块钱： 做视频流媒体，流量就是生命。1TB 流量带来的安全感远超 500GB 套餐。

放弃浏览器播放： 浏览器不支持 HEVC (H.265)，会导致服务器 CPU 软解爆炸。请务必使用 Jellyfin Media Player 或手机 APP。

目录结构是灵魂： 一开始就按照 剧名 (年份)/Season XX 的格式整理文件，能省去后期无数的麻烦。

## 6. 进阶实战案例：云端“排雷”与资源清洗
在项目投入使用后的日常运营中，我们遭遇了一次典型的“伪装文件”事件，这意外验证了本架构在网络安全和资源管理上的独特优势。

事件背景： 下载了一部名为 [LoliHouse]...1080p.exe 的资源，体积高达 1.4GB。通常视频文件后缀应为 mkv/mp4，这种大体积 EXE 极具迷惑性，通常为“填充型病毒”。（实际上大概率是防止小白不会解压的自解压压缩包）

**架构优势发挥：**

无接触排雷： 得益于 Rclone/Alist 的挂载机制，无需将 1.4GB 的可疑文件下载到本地硬盘。

流式解压： 直接在挂载的网盘目录中右键调用 Bandizip（利用其预览压缩包功能）。Bandizip 会通过网络读取文件头，迅速识别出该文件实为“自解压压缩包”。

云端清洗： 在不解压 EXE 的情况下，直接从压缩包内提取出真正的 .mkv 视频文件保存，随后直接删除原 EXE。

一句话总结： 挂载盘模式不仅仅是扩展存储，更是一个安全缓冲区。整个过程就像在云端进行了一次“外科手术”，病毒代码从未进入本地内存运行。

## 7. 架构迭代：从“硬挂载”到“影子库”的质变 (V2.0)
在项目稳定运行一段时间后，为了追求极致的 “0 CPU 占用” 和 “秒开体验”，我们实施了架构升级——“.strm 影子库方案”。

痛点分析
传统的 Rclone 挂载模式下，数据流向是 网盘 -> Rclone (FUSE) -> 内核 -> Jellyfin -> 客户端。数据必须经过服务器 CPU 的两次中转，效率低且延迟高。

新方案原理
利用 Python 脚本扫描本地元数据目录，在另一个“影子目录”中生成与视频同名的 .strm 文本文件。文件内容仅包含 Alist 的直链 URL（HTTP）。

效果
CPU 占用降至 0： Jellyfin 读取的是文本文件，直接将 URL 丢给客户端播放，服务器不再参与视频流的解密和转发。

彻底解决 0B 问题： 脚本逻辑直接忽略本地的 0B 占位文件，只生成有效链接。

兼容性完美： 本地保留 NFO 和图片，Jellyfin 依然拥有完美的海报墙。

## 8. 关键技术沉淀：自动化构建脚本
为了实现上述方案，我们编写了 create_final_library.py 自动化脚本，实现了“一键建站”。

脚本核心逻辑：

路径映射： 自动将本地路径（如 /mnt/ssd/media）转换为 Alist 的 WebDAV/HTTP 路径（如 /d/aliyunpan）。

智能清洗： 遍历过程中自动过滤系统垃圾文件。

URL 编码处理： 解决了文件名中包含空格、中文、甚至英文单引号 ' 导致的转义错误（Code 500/Object not found）。

公网适配： 解决了 127.0.0.1 本地回环陷阱，强制使用 NAT 穿透后的公网地址。


### 代码片段示例（URL安全编码）
```bash
Python:

encoded_url_path = urllib.parse.quote(url_path, safe="/:'")
final_url = f"{ALIST_HOST}{encoded_url_path}"
```

## 9. 架构补完：HTTPS 强制加密与“混合内容”突围 (V3.0 安全层)
进入 V3.0 阶段，我们遭遇了移动端操作系统的“降维打击”：Android 和 iOS 严格拦截 HTTPS 页面中的 HTTP 资源（Mixed Content）。

解决方案：“异地办证，本地上岗”与 Nginx 魔法
异地证书申请 (DNS Challenge)：

利用闲置的台湾 VPS 作为“证书生成器”。

使用 acme.sh 配合 Cloudflare API 申请泛域名证书 (*.xxxx.xyz)。

将生成的证书文件回传至大陆 VPS。

**Nginx 核心优化 (消除混合内容)：**
```bash

Nginx:

# 欺骗浏览器，将不安全的 HTTP 请求升级
add_header Content-Security-Policy "upgrade-insecure-requests";

# 关键配置：关闭缓冲，改为流式传输，确保秒开
proxy_buffering off;

# 强制透传 Range 头，确保客户端可以拖动进度条
proxy_set_header Range $http_range;
proxy_set_header If-Range $http_if_range;
```
## 10. 细节打磨：外挂字幕救援
解决了视频播放问题后，我们发现外挂字幕 (.srt) 在 Web 播放器中离奇消失。这是浏览器的 CORS (跨域资源共享) 策略在作祟。

### 解决方案：

在 Nginx 的 location / 块中添加暴力 CORS 白名单：
```bash
Nginx:

add_header Access-Control-Allow-Origin * always;
add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS' always;
同时，确保 Nginx 正确识别 .srt / .vtt 文件 MIME 类型为 text/vtt，防止将其作为二进制流下载。
```
## 11. 总结
回顾整个项目，我们经历了三个阶段的蜕变：

V1.0 (Rclone 挂载)： 解决了“存”的问题，但受限于 FUSE 性能。

V2.0 (.strm 影子库)： 解决了“算”的问题，存算彻底分离，CPU 占用降为 0。

V3.0 (HTTPS + Nginx)： 解决了“防”与“容”的问题，实现了全平台无感播放。

最终形态：一台20元/月 的 2 核机器，扛起了 TB 级的媒体库（阿里云盘VIP不算awa）。它不再是一个简陋的玩具，而是一个拥有 绿锁认证 (HTTPS)、秒开缓冲、完美海报墙、且没有任何安全弹窗 的现代化私人流媒体中心。