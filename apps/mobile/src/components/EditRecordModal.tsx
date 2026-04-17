import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';
import { useStore } from '../stores/useStore';
import { recordsAPI } from '../services/api';

interface Props {
  visible: boolean;
  record: any | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function EditRecordModal({ visible, record, onClose, onSaved }: Props) {
  const { categories, fetchCategories, fetchRecords, fetchSummary } = useStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [recordType, setRecordType] = useState<'expense' | 'income'>('expense');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, []);

  // 每次打开新记录时，用该记录的值初始化表单
  useEffect(() => {
    if (record) {
      setAmount(String(record.amount ?? ''));
      setDescription(record.description ?? '');
      setSelectedCategory(record.category_id ?? '');
      setRecordType(record.type === 'income' ? 'income' : 'expense');
      setDate(record.date ?? new Date().toISOString().split('T')[0]);
    }
  }, [record?.id]);

  const filteredCategories = categories.filter((c: any) => c.type === recordType);

  const confirm = (title: string, message: string, onOk: () => void) => {
    // react-native-web 上 Alert.alert 不显示按钮，用 window.confirm 兜底
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`${title}\n\n${message}`)) onOk();
      return;
    }
    Alert.alert(title, message, [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: onOk },
    ]);
  };

  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const handleSave = async () => {
    const finalAmount = parseFloat(amount);
    if (!finalAmount || finalAmount <= 0) {
      notify('提示', '请输入有效金额');
      return;
    }
    if (!selectedCategory) {
      notify('提示', '请选择类别');
      return;
    }
    if (!record?.id) return;

    setSaving(true);
    try {
      await recordsAPI.update(record.id, {
        amount: finalAmount,
        type: recordType,
        categoryId: selectedCategory,
        description,
        date,
      });
      await Promise.all([fetchRecords({ limit: 20 }), fetchSummary()]);
      onSaved?.();
      onClose();
    } catch (error: any) {
      notify('保存失败', error.message || '请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!record?.id) return;
    confirm('删除确认', '确定要删除这条记录吗？此操作不可恢复。', async () => {
      setDeleting(true);
      try {
        await recordsAPI.delete(record.id);
        await Promise.all([fetchRecords({ limit: 20 }), fetchSummary()]);
        onSaved?.();
        onClose();
      } catch (error: any) {
        notify('删除失败', error.message || '请重试');
      } finally {
        setDeleting(false);
      }
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            {/* 头部 */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>✏️ 编辑账单</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
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
                      selectedCategory === cat.id && {
                        backgroundColor: cat.color + '20',
                        borderColor: cat.color,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === cat.id && { color: cat.color },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 描述 */}
              <Text style={styles.formLabel}>备注</Text>
              <TextInput
                style={styles.input}
                placeholder="添加备注..."
                placeholderTextColor={COLORS.textLight}
                value={description}
                onChangeText={setDescription}
              />

              {/* 日期 */}
              <Text style={styles.formLabel}>日期</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textLight}
                value={date}
                onChangeText={setDate}
              />

              {/* 按钮区 */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDelete}
                  disabled={deleting || saving}
                >
                  {deleting ? (
                    <ActivityIndicator color={COLORS.expense} />
                  ) : (
                    <Text style={styles.deleteBtnText}>🗑 删除</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving || deleting}
                  style={{ flex: 1, marginLeft: SPACING.sm }}
                >
                  <LinearGradient
                    colors={
                      recordType === 'expense'
                        ? (['#FF6B6B', '#E17055'] as any)
                        : (COLORS.gradientGreen as any)
                    }
                    style={styles.saveBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.saveBtnText}>💾 保存修改</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={{ height: SPACING.lg }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    maxHeight: '92%',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    ...SHADOW.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  closeText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  body: {},
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
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeBtnExpense: {
    backgroundColor: COLORS.expense + '15',
    borderColor: COLORS.expense,
  },
  typeBtnIncome: {
    backgroundColor: COLORS.income + '15',
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
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm + 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  deleteBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.expense + '60',
    backgroundColor: COLORS.expense + '10',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },
  deleteBtnText: {
    color: COLORS.expense,
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
