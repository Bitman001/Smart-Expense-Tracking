import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { useStore } from '../stores/useStore';
import EditRecordModal from '../components/EditRecordModal';

const { width } = Dimensions.get('window');

function formatMoney(amount: number): string {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万';
  }
  return amount.toFixed(2);
}

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return '今天';
  if (dateStr === yesterday) return '昨天';
  return dateStr.slice(5).replace('-', '/');
}

export default function HomeScreen({ navigation }: any) {
  const { user, summary, records, fetchSummary, fetchRecords, fetchCategories, fetchFamilies } = useStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [editingRecord, setEditingRecord] = React.useState<any | null>(null);

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchSummary(),
      fetchRecords({ limit: 20 }),
      fetchCategories(),
      fetchFamilies(),
    ]);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const budgetPercent = summary?.budget
    ? Math.min((summary.budgetUsed / summary.budget) * 100, 100)
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* 顶部渐变卡片 */}
        <LinearGradient
          colors={['#6C5CE7', '#A29BFE']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hi, {user?.name || '用户'} 👋</Text>
              <Text style={styles.monthLabel}>{summary?.month || '本月'}概览</Text>
            </View>
            <TouchableOpacity style={styles.avatarBtn}>
              <Text style={styles.avatarText}>{user?.name?.[0] || '?'}</Text>
            </TouchableOpacity>
          </View>

          {/* 收支总览 */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>支出</Text>
              <Text style={styles.summaryAmount}>¥{formatMoney(summary?.totalExpense || 0)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>收入</Text>
              <Text style={styles.summaryAmount}>¥{formatMoney(summary?.totalIncome || 0)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>结余</Text>
              <Text style={[styles.summaryAmount, { color: (summary?.balance || 0) >= 0 ? '#55EFC4' : '#FF6B6B' }]}>
                ¥{formatMoney(summary?.balance || 0)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* 预算进度 */}
        {summary?.budget ? (
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetTitle}>💰 月度预算</Text>
              <Text style={styles.budgetAmount}>
                ¥{formatMoney(summary.budgetUsed)} / ¥{formatMoney(summary.budget)}
              </Text>
            </View>
            <View style={styles.progressBg}>
              <LinearGradient
                colors={budgetPercent > 80 ? ['#FF6B6B', '#E17055'] : COLORS.gradientPurple as any}
                style={[styles.progressBar, { width: `${budgetPercent}%` as any }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.budgetHint}>
              {budgetPercent > 80 ? '⚠️ 预算即将用完，注意控制支出' : `已使用 ${budgetPercent.toFixed(0)}%，继续保持 ✨`}
            </Text>
          </View>
        ) : null}

        {/* 分类环形图概览 */}
        {summary?.byCategory && summary.byCategory.length > 0 && (
          <View style={styles.categoryCard}>
            <Text style={styles.sectionTitle}>📊 支出分类</Text>
            <View style={styles.categoryList}>
              {summary.byCategory
                .filter((c: any) => c.type === 'expense')
                .slice(0, 6)
                .map((cat: any, index: number) => {
                  const percent = summary.totalExpense > 0
                    ? ((cat.total / summary.totalExpense) * 100).toFixed(1)
                    : '0';
                  return (
                    <View key={index} style={styles.categoryItem}>
                      <View style={styles.categoryLeft}>
                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                        <View>
                          <Text style={styles.categoryName}>{cat.name}</Text>
                          <Text style={styles.categoryPercent}>{percent}%</Text>
                        </View>
                      </View>
                      <Text style={styles.categoryAmount}>¥{cat.total.toFixed(0)}</Text>
                      <View style={styles.categoryBarBg}>
                        <View
                          style={[
                            styles.categoryBar,
                            {
                              width: `${percent}%` as any,
                              backgroundColor: cat.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* 最近账单 */}
        <View style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>📝 最近账单</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
              <Text style={styles.viewAll}>查看全部 →</Text>
            </TouchableOpacity>
          </View>

          {records.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>暂无记录，点击 + 开始记账</Text>
            </View>
          ) : (
            records.slice(0, 10).map((record, index) => (
              <TouchableOpacity
                key={record.id}
                style={styles.recordItem}
                onPress={() => setEditingRecord(record)}
                activeOpacity={0.7}
              >
                <View style={[styles.recordIcon, { backgroundColor: record.category_color + '20' }]}>
                  <Text style={styles.recordIconText}>{record.category_icon}</Text>
                </View>
                <View style={styles.recordInfo}>
                  <Text style={styles.recordDesc}>
                    {record.description || record.category_name}
                  </Text>
                  <Text style={styles.recordMeta}>
                    {formatDate(record.date)} · {record.category_name}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.recordAmount,
                    { color: record.type === 'expense' ? COLORS.expense : COLORS.income },
                  ]}
                >
                  {record.type === 'expense' ? '-' : '+'}¥{record.amount.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <EditRecordModal
        visible={!!editingRecord}
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  monthLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  budgetCard: {
    backgroundColor: COLORS.card,
    margin: SPACING.md,
    marginTop: -SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  budgetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  budgetAmount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  progressBg: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  categoryCard: {
    backgroundColor: COLORS.card,
    margin: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  categoryList: {},
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm + 4,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  categoryPercent: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: 70,
    textAlign: 'right',
  },
  categoryBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    marginLeft: SPACING.sm,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 3,
  },
  recentCard: {
    backgroundColor: COLORS.card,
    margin: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  viewAll: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  recordIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 4,
  },
  recordIconText: {
    fontSize: 20,
  },
  recordInfo: {
    flex: 1,
  },
  recordDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  recordMeta: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
