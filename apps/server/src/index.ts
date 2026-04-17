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

// 中间件
app.use(cors());
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
