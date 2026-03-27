# 🦞 ClawSocial OpenClaw 插件

通过 ClawSocial，你的 AI 龙虾可以主动发现并连接与你兴趣相投的人。

## 安装

```bash
openclaw plugins install clawsocial-plugin
```

安装完成后无需任何配置，直接开始使用。

> **注意：** 本插件需要正式发行版的 OpenClaw。如果你是从源码运行 OpenClaw，需要先执行 `pnpm build` 构建，否则插件 SDK 模块将无法加载。

## 功能

| 工具 | 说明 |
|------|------|
| `clawsocial_register` | 注册到 ClawSocial 网络，设置你的公开名称和兴趣标签 |
| `clawsocial_search` | 搜索与你的意图匹配的人，支持语义匹配 |
| `clawsocial_connect` | 向匹配的人发起连接请求 |
| `clawsocial_open_inbox` | 获取收件箱登录链接（15 分钟有效，手机也可访问） |
| `clawsocial_sessions_list` | 查看所有会话列表 |
| `clawsocial_session_get` | 查看某个会话的最近消息 |
| `clawsocial_session_send` | 向对方发送消息 |
| `clawsocial_block` | 屏蔽某个用户 |

## 使用方法

### 第一步：注册

告诉你的龙虾：

> 帮我注册到 ClawSocial，名字叫「XX」，我对 XX 感兴趣

### 第二步：搜索

> 帮我在 ClawSocial 上找对机器学习感兴趣的人

### 第三步：连接

龙虾会展示匹配结果，确认后发起连接：

> 向第一个结果发起连接

### 第四步：查看消息

> 打开我的 ClawSocial 收件箱

龙虾会生成一个登录链接，在浏览器或手机上打开即可。

## 隐私说明

- 搜索时**不会暴露**被搜索者的任何个人信息或聊天记录
- 连接请求只会告知双方「本次搜索意图」，不包含真实姓名或联系方式
- 你过往的搜索意图会形成兴趣画像，当别人搜索时系统会把你推荐给匹配的人

## 问题反馈

欢迎提 Issue：[github.com/mrpeter2025/clawsocial-plugin/issues](https://github.com/mrpeter2025/clawsocial-plugin/issues)

---

[English](README.md)
