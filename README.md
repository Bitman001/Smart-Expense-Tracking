# 🧾 Smart Expense · 智能记账

> 说一句话，AI 帮你记账 —— 一款面向年轻白领与家庭用户的跨端智能记账应用。

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Expo](https://img.shields.io/badge/Expo-SDK%2050-000020?logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#-license)

Monorepo 全栈架构：**React Native (Expo) 前端 + Node.js/Express 后端 + SQLite 存储**，同一份代码同时跑在 iOS / Android / Web 三端。

---

> ### 🚨 安全公告 · v1.0.0 已知数据隔离问题
>
> **v1.0.0 及更早版本**存在严重的数据隔离缺陷：后端 `/api/records`、`/api/records/summary`、
> `/api/families/:id/stats`、`/api/budgets`、`/api/export/*` 均只按 `familyId` 过滤,未校验
> 调用者是否是该家庭成员。配合客户端在登录/注册时未清空前一用户的 `currentFamilyId` 缓存,
> 会导致**新用户注册后看到演示账号(demo@example.com)的账单、收入、预算**。
>
> **已在 v1.0.1 修复**：服务端为所有接受 `familyId` 的路由新增 `isFamilyMember()` 成员校验,
> 非成员访问一律返回 `403`;客户端 `login`/`register`/`logout` 现在会显式清空旧缓存。
>
> 若你已基于 v1.0.0 代码部署了生产环境,**请务必 `git pull` + 重新部署**。

---

## ✨ 核心功能

| 功能 | 描述 |
|------|------|
| 🤖 **智能录入** | 自然语言文本输入（如"今天午饭花了35"），AI 自动解析金额、类别、类型、日期 |
| ✏️ **账单编辑** | 点击首页「最近账单」中任意一条即可打开编辑面板，修改金额 / 类别 / 类型 / 备注 / 日期，或直接删除 |
| 👨‍👩‍👧 **家庭共享** | 创建家庭组，多成员独立记账，数据实时同步，三级权限（管理员 / 成员 / 只读） |
| 📊 **多维统计** | 月度收支、预算进度、分类占比、趋势图、成员对比 |
| 📤 **数据导出** | CSV 导出、分享卡片生成 |

---

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 项目架构 | Monorepo（NPM Workspaces） |
| 移动端 | React Native · Expo SDK 50 · React Navigation |
| 网页端 | React Native Web（复用同一份代码） |
| 状态管理 | Zustand |
| 后端 | Node.js · Express · TypeScript · `tsx watch` 热重载 |
| 数据库 | SQLite（better-sqlite3，零依赖，开箱即用） |
| AI 解析 | 规则引擎 + OpenAI API（可选增强） |
| 认证 | JWT（jsonwebtoken + bcryptjs） |

---

## 📂 项目结构

```
smart-expense/
├── apps/
│   ├── mobile/                    # React Native (Expo) 前端
│   │   ├── src/
│   │   │   ├── screens/           # 5 个 Tab 页面
│   │   │   ├── components/        # 共享组件（含 EditRecordModal）
│   │   │   ├── navigation/        # 路由
│   │   │   ├── services/          # API 调用层
│   │   │   ├── stores/            # Zustand 状态
│   │   │   └── constants/         # 主题配置
│   │   ├── index.js               # 根组件注册入口
│   │   ├── App.tsx
│   │   └── app.json
│   └── server/                    # Node.js + Express 后端
│       ├── src/
│       │   ├── routes/            # auth / records / categories / families / parse / budgets / export
│       │   ├── services/          # AI 解析引擎
│       │   ├── middlewares/       # 认证、错误处理
│       │   ├── database.ts        # SQLite 初始化
│       │   ├── seed.ts            # 种子数据
│       │   └── index.ts
│       └── data/                  # 运行时 SQLite（已 .gitignore）
├── packages/
│   └── shared/                    # 跨端共享的类型、常量、主题
└── package.json                   # 根级 workspace 配置
```

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- npm ≥ 9（或 yarn / pnpm）

### 1. 克隆 & 安装

本项目使用 NPM Workspaces，在仓库根目录执行**一次** `npm install` 即可装好所有依赖。

> 📦 GitHub Release 中以 `smart-expense.zip` 形式分发，也可直接 clone 仓库。如果是从 zip 开始，解压后 `cd smart-expense` 再执行下面命令。

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
```

### 2. 启动后端

```bash
npm run server:dev
```

> 默认监听 `http://localhost:3000`。首次启动会自动建库并写入种子数据（分类、演示账号、示例账单）。

### 3. 启动前端

**方式 A · 网页端（推荐做首次演示）**

```bash
cd apps/mobile
npx expo start --web
# 浏览器打开 http://localhost:8081
```

**方式 B · 原生移动端**

```bash
npm run mobile:start
# 用 Expo Go 扫码，或按 i / a 打开 iOS / Android 模拟器
```

### 4. 登录演示账号

| 字段 | 值 |
|------|------|
| 邮箱 | `demo@example.com` |
| 密码 | `demo123` |

> 💡 前端默认连 `http://localhost:3000/api`。如果后端部署在别的地址，修改 `apps/mobile/src/services/api.ts` 中的 `API_BASE_URL` 即可。

---

## 📡 API 一览

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 当前用户 |
| PUT | `/api/auth/me` | 更新用户资料 |
| GET | `/api/records` | 账单列表（分页、过滤） |
| POST | `/api/records` | 新建账单 |
| PUT | `/api/records/:id` | **更新账单**（金额 / 类别 / 类型 / 备注 / 日期） |
| DELETE | `/api/records/:id` | 删除账单 |
| GET | `/api/records/summary` | 月度统计 |
| POST | `/api/parse` | AI 智能解析自然语言 |
| GET | `/api/categories` | 类别列表 |
| POST | `/api/categories` | 自定义类别 |
| GET/POST | `/api/families` | 家庭组 CRUD |
| POST | `/api/families/join` | 通过邀请码加入 |
| GET | `/api/families/:id/stats` | 家庭维度统计 |
| GET/POST | `/api/budgets` | 预算管理 |
| GET | `/api/export/csv` | 导出 CSV |
| GET | `/api/export/share-data` | 分享卡片数据 |

---

## 🤖 AI 解析示例

| 输入 | 金额 | 类别 | 类型 | 日期 |
|------|-----:|------|------|------|
| `今天午饭花了35块` | 35 | 🍽️ 餐饮 | 支出 | 今天 |
| `昨天打车回家30` | 30 | 🚗 交通 | 支出 | 昨天 |
| `发工资15000` | 15000 | 💰 工资 | 收入 | 今天 |
| `买了杯咖啡25元` | 25 | 🍽️ 餐饮 | 支出 | 今天 |
| `超市购物199` | 199 | 🛒 购物 | 支出 | 今天 |

---

## 🗄️ 数据模型

六张核心表：

| 表 | 说明 |
|------|------|
| `users` | 用户（id / name / email / bcrypt 密码 / 头像） |
| `families` | 家庭组（含 6 位邀请码） |
| `family_members` | 家庭成员 & 角色：`admin` / `member` / `viewer` |
| `records` | 记账明细（金额、类别、日期、类型、来源） |
| `categories` | 类别（14 个系统预置 + 用户自定义） |
| `budgets` | 预算（按月 / 按类别） |

**预置类别**

- 支出：🍽️ 餐饮 · 🚗 交通 · 🛒 购物 · 🎮 娱乐 · 🏥 医疗 · 📚 教育 · 🏠 居住 · 📱 通讯 · 👔 服饰 · 📌 其他
- 收入：💰 工资 · 🎁 奖金 · 📈 投资 · 💵 其他收入

---

## 🎨 设计规范

- 主色调：紫 `#6C5CE7` / 粉 `#FD79A8` / 绿 `#00B894`
- 辅助色：红 `#FF6B6B` / 黄 `#FDCB6E` / 蓝 `#74B9FF`
- 风格：Instagram 风，渐变背景、大圆角卡片、柔和阴影
- 字体：系统无衬线

---

## 🛠️ 开发提示

<details>
<summary>环境变量（<code>apps/server/.env</code>）</summary>

项目已提供 `apps/server/.env.example` 模板，拷贝一份填值即可：

```bash
cp apps/server/.env.example apps/server/.env
```

```env
# 必填（生产环境）：JWT 签名密钥
# 未设置时进程会随机生成一个 ephemeral 值并打印 WARN，重启后旧 token 失效
# 生成: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=

# 可选：启用 OpenAI 增强解析
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-nano

# 可选：端口（默认 3000）
PORT=3000
```

> 🔐 所有 API Key / 密钥 / token 都应放在 `.env` 中，绝不要写进源码。`.env` 已在 `.gitignore`。

</details>

<details>
<summary>重置数据库</summary>

```bash
rm apps/server/data/*.db*
npm run server:dev   # 重新启动会自动建库 + 种子
```

</details>

<details>
<summary>常见问题</summary>

- **Web 启动报 `Cannot resolve entry file`**：检查 `apps/mobile/package.json` 的 `main` 字段是否为 `./index.js`。
- **浏览器登录失败、请求超时**：确认 `apps/mobile/src/services/api.ts` 的 `API_BASE_URL` 指向正在运行的后端。
- **`no such column: "now"`**：升级到最新代码，早期版本有个 SQL 双引号 bug 已修复。

</details>

---

## 🗺️ Roadmap

- [ ] 图片 OCR 识别小票
- [ ] 语音输入
- [ ] 多币种
- [ ] 云同步（可选接入 Supabase / Firebase）
- [ ] PWA 安装支持

---

## 📄 License

MIT © 2026
