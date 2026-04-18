import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initDatabase } from './database';
import { seedDatabase } from './seed';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth';
import recordRoutes from './routes/records';
import categoryRoutes from './routes/categories';
import familyRoutes from './routes/families';
import parseRoutes from './routes/parse';
import budgetRoutes from './routes/budgets';
import exportRoutes from './routes/export';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置(回调模式,支持所有场景):
// - ALLOWED_ORIGINS 未设置或为 '*' → 允许所有来源(cors 会反射 Origin)
// - ALLOWED_ORIGINS=a,b,c → 白名单精确匹配
// - 无 Origin 头(RN App / curl / 同源)→ 始终放行
const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  const allowed = process.env.ALLOWED_ORIGINS?.trim();

  // 未配置或通配 → 放行(cors 会把请求的 Origin 写回 ACAO)
  if (!allowed || allowed === '*') {
    return callback(null, true);
  }

  // 移动端 App / Postman / 同源请求没有 Origin 头,放行
  if (!origin) {
    return callback(null, true);
  }

  // 白名单匹配(自动 trim 空格,跳过空项)
  const whitelist = allowed
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (whitelist.includes(origin)) {
    return callback(null, true);
  }

  callback(new Error(`CORS blocked: ${origin} not in ALLOWED_ORIGINS`));
};

// Railway/Fastly 会缓存 API 响应并剥离 Access-Control-Allow-Origin 头,
// 导致浏览器 CORS 校验失败。为所有 /api/* 响应显式禁用 CDN 缓存。
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 初始化数据库
initDatabase();
seedDatabase();

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Smart Expense API is running',
    timestamp: new Date().toISOString(),
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/parse', parseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/export', exportRoutes);

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   🧾 Smart Expense API Server            ║
  ║   Running on http://localhost:${PORT}       ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}            ║
  ╚═══════════════════════════════════════════╝
  `);
});

export default app;
