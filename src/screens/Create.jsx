import { Alert, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet, Animated } from 'react-native'
import React, { useContext, useEffect, useState, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, AntDesign } from '@expo/vector-icons'
import { AppContext } from '../Contex/ContextApi';
import { COLORS, SHADOW } from '../theme';
import AdService, { BannerAdComponent } from '../services/AdService';

const INCOME_SOURCES = [
  { name: 'Salary', icon: '💼' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Business', icon: '🏢' },
  { name: 'Investment', icon: '📈' },
  { name: 'Gift', icon: '🎁' },
  { name: 'Rental', icon: '🏠' },
  { name: 'Bonus', icon: '🎯' },
  { name: 'Other', icon: '💰' },
]

const Create = ({ navigation, route }) => {
  const [activeField, setActiveField] = useState(null);
  const [type, setType] = useState('expense'); // 'income' or 'expense'
  const [isSuggested, setIsSuggested] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const scannedPulse = useRef(new Animated.Value(1)).current;

  const {
    handleAddTransaction, category, setCategory,
    title, setTitle, amount, setAmount,
    editingId, setEditingId, editingType, handleUpdateTransaction, getCategorySuggestion,
    currencySymbol, getLocalDate
  } = useContext(AppContext)

  const isEditing = editingId !== null

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title or source');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (type === 'expense' && !category?.name) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const transactionData = {
      type,
      title: title.trim(),
      amount: parseFloat(amount),
      category: type === 'expense' ? category : { name: title.trim(), icon: '💰' },
      date: getLocalDate(),
    };

    if (isEditing) {
      handleUpdateTransaction(navigation, transactionData);
    } else {
      handleAddTransaction(navigation, transactionData);
    }
  }

  const handleSelectIncomeSource = (src) => {
    setTitle(src.name);
  }

  // When returning from Scanner with pre-filled data
  useEffect(() => {
    if (route.params?.fromScanner) {
      setIsScanned(true);
      // Pulse badge
      Animated.sequence([
        Animated.timing(scannedPulse, { toValue: 1.1, duration: 150, useNativeDriver: true }),
        Animated.timing(scannedPulse, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setIsScanned(false), 3000);
    }
  }, [route.params?.fromScanner]);

  useEffect(() => {
    if (route.params?.itemCat) {
      setCategory(route.params.itemCat);
      setIsSuggested(false);
    }
  }, [route.params?.itemCat])

  useEffect(() => {
    if (editingId && editingType) {
      setType(editingType);
    }
  }, [editingId, editingType]);

  useEffect(() => {
    if (type === 'expense' && !isEditing) {
      if (!title) {
        // If the user clears the title, only clear the category if it was auto-suggested
        if (isSuggested) {
          setCategory({});
          setIsSuggested(false);
        }
      } else {
        // Evaluate suggestion whenever title changes
        // Only run if user hasn't manually selected a category (isSuggested is true, or category is completely empty)
        if (!category?.name || isSuggested) {
          const suggestion = getCategorySuggestion(title);
          if (suggestion) {
            // Update to the new suggestion
            setCategory(suggestion);
            setIsSuggested(true);
          } else if (isSuggested) {
            // If there's no longer a suggestion for the new text, revert back to empty
            setCategory({});
            setIsSuggested(false);
          }
        }
      }
    }
  }, [title, type, isEditing]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle} maxFontSizeMultiplier={1.3}>
              {isEditing ? 'Edit Transaction' : 'New Transaction'}
            </Text>
            {isScanned && (
              <Animated.View style={[styles.scannedBadge, { transform: [{ scale: scannedPulse }] }]}>
                <AntDesign name="scan" size={10} color="#16a34a" />
                <Text style={styles.scannedBadgeText} maxFontSizeMultiplier={1.3}>Scanned ✓</Text>
              </Animated.View>
            )}
          </View>
          {/* Scan button */}
          <TouchableOpacity
            onPress={async () => {
              await AdService.showReceiptScanAd();
              navigation.navigate('Scanner');
            }}
            style={styles.scanBtn}
            activeOpacity={0.8}
          >
            <AntDesign name="scan" size={22} color={COLORS.textMain} />
          </TouchableOpacity>
        </View>

        {/* Type Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            onPress={() => setType('expense')}
            style={[styles.toggleBtn, type === 'expense' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, type === 'expense' && styles.toggleTextActive]} maxFontSizeMultiplier={1.3}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setType('income')}
            style={[styles.toggleBtn, type === 'income' && styles.toggleBtnActiveIncome]}
          >
            <Text style={[styles.toggleText, type === 'income' && styles.toggleTextActive]} maxFontSizeMultiplier={1.3}>Income</Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>Amount</Text>
          <View style={[styles.amountInputWrap, activeField === 'amount' && styles.inputActive]}>
            <Text style={styles.currency} maxFontSizeMultiplier={1.3}>{currencySymbol}</Text>
            <TextInput
              placeholder="0.00"
              style={styles.amountInput}
              onFocus={() => setActiveField('amount')}
              onBlur={() => setActiveField(null)}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(val) => {
                // Bug fix: Allow only valid decimal input, prevent scientific notation, cap at 999,999,999
                if (val === '' || val === '.') { setAmount(val); return; }
                const num = parseFloat(val);
                if (!isNaN(num) && num <= 999999999) setAmount(val);
              }}
              maxLength={12}
              placeholderTextColor={COLORS.gray400}
            />
          </View>
        </View>

        {/* Title / Source Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label} maxFontSizeMultiplier={1.3}>{type === 'expense' ? 'Title' : 'Source Name'}</Text>
          <TextInput
            placeholder={type === 'expense' ? "e.g. Grocery Shopping" : "e.g. Monthly Salary"}
            style={[styles.input, activeField === 'title' && styles.inputActive]}
            onFocus={() => setActiveField('title')}
            onBlur={() => setActiveField(null)}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={COLORS.gray400}
          />
        </View>

        {/* Dynamic Section: Category for Expense, Quick Sources for Income */}
        {type === 'expense' ? (
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label} maxFontSizeMultiplier={1.3}>Category</Text>
              {isSuggested && (
                <View style={styles.suggestedBadge}>
                  <Text style={styles.suggestedText} maxFontSizeMultiplier={1.3}>✨ Auto-suggested</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => { setIsSuggested(false); navigation.navigate('Category'); }}
              style={[styles.input, !category?.name && styles.inputError]}
            >
              <View style={styles.categoryRow}>
                <View style={styles.catInfo}>
                  <Text style={styles.catIcon} maxFontSizeMultiplier={1.3}>{category?.icon || '📁'}</Text>
                  <Text style={[styles.catName, !category?.name && { color: COLORS.gray400 }]} maxFontSizeMultiplier={1.3}>
                    {category?.name || 'Select Category'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray400} />
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>Quick Select Source</Text>
            <View style={styles.sourceGrid}>
              {INCOME_SOURCES.map(src => (
                <TouchableOpacity
                  key={src.name}
                  onPress={() => handleSelectIncomeSource(src)}
                  style={[
                    styles.sourceChip,
                    title === src.name ? styles.sourceChipActive : styles.sourceChipInactive
                  ]}
                >
                  <Text style={styles.sourceEmoji} maxFontSizeMultiplier={1.3}>{src.icon}</Text>
                  <Text style={[styles.sourceLabel, title === src.name && styles.sourceLabelActive]} maxFontSizeMultiplier={1.3}>{src.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitBtn, { backgroundColor: type === 'expense' ? COLORS.black : COLORS.income }]}
          activeOpacity={0.8}
        >
          <Text style={styles.submitText} maxFontSizeMultiplier={1.3}>
            {isEditing ? 'Update Transaction' : `Add ${type === 'expense' ? 'Expense' : 'Income'}`}
          </Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity
            onPress={() => { setEditingId(null); navigation.goBack(); }}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
        
        {/* Banner Ad at bottom */}
        <View style={{ backgroundColor: COLORS.background, marginHorizontal: -20, paddingHorizontal: 20 }}>
          <BannerAdComponent />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingHorizontal: 20, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scanBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain, letterSpacing: -0.5 },
  scannedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0', marginTop: 3,
  },
  scannedBadgeText: { fontSize: 10, fontWeight: '700', color: '#16a34a' },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: 20,
    padding: 5,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  toggleBtnActive: { backgroundColor: COLORS.black, ...SHADOW.sm },
  toggleBtnActiveIncome: { backgroundColor: COLORS.income, ...SHADOW.sm },
  toggleText: { fontSize: 14, fontWeight: '800', color: COLORS.textSub },
  toggleTextActive: { color: COLORS.white },

  inputGroup: { marginBottom: 22 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '800', color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 1 },

  suggestedBadge: { backgroundColor: COLORS.income + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: COLORS.income + '30' },
  suggestedText: { fontSize: 11, fontWeight: '700', color: COLORS.income },

  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
    ...SHADOW.sm,
  },
  inputActive: { borderColor: COLORS.black, ...SHADOW.md },
  inputError: { borderColor: '#FEE2E2' },

  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    ...SHADOW.sm,
  },
  currency: { fontSize: 22, fontWeight: '900', marginRight: 8, color: COLORS.black },
  amountInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.black,
  },

  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catInfo: { flexDirection: 'row', alignItems: 'center' },
  catIcon: { fontSize: 28, marginRight: 14 },
  catName: { fontSize: 18, fontWeight: '700', color: COLORS.textMain },

  sourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: COLORS.white,
  },
  sourceChipActive: { backgroundColor: COLORS.income, borderColor: COLORS.income, ...SHADOW.sm },
  sourceChipInactive: { borderColor: COLORS.border, backgroundColor: COLORS.white },
  sourceEmoji: { fontSize: 18, marginRight: 8 },
  sourceLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSub },
  sourceLabelActive: { color: COLORS.white },

  submitBtn: {
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 10,
    ...SHADOW.md,
  },
  submitText: { color: COLORS.white, fontSize: 18, fontWeight: '900' },

  cancelBtn: { paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  cancelText: { color: COLORS.textSub, fontSize: 16, fontWeight: '700' },
})

export default Create
