// 一次性脚本:把历史 records.date 中非零填充的日期归一化为 YYYY-MM-DD
// 用法: node apps/server/scripts/fix-date-format.js
// 默认操作 apps/server/data/expense.db,可通过 DATABASE_PATH 环境变量覆盖
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, '..', 'data', 'expense.db');

const db = new Database(DB_PATH);
console.log(`[fix-date-format] DB = ${DB_PATH}`);

const DIRTY_SQL = "SELECT id, date FROM records WHERE length(date) != 10 OR date NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'";
const rows = db.prepare(DIRTY_SQL).all();
console.log(`修复前: ${rows.length} 条脏数据`);

const normalize = (d) => {
  const m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(String(d).trim());
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : null;
};

const upd = db.prepare('UPDATE records SET date = ? WHERE id = ?');
let fixed = 0, skipped = 0;
db.transaction(() => {
  for (const r of rows) {
    const norm = normalize(r.date);
    if (norm) { upd.run(norm, r.id); fixed++; }
    else { console.warn(`  ⚠️  跳过无法解析: id=${r.id} date=${JSON.stringify(r.date)}`); skipped++; }
  }
})();

const after = db.prepare(DIRTY_SQL.replace('SELECT id, date', 'SELECT COUNT(*) AS n')).get();
console.log(`修复完成: ${fixed} 条已修复, ${skipped} 条无法解析, 剩余脏数据: ${after.n}`);
