import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { useStore } from '../stores/useStore';
import { budgetsAPI, exportAPI } from '../services/api';

export default function SettingsScreen() {
  const { user, logout, summary } = useStore();
  const [budgetAmount, setBudgetAmount] = useState(summary?.budget?.toString() || '8000');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSetBudget = async () => {
    const amount = parseFloat(budgetAmount);
    if (!amount || amount <= 0) {
      Alert.alert('提示', '请输入有效的预算金额');
      return;
    }
    try {
      await budgetsAPI.createOrUpdate({ amount });
      Alert.alert('成功', '预算设置成功');
    } catch (error: any) {
      Alert.alert('错误', error.userMessage || error.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      Alert.alert('导出', '正在生成 CSV 文件...\n（实际使用时会触发文件下载）');
    } catch (error: any) {
      Alert.alert('错误', error.userMessage || error.message);
    }
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#636E72', '#2D3436']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>⚙️ 设置</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 用户信息卡片 */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{user?.name?.[0] || '?'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* 预算设置 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💰 月度预算</Text>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetSymbol}>¥</Text>
            <TextInput
              style={styles.budgetInput}
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              keyboardType="decimal-pad"
              placeholder="输入预算金额"
              placeholderTextColor={COLORS.textLight}
            />
            <TouchableOpacity onPress={handleSetBudget}>
              <LinearGradient
                colors={COLORS.gradientPurple as any}
                style={styles.budgetBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.budgetBtnText}>保存</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* 偏好设置 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🎨 偏好设置</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🌙</Text>
              <Text style={styles.settingLabel}>深色模式</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
              thumbColor={darkMode ? COLORS.primary : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <Text style={styles.settingLabel}>消费提醒</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
              thumbColor={notifications ? COLORS.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* 数据管理 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📂 数据管理</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleExportCSV}>
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuLabel}>导出 CSV</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📑</Text>
            <Text style={styles.menuLabel}>导出 Excel</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🖼️</Text>
            <Text style={styles.menuLabel}>生成分享卡片</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* 关于 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ℹ️ 关于</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>版本</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>开发者</Text>
            <Text style={styles.aboutValue}>Smart Expense Team</Text>
          </View>
        </View>

        {/* 退出登录 */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

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
  profileCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOW.sm,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarLargeText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  sectionCard: {
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
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetSymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  budgetInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm + 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  budgetBtn: {
    borderRadius: RADIUS.sm + 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  budgetBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  settingLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  menuArrow: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  aboutLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  aboutValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  logoutBtn: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.danger,
  },
});
