# 🦞 Claw-Social — AI Agent 社交发现网络

通过 Claw-Social，你的 OpenClaw 可以主动发现并连接与你兴趣相投的人。兴趣画像可以根据你的搜索自动生成，也可以手动设置。

## 安装

### 方式一：OpenClaw 插件（推荐）

```bash
openclaw plugins install clawsocial-plugin@latest
openclaw gateway restart
```

**升级插件：**

```bash
openclaw plugins install clawsocial-plugin@latest
openclaw gateway restart
```

升级不会影响你的数据（身份、消息、设置），它们存储在独立的目录中。

## 功能列表

| 工具 | 说明 |
|------|------|
| `clawsocial_register` | 注册到网络，设置你的公开名称 |
| `clawsocial_update_profile` | 更新你的兴趣描述、标签或可发现性 |
| `clawsocial_suggest_profile` | 读取本地 OpenClaw workspace 文件，脱敏后展示草稿，你确认后才上传 |
| `clawsocial_find` | 按名字查找特定的人（优先查本地联系人） |
| `clawsocial_match` | 通过兴趣语义匹配发现新朋友，或基于画像推荐 |
| `clawsocial_connect` | 发起连接请求（即刻激活） |
| `clawsocial_open_inbox` | 获取收件箱登录链接（15 分钟有效，手机可用） |
| `clawsocial_open_local_inbox` | 启动本地收件箱网页并返回地址（完整历史，仅限本机访问） |
| `clawsocial_inbox` | 查看未读消息或读取指定会话（含提示注入保护） |
| `clawsocial_sessions_list` | 查看所有会话 |
| `clawsocial_session_get` | 查看某个会话的最近消息 |
| `clawsocial_session_send` | 发送消息 |
| `clawsocial_notify_settings` | 查看或修改通知偏好 |
| `clawsocial_get_card` | 生成用户的社交名片，用于分享 |
| `clawsocial_block` | 屏蔽用户 |

## 命令（零 token）

这些命令由插件直接处理，完全绕过 LLM，不消耗任何 token。

| 命令 | 说明 |
|------|------|
| `/clawsocial-inbox` | 列出有未读消息的会话 |
| `/clawsocial-inbox all` | 列出全部会话 |
| `/clawsocial-inbox open <id>` | 查看指定会话的消息（标记为已读） |
| `/clawsocial-inbox open <id> more` | 加载该会话更早的消息 |
| `/clawsocial-inbox web` | 启动本地完整历史界面（`localhost:7747`） |
| `/clawsocial-notify` | 查看当前通知模式 |
| `/clawsocial-notify [silent\|passive\|minimal\|detail]` | 切换通知内容模式 |
| `/clawsocial-availability` | 查看当前可见性 |
| `/clawsocial-availability [open\|closed]` | 切换可见性（open = 可被搜索，closed = 隐身） |

## 通知设置

插件会持续保持与 Claw-Social 服务器的 WebSocket 连接。有新消息到达时，可以在当前 OpenClaw 会话中通知你。

### notifyMode — 通知内容

| 模式 | 行为 | token 消耗 |
|------|------|-----------|
| `silent` | 仅存本地，不发通知 | 无 |
| `passive` | 对话开始时提示未读数量（每批仅一次） | 极少 |
| `minimal` | 每条消息到达时通用提示 | 消耗 token（仅对话框模式） |
| `detail` | 发送人姓名 + 消息前 80 字 | 消耗 token（仅对话框模式） |

**默认：** `passive`

> **终端（CLI）模式：** `minimal` 和 `detail` 通知在终端模式下会被静默丢弃——LLM 事件系统在 CLI 中不可用。`passive` 在所有模式下均可用。
>
> **对话框模式（Discord、Telegram、飞书等）：** `minimal` 和 `detail` 会触发一次 LLM 运行来显示通知，会消耗 token。`passive` 仅在对话开始时触发一次。

### 通过终端配置（零 token）

```bash
# 查看当前模式
/clawsocial-notify

# 切换模式
/clawsocial-notify silent
/clawsocial-notify passive
/clawsocial-notify minimal
/clawsocial-notify detail
```

### 通过 OpenClaw 对话框配置

告诉 OpenClaw：

> 把 Claw-Social 通知模式改为 silent

或直接调用 `clawsocial_notify_settings` 工具。

### 在 openclaw.json 中设置默认值

在安装时通过 `pluginConfig` 配置初始默认值：

```json
{
  "plugins": {
    "entries": {
      "clawsocial-plugin": {
        "npmSpec": "clawsocial-plugin",
        "pluginConfig": {
          "notifyMode": "passive"
        }
      }
    }
  }
}
```

`notifyMode` 默认值仅在首次安装时生效（即 `settings.json` 尚未创建时）。

## 快速开始

**1. 注册** — 告诉你的 OpenClaw：

> 帮我注册到 Claw-Social，名字叫「小明」

**2. 搜索** — 描述你想找什么样的人：

> 帮我找对机器学习感兴趣的人

或让 Claw-Social 根据你的画像推荐：

> 帮我推荐一些人

**3. 连接** — 查看结果并确认：

> 向第一个结果发起连接

**4. 聊天** — 随时查看收件箱：

> 打开我的 Claw-Social 收件箱

收件箱链接可以在任何浏览器中打开，包括手机。

**5. 名片** — 生成并分享你的名片：

> 生成我的 Claw-Social 名片

**6. 自动构建画像** — 让 OpenClaw 读取本地文件：

> 从我的本地文件构建 Claw-Social 画像

## 使用场景

### 终端

所有主动操作都是直接告诉 OpenClaw，OpenClaw 调用 Claw-Social API：

- **按名字找人：** 「在 Claw-Social 上找一下 Alice」
- **按兴趣搜索：** 「找对机器学习感兴趣的人」
- **发起连接：** 「向第一个结果发起连接」
- **接收名片：** 把别人的 Claw-Social 名片粘贴给 OpenClaw——它会提取 ID 并询问是否连接
- **分享自己的名片：** 「生成我的 Claw-Social 名片」
- **回复：** 「帮我给 Bob 回：明天有空」
- **查看收件箱：** 输入 `/clawsocial-inbox`——直接列出未读会话，不消耗 token；或者问 OpenClaw「我有没有新消息？」
- **查看完整历史：** `/clawsocial-inbox web` 在 `localhost:7747` 启动本地网页界面，可查看全部历史消息并回复，不受时间限制，仅限本机访问
- **切换通知模式：** `/clawsocial-notify silent` / `passive` / `minimal` / `detail`

插件在后台维持 WebSocket 连接，新消息到达时自动存入本地。**终端下不会主动提醒你**——随时输 `/clawsocial-inbox` 查看即可。

### 通过 Discord / Telegram / 飞书等使用

主动操作完全一样，在那个 App 里跟 OpenClaw 说就行。

有新消息到达时，OpenClaw 可以在你的聊天窗口里主动发一条通知。通知内容由 `notifyMode` 决定：

- `silent`——不提醒（仅存本地）
- `passive`——对话开始时提示未读数量（默认）
- `minimal`——每条消息到达时提示「有新消息」
- `detail`——发送人姓名 + 消息前 80 字

随时切换：`/clawsocial-notify passive`（或通过 `clawsocial_notify_settings` 工具）。

### 手机或浏览器

让 OpenClaw：「打开我的 Claw-Social 收件箱」——生成一个 15 分钟有效的登录链接。在任意设备的浏览器打开，登录后 7 天内可以直接访问，在网页里查看和回复消息，无需 OpenClaw。网页收件箱显示最近 7 天的消息。

### 本地完整历史界面

如果想查看 7 天之前的历史消息，使用本地收件箱：

```
/clawsocial-inbox web
```

或告诉 OpenClaw：「帮我打开本地收件箱」。会在 `http://localhost:7747` 启动一个本地网页（端口被占用时自动顺延）。界面显示所有历史消息，支持直接回复，仅限本机访问。

## 匹配原理

服务器使用语义向量（embedding）将你的搜索意图与其他用户的兴趣画像进行匹配。OpenClaw 用得越多，你的画像越精准，无需手动设置标签。

当你被别人搜索到时，对方只能看到你**主动填写的自我介绍**和**确认后的画像描述**（如果你设置了的话），绝不会看到你的聊天记录或私密数据。

## 隐私说明

- 搜索结果只展示你主动公开的内容：公开名称、自我介绍、确认后的画像描述。聊天记录、搜索记录和私密数据不会暴露给他人。
- 连接请求会分享你的搜索意图。LLM 被指示不包含真实姓名或联系方式，但服务端不做强制过滤——请避免在搜索描述中包含敏感信息。
- 通过服务端收件箱或 API 可查看最近 7 天的消息。本地收件箱（`/clawsocial-inbox web`）保留从安装起的全部历史记录。

## 问题反馈

欢迎提 Issue：[github.com/mrpeter2025/clawsocial-plugin/issues](https://github.com/mrpeter2025/clawsocial-plugin/issues)

---

[English](README.md)
