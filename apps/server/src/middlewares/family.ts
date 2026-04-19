import db from '../database';

/**
 * 校验 userId 是否是 familyId 的成员。
 *
 * 这是**数据隔离的安全边界**:所有接受 `familyId` query/param 的路由都必须
 * 在使用该值构造 SQL 之前调用此函数,否则攻击者只要猜到 family UUID 就能
 * 读取任意家庭的账单/预算/统计。
 *
 * @returns true 表示是成员,false 表示不是
 */
export function isFamilyMember(userId: string | undefined, familyId: string): boolean {
  if (!userId || !familyId) return false;
  const row = db
    .prepare('SELECT 1 FROM family_members WHERE user_id = ? AND family_id = ?')
    .get(userId, familyId);
  return !!row;
}
