# Smart Expense · 移动端

React Native (Expo SDK 50) 前端，同一份代码跑 iOS / Android / Web。

## 后端 API 地址配置

API 基址从 Expo 客户端环境变量 `EXPO_PUBLIC_API_URL` 读取（`src/services/api.ts`）。根据场景选择对应的 `.env` 文件：

| 场景 | 文件 | 期望值 |
|------|------|--------|
| 本地开发（web / Expo Go） | `apps/mobile/.env.development` | `http://localhost:3000/api` |
| 打包 APK / Release web | `apps/mobile/.env.production` | `https://<railway-domain>/api` |
| 模板（提交到 git） | `apps/mobile/.env.example` | 占位示例 |

`.env.development` 和 `.env.production` 均已在 `apps/mobile/.gitignore` 中忽略，**不要提交**。

> ⚠️ 只有以 `EXPO_PUBLIC_` 开头的变量才会被打进客户端 bundle。

### 临时切换后端地址（不改 .env）

```bash
cd apps/mobile
EXPO_PUBLIC_API_URL=https://<railway-domain>/api npx expo start --web --clear
```

命令行 env 覆盖 `.env.*` 文件。`--clear` 强制清缓存，确保新地址生效。

## 打包 APK 前 checklist

1. 确认 `apps/mobile/.env.production` 的 `EXPO_PUBLIC_API_URL` 指向线上后端（Railway 公网域名）
2. 后端已开放对应 Origin 的 CORS（或 `ALLOWED_ORIGINS` 未设置时默认放开）
3. 运行 `eas build -p android` 或 `npx expo prebuild && ./gradlew assembleRelease`

## 演示账号

| 字段 | 值 |
|------|-----|
| 邮箱 | `demo@example.com` |
| 密码 | `demo123` |

首次启动后端会自动建库 + 写入种子数据（分类、示例账单、该演示账号）。

## 常见问题

- **登录后一直停在登录页 / Network Error**：`apps/mobile/src/services/api.ts` 启动时会 `console.log('[api] baseURL = ...')`，打开浏览器 DevTools Console 核对地址是否正确。
- **切换 `.env.*` 后不生效**：Expo 会缓存 bundle，加 `--clear` 重启。
- **APK 包里请求失败但 web 正常**：通常是打包时用的 `.env.production` 未更新，或 Android 网络安全策略阻止了明文 HTTP。生产后端请用 HTTPS。
