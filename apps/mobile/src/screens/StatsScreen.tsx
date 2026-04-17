import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { useStore } from '../stores/useStore';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.md * 4;

function formatMoney(amount: number): string {
  if (amount >= 10000) return (amount / 10000).toFixed(1) + '万';
  return amount.toFixed(2);
}

// 简单的柱状图组件
function BarChart({ data, maxValue }: { data: any[]; maxValue: number }) {
  if (!data || data.length === 0) return null;
  const barWidth = Math.min(24, (CHART_WIDTH - 40) / data.length - 4);

  return (
    <View style={styles.chartContainer}>
      <View style={styles.barChartArea}>
        {data.map((item: any, index: number) => {
          const height = maxValue > 0 ? (item.total / maxValue) * 120 : 0;
          return (
            <View key={index} style={styles.barColumn}>
              <Text style={styles.barValue}>
                {item.total >= 1000 ? (item.total / 1000).toFixed(0) + 'k' : item.total.toFixed(0)}
              </Text>
              <View style={[styles.barBg, { height: 120 }]}>
                <LinearGradient
                  colors={item.type === 'income' ? COLORS.gradientGreen as any : COLORS.gradientPurple as any}
                  style={[styles.bar, { height: Math.max(height, 4), width: barWidth }]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                />
              </View>
              <Text style={styles.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// 环形进度组件
function DonutItem({ item, total }: { item: any; total: number }) {
  const percent = total > 0 ? ((item.total / total) * 100).toFixed(1) : '0';
  return (
    <View style={styles.donutItem}>
      <View style={styles.donutLeft}>
        <View style={[styles.donutDot, { backgroundColor: item.color }]} />
        <Text style={styles.donutIcon}>{item.icon}</Text>
        <Text style={styles.donutName}>{item.name}</Text>
      </View>
      <View style={styles.donutRight}>
        <Text style={styles.donutAmount}>¥{item.total.toFixed(0)}</Text>
        <Text style={styles.donutPercent}>{percent}%</Text>
      </View>
    </View>
  );
}

export default function StatsScreen() {
  const { summary, fetchSummary } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewType, setViewType] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    fetchSummary(selectedMonth);
  }, [selectedMonth]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummary(selectedMonth);
    setRefreshing(false);
  };

  // 生成月份列表
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }

  // 准备日趋势数据
  const dailyData = (summary?.dailyTrend || [])
    .filter((d: any) => d.type === viewType)
    .map((d: any) => ({
      label: d.date.slice(8),
      total: d.total,
      type: d.type,
    }));

  const maxDailyValue = Math.max(...dailyData.map((d: any) => d.total), 1);

  // 类别数据
  const categoryData = (summary?.byCategory || []).filter((c: any) => c.type === viewType);
  const totalForType = viewType === 'expense' ? (summary?.totalExpense || 0) : (summary?.totalIncome || 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={COLORS.gradientPurple as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>📊 统计分析</Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* 月份选择 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthRow}>
          {months.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.monthChip, selectedMonth === m && styles.monthChipActive]}
              onPress={() => setSelectedMonth(m)}
            >
              <Text style={[styles.monthChipText, selectedMonth === m && styles.monthChipTextActive]}>
                {m.slice(0, 4)}年{parseInt(m.slice(5))}月
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 总览卡片 */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>总支出</Text>
              <Text style={[styles.overviewAmount, { color: COLORS.expense }]}>
                ¥{formatMoney(summary?.totalExpense || 0)}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>总收入</Text>
              <Text style={[styles.overviewAmount, { color: COLORS.income }]}>
                ¥{formatMoney(summary?.totalIncome || 0)}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>结余</Text>
              <Text style={[styles.overviewAmount, {
                color: (summary?.balance || 0) >= 0 ? COLORS.income : COLORS.expense
              }]}>
                ¥{formatMoney(summary?.balance || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* 类型切换 */}
        <View style={styles.typeSwitchRow}>
          <TouchableOpacity
            style={[styles.typeTab, viewType === 'expense' && styles.typeTabActiveExpense]}
            onPress={() => setViewType('expense')}
          >
            <Text style={[styles.typeTabText, viewType === 'expense' && { color: COLORS.expense }]}>
              支出分析
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeTab, viewType === 'income' && styles.typeTabActiveIncome]}
            onPress={() => setViewType('income')}
          >
            <Text style={[styles.typeTabText, viewType === 'income' && { color: COLORS.income }]}>
              收入分析
            </Text>
          </TouchableOpacity>
        </View>

        {/* 日趋势图 */}
        {dailyData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>📈 每日趋势</Text>
            <BarChart data={dailyData} maxValue={maxDailyValue} />
          </View>
        )}

        {/* 类别占比 */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>
            🍩 {viewType === 'expense' ? '支出' : '收入'}类别占比
          </Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>总计</Text>
            <Text style={styles.totalAmount}>¥{formatMoney(totalForType)}</Text>
          </View>
          {categoryData.length === 0 ? (
            <Text style={styles.emptyText}>暂无数据</Text>
          ) : (
            categoryData.map((cat: any, index: number) => (
              <DonutItem key={index} item={cat} total={totalForType} />
            ))
          )}
        </View>

        {/* AI 洞察 */}
        <View style={styles.insightCard}>
          <LinearGradient
            colors={['#6C5CE7', '#A29BFE']}
            style={styles.insightGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.insightTitle}>🤖 AI 智能洞察</Text>
            <Text style={styles.insightText}>
              {summary?.totalExpense && summary.totalExpense > 0
                ? `本月支出 ¥${formatMoney(summary.totalExpense)}，${
                    categoryData[0]
                      ? `最大支出类别为「${categoryData[0].name}」占比 ${((categoryData[0].total / summary.totalExpense) * 100).toFixed(0)}%。`
                      : ''
                  }${
                    summary.budget && summary.budgetUsed > summary.budget * 0.8
                      ? '⚠️ 预算使用已超过 80%，建议控制非必要支出。'
                      : '整体消费结构健康，继续保持！'
                  }`
                : '本月暂无支出记录，开始记录你的第一笔吧！'}
            </Text>
          </LinearGradient>
        </View>

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
  monthRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  monthChip: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 4,
    marginRight: SPACING.sm,
    ...SHADOW.sm,
  },
  monthChipActive: {
    backgroundColor: COLORS.primary,
  },
  monthChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  monthChipTextActive: {
    color: '#FFF',
  },
  overviewCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  overviewRow: {
    flexDirection: 'row',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  overviewAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  typeSwitchRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 4,
    ...SHADOW.sm,
  },
  typeTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.sm + 4,
  },
  typeTabActiveExpense: {
    backgroundColor: COLORS.expense + '15',
  },
  typeTabActiveIncome: {
    backgroundColor: COLORS.income + '15',
  },
  typeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chartCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
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
  chartContainer: {
    alignItems: 'center',
  },
  barChartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 180,
    paddingBottom: 20,
  },
  barColumn: {
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barBg: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    borderRadius: 4,
  },
  barValue: {
    fontSize: 9,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  donutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  donutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donutDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  donutIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  donutName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  donutRight: {
    alignItems: 'flex-end',
  },
  donutAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  donutPercent: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    paddingVertical: SPACING.lg,
  },
  insightCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  insightGradient: {
    padding: SPACING.md,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: SPACING.sm,
  },
  insightText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
});
