import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { useStore } from '../stores/useStore';
import { parseAPI, recordsAPI } from '../services/api';

export default function AddScreen({ navigation }: any) {
  const { categories, fetchCategories, addRecord, currentFamilyId, fetchSummary, fetchRecords } = useStore();

  const [mode, setMode] = useState<'smart' | 'manual'>('smart');
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  // 解析结果
  const [parseResult, setParseResult] = useState<any>(null);

  // 手动输入
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [recordType, setRecordType] = useState<'expense' | 'income'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, []);

  const filteredCategories = categories.filter((c: any) => c.type === recordType);

  // 智能解析
  const handleParse = async () => {
    if (!inputText.trim()) {
      Alert.alert('提示', '请输入一句话描述你的消费');
      return;
    }

    setParsing(true);
    try {
      const res: any = await parseAPI.parseText(inputText);
      setParseResult(res.data);
      // 自动填充到手动表单
      setAmount(res.data.amount.toString());
      setDescription(res.data.description);
      setRecordType(res.data.type);
      setDate(res.data.date);
      if (res.data.categoryId) {
        setSelectedCategory(res.data.categoryId);
      }
    } catch (error: any) {
      Alert.alert('解析失败', error.userMessage || error.message);
    } finally {
      setParsing(false);
    }
  };

  // 保存记录
  const handleSave = async () => {
    const finalAmount = parseFloat(amount);
    if (!finalAmount || finalAmount <= 0) {
      Alert.alert('提示', '请输入有效金额');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('提示', '请选择类别');
      return;
    }

    setSaving(true);
    try {
      const res: any = await recordsAPI.create({
        amount: finalAmount,
        type: recordType,
        categoryId: selectedCategory,
        description: description || undefined,
        date,
        source: mode === 'smart' ? 'text' : 'manual',
        familyId: currentFamilyId || undefined,
      });

      addRecord(res.data);
      fetchSummary();
      fetchRecords({ limit: 20 });

      Alert.alert('成功', '记账成功！', [
        { text: '继续记账', onPress: () => resetForm() },
        { text: '返回首页', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error: any) {
      Alert.alert('保存失败', error.userMessage || error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setInputText('');
    setParseResult(null);
    setAmount('');
    setDescription('');
    setSelectedCategory('');
    setRecordType('expense');
    setDate(new Date().toISOString().split('T')[0]);
  };

  // 快捷短语
  const quickPhrases = [
    '午餐外卖35元',
    '打车回家30块',
    '买了杯咖啡25',
    '超市购物199',
    '发工资15000',
  ];

  return (
    <View style={styles.container}>
      {/* 顶部标题 */}
      <LinearGradient
        colors={COLORS.gradientPurple as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>✏️ 记一笔</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 模式切换 */}
          <View style={styles.modeSwitch}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'smart' && styles.modeBtnActive]}
              onPress={() => setMode('smart')}
            >
              <Text style={[styles.modeBtnText, mode === 'smart' && styles.modeBtnTextActive]}>
                🤖 智能录入
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
              onPress={() => setMode('manual')}
            >
              <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>
                ✍️ 手动录入
              </Text>
            </TouchableOpacity>
          </View>

          {/* 智能录入模式 */}
          {mode === 'smart' && (
            <View style={styles.smartCard}>
              <Text style={styles.cardTitle}>说一句话，AI 帮你记账</Text>
              <TextInput
                style={styles.smartInput}
                placeholder="例如：今天午饭花了35块"
                placeholderTextColor={COLORS.textLight}
                value={inputText}
                onChangeText={setInputText}
                multiline
                returnKeyType="done"
              />

              {/* 快捷短语 */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
                {quickPhrases.map((phrase, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.quickChip}
                    onPress={() => setInputText(phrase)}
                  >
                    <Text style={styles.quickChipText}>{phrase}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity onPress={handleParse} disabled={parsing}>
                <LinearGradient
                  colors={COLORS.gradientPurple as any}
                  style={styles.parseBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {parsing ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.parseBtnText}>🔍 智能解析</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* 解析结果卡片 */}
              {parseResult && (
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>✅ 解析结果</Text>
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>
                        置信度 {(parseResult.confidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>金额</Text>
                    <Text style={styles.resultValue}>¥{parseResult.amount}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>类别</Text>
                    <Text style={styles.resultValue}>
                      {parseResult.categoryIcon} {parseResult.category}
                    </Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>描述</Text>
                    <Text style={styles.resultValue}>{parseResult.description}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>类型</Text>
                    <Text style={[styles.resultValue, {
                      color: parseResult.type === 'expense' ? COLORS.expense : COLORS.income
                    }]}>
                      {parseResult.type === 'expense' ? '支出' : '收入'}
                    </Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>日期</Text>
                    <Text style={styles.resultValue}>{parseResult.date}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* 手动/确认表单 */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>
              {mode === 'smart' && parseResult ? '确认并保存' : '填写记账信息'}
            </Text>

            {/* 类型切换 */}
            <View style={styles.typeSwitch}>
              <TouchableOpacity
                style={[styles.typeBtn, recordType === 'expense' && styles.typeBtnExpense]}
                onPress={() => setRecordType('expense')}
              >
                <Text style={[styles.typeBtnText, recordType === 'expense' && styles.typeBtnTextActive]}>
                  支出
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, recordType === 'income' && styles.typeBtnIncome]}
                onPress={() => setRecordType('income')}
              >
                <Text style={[styles.typeBtnText, recordType === 'income' && styles.typeBtnTextActive]}>
                  收入
                </Text>
              </TouchableOpacity>
            </View>

            {/* 金额 */}
            <View style={styles.amountRow}>
              <Text style={styles.amountSymbol}>¥</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.textLight}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>

            {/* 类别选择 */}
            <Text style={styles.formLabel}>选择类别</Text>
            <View style={styles.categoryGrid}>
              {filteredCategories.map((cat: any) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === cat.id && { color: cat.color },
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 描述 */}
            <Text style={styles.formLabel}>备注</Text>
            <TextInput
              style={styles.descInput}
              placeholder="添加备注..."
              placeholderTextColor={COLORS.textLight}
              value={description}
              onChangeText={setDescription}
            />

            {/* 日期 */}
            <Text style={styles.formLabel}>日期</Text>
            <TextInput
              style={styles.descInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.textLight}
              value={date}
              onChangeText={setDate}
            />

            {/* 保存按钮 */}
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <LinearGradient
                colors={recordType === 'expense' ? ['#FF6B6B', '#E17055'] : COLORS.gradientGreen as any}
                style={styles.saveBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    💾 保存{recordType === 'expense' ? '支出' : '收入'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 4,
    marginTop: SPACING.md,
    ...SHADOW.sm,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderRadius: RADIUS.sm + 4,
  },
  modeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeBtnTextActive: {
    color: '#FFF',
  },
  smartCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOW.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  smartInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm + 4,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  quickRow: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  quickChip: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    marginRight: SPACING.sm,
  },
  quickChipText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  parseBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
  },
  parseBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: COLORS.accent + '10',
    borderRadius: RADIUS.sm + 4,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
  },
  confidenceBadge: {
    backgroundColor: COLORS.accent + '20',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  confidenceText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  resultLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    ...SHADOW.sm,
  },
  typeSwitch: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.sm + 4,
    backgroundColor: COLORS.background,
    marginHorizontal: 4,
  },
  typeBtnExpense: {
    backgroundColor: COLORS.expense + '15',
    borderWidth: 1.5,
    borderColor: COLORS.expense,
  },
  typeBtnIncome: {
    backgroundColor: COLORS.income + '15',
    borderWidth: 1.5,
    borderColor: COLORS.income,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeBtnTextActive: {
    color: COLORS.text,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm + 4,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  amountSymbol: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: SPACING.sm + 4,
    marginLeft: SPACING.sm,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm + 4,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 4,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  categoryChipIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  descInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm + 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  saveBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
