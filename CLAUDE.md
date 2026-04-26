# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Smart Expense 项目特定规则

### 禁止动的代码
- apps/server/src/index.ts 中的 CORS 配置（容易引入移动端兼容问题）
- apps/server/src/database.ts（有持久化风险）
- apps/server/src/middlewares/auth.ts（影响所有用户）
- apps/mobile/src/services/api.ts 中的 baseURL 和 .env 文件

### 必须遵守
1. 改后端代码后，必须本地用 curl 验证 3 个接口：
   - GET /api/health 返回 200
   - POST /api/auth/login (demo) 返回 200 + token
   - GET /api/records (带 Authorization) 返回 200
2. 改前端代码后，必须本地启动 Web 验证至少 2 个用户场景
3. 任何改动 commit 后等用户审核，不要自动 push 到 main
4. 引入新 npm 依赖前必须先告知并解释为什么需要

### 救援命令（出问题时用户会跑）
git fetch --all --tags
git reset --hard stable-now
git push origin main --force

不要让用户必须用救援命令——这意味着你出错了。
