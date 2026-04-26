import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { useStore } from '../stores/useStore';
import { familiesAPI } from '../services/api';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: '管理员', color: COLORS.primary },
  member: { label: '成员', color: COLORS.accent },
  viewer: { label: '只读', color: COLORS.textLight },
};

export default function FamilyScreen() {
  const { families, fetchFamilies, user, setCurrentFamily, currentFamilyId } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [memberStats, setMemberStats] = useState<any[]>([]);

  useEffect(() => {
    fetchFamilies();
  }, []);

  useEffect(() => {
    if (currentFamilyId) {
      loadMemberStats();
    }
  }, [currentFamilyId]);

  const loadMemberStats = async () => {
    if (!currentFamilyId) return;
    try {
      const res: any = await familiesAPI.getStats(currentFamilyId);
      setMemberStats(res.data.memberStats || []);
    } catch (error) {
      console.error('Failed to load member stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFamilies();
    if (currentFamilyId) await loadMemberStats();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!familyName.trim()) {
      Alert.alert('提示', '请输入家庭名称');
      return;
    }
    try {
      await familiesAPI.create(familyName);
      await fetchFamilies();
      setShowCreate(false);
      setFamilyName('');
      Alert.alert('成功', '家庭创建成功！');
    } catch (error: any) {
      Alert.alert('错误', error.userMessage || error.message);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('提示', '请输入邀请码');
      return;
    }
    try {
      await familiesAPI.join(inviteCode);
      await fetchFamilies();
      setShowJoin(false);
      setInviteCode('');
      Alert.alert('成功', '成功加入家庭！');
    } catch (error: any) {
      Alert.alert('错误', error.userMessage || error.message);
    }
  };

  const currentFamily = families.find((f: any) => f.id === currentFamilyId);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FD79A8', '#FDCB6E']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>👨‍👩‍👧‍👦 家庭</Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
      >
        {/* 操作按钮 */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { setShowCreate(true); setShowJoin(false); }}
          >
            <LinearGradient
              colors={COLORS.gradientPurple as any}
              style={styles.actionBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.actionBtnText}>➕ 创建家庭</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { setShowJoin(true); setShowCreate(false); }}
          >
            <LinearGradient
              colors={COLORS.gradientGreen as any}
              style={styles.actionBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.actionBtnText}>🔗 加入家庭</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 创建家庭表单 */}
        {showCreate && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>创建新家庭</Text>
            <TextInput
              style={styles.formInput}
              placeholder="输入家庭名称"
              placeholderTextColor={COLORS.textLight}
              value={familyName}
              onChangeText={setFamilyName}
            />
            <View style={styles.formBtnRow}>
              <TouchableOpacity style={styles.formCancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.formCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate}>
                <LinearGradient
                  colors={COLORS.gradientPurple as any}
                  style={styles.formSubmitBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.formSubmitText}>创建</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 加入家庭表单 */}
        {showJoin && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>通过邀请码加入</Text>
            <TextInput
              style={styles.formInput}
              placeholder="输入6位邀请码"
              placeholderTextColor={COLORS.textLight}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <View style={styles.formBtnRow}>
              <TouchableOpacity style={styles.formCancelBtn} onPress={() => setShowJoin(false)}>
                <Text style={styles.formCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleJoin}>
                <LinearGradient
                  colors={COLORS.gradientGreen as any}
                  style={styles.formSubmitBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.formSubmitText}>加入</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 家庭列表 */}
        {families.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>还没有家庭</Text>
            <Text style={styles.emptyDesc}>创建一个家庭或通过邀请码加入</Text>
          </View>
        ) : (
          families.map((family: any) => (
            <TouchableOpacity
              key={family.id}
              style={[styles.familyCard, currentFamilyId === family.id && styles.familyCardActive]}
              onPress={() => setCurrentFamily(family.id)}
            >
              <View style={styles.familyHeader}>
                <View style={styles.familyNameRow}>
                  <Text style={styles.familyEmoji}>🏠</Text>
                  <Text style={styles.familyName}>{family.name}</Text>
                  {currentFamilyId === family.id && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>当前</Text>
                    </View>
                  )}
                </View>
                <View style={styles.inviteCodeRow}>
                  <Text style={styles.inviteLabel}>邀请码：</Text>
                  <Text style={styles.inviteCode}>{family.invite_code}</Text>
                </View>
              </View>

              {/* 成员列表 */}
              <View style={styles.memberList}>
                <Text style={styles.memberTitle}>
                  成员 ({family.members?.length || 0})
                </Text>
                {(family.members || []).map((member: any) => {
                  const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.member;
                  return (
                    <View key={member.id} style={styles.memberItem}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {member.user_name?.[0] || '?'}
                        </Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>
                          {member.user_name}
                          {member.user_id === user?.id ? ' (我)' : ''}
                        </Text>
                        <Text style={styles.memberEmail}>{member.user_email}</Text>
                      </View>
                      <View style={[styles.roleBadge, { backgroundColor: roleInfo.color + '20' }]}>
                        <Text style={[styles.roleText, { color: roleInfo.color }]}>
                          {roleInfo.label}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* 成员消费对比 */}
        {memberStats.length > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>📊 成员消费对比</Text>
            {memberStats.map((stat: any, index: number) => {
              const maxExpense = Math.max(...memberStats.map((s: any) => s.total_expense || 0), 1);
              const percent = ((stat.total_expense || 0) / maxExpense) * 100;
              return (
                <View key={index} style={styles.statItem}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statName}>{stat.name}</Text>
                    <Text style={styles.statAmount}>¥{(stat.total_expense || 0).toFixed(0)}</Text>
                  </View>
                  <View style={styles.statBarBg}>
                    <LinearGradient
                      colors={COLORS.gradientPurple as any}
                      style={[styles.statBar, { width: `${percent}%` as any }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 56,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnGradient: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm + 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  formBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  formCancelBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm + 4,
  },
  formCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  formSubmitBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm + 4,
  },
  formSubmitText: {
    color: '#FFF',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOW.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  familyCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOW.sm,
  },
  familyCardActive: {
    borderColor: COLORS.primary,
  },
  familyHeader: {
    marginBottom: SPACING.md,
  },
  familyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  familyEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  familyName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  currentBadge: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  currentBadgeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  inviteCode: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  memberList: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  memberTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  memberEmail: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  roleBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statItem: {
    marginBottom: SPACING.md,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  statName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  statAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  statBarBg: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
    borderRadius: 4,
  },
});
