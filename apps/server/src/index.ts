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

// CORS 配置:
// - 开发环境(NODE_ENV !== 'production')允许所有来源,便于本地调试
// - 生产环境通过 ALLOWED_ORIGINS 环境变量(逗号分隔)配置白名单;
//   未配置时同样放开所有来源(简化首次部署,生产环境建议显式配置)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions =
  process.env.NODE_ENV === 'production' && allowedOrigins.length > 0
    ? { origin: allowedOrigins, credentials: true }
    : { origin: true, credentials: true };

app.use(cors(corsOptions));
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
