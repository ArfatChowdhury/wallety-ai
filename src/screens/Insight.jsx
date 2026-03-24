import { FlatList, StyleSheet, Text, View, StatusBar } from 'react-native'
import React, { useContext, useMemo } from 'react'
import { PieChart } from 'react-native-gifted-charts'
import { AppContext } from '../Contex/ContextApi'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SHADOW } from '../theme'
import RenderInsightitem from '../components/RenderInsightitem'
import { BannerAdComponent, NativeAdComponent, insertAdsIntoBudgetList } from '../services/AdService'

const Insight = () => {
  const { filteredExpenses, expenses, totalSpent, totalIncome, balance, categoriesList, currencySymbol } = useContext(AppContext)
  const [selectedCategory, setSelectedCategory] = React.useState(null)
  const allExpenses = filteredExpenses?.length > 0 ? filteredExpenses : expenses

  if (totalSpent === 0 || expenses.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Insights are empty</Text>
          <Text style={styles.emptySub}>Add some transactions to see your breakdown</Text>
        </View>
      </SafeAreaView>
    )
  }

  const spendingByCategory = allExpenses.reduce((acc, expense) => {
    const categoryName = expense.category?.name || 'Other';
    const amount = Number(expense.amount) || 0;
    acc[categoryName] = (acc[categoryName] || 0) + amount;
    return acc;
  }, {});

  const periodTotal = Object.values(spendingByCategory).reduce((sum, val) => sum + val, 0)

  const chartData = Object.keys(spendingByCategory).map((categoryName) => {
    const amount = spendingByCategory[categoryName]
    const percentage = Math.round((amount / (periodTotal || 1)) * 100)
    const categoryInfo = categoriesList.find((cat) => cat.name === categoryName)
    return {
      value: percentage,
      color: categoryInfo?.color || COLORS.gray400,
      text: `${percentage}%`,
      label: categoryName
    }
  })

  const flatListData = Object.keys(spendingByCategory).map((categoryName) => {
    const amount = spendingByCategory[categoryName]
    const categoryInfo = categoriesList.find((cat) => cat.name === categoryName)
    return {
      id: categoryName,
      category: {
        name: categoryName,
        color: categoryInfo?.color || COLORS.gray400
      },
      amount
    }
  }).sort((a, b) => b.amount - a.amount)

  const insightListWithAds = insertAdsIntoBudgetList(flatListData)

  const ListHeader = useMemo(() => {
    return (
      <View style={styles.header}>
        <Text style={styles.title}>History & Insights</Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.income }]}>
            <Ionicons name="trending-up" size={16} color="white" />
            <Text style={styles.summaryValue}>{currencySymbol}{totalIncome.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Income</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.expense }]}>
            <Ionicons name="trending-down" size={16} color="white" />
            <Text style={styles.summaryValue}>{currencySymbol}{totalSpent.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Spent</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.card }]}>
            <Ionicons name="wallet" size={16} color="white" />
            <Text style={styles.summaryValue}>{currencySymbol}{Math.abs(balance).toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Balance</Text>
          </View>
        </View>

        <View style={styles.chartWrapper}>
          <PieChart
            donut
            isAnimated={false}
            animationDuration={1000}
            data={chartData}
            radius={110}
            innerRadius={80}
            focusOnPress
            onPress={(item) => setSelectedCategory(item.label === selectedCategory ? null : item.label)}
            centerLabelComponent={() => (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.chartTotal}>
                  {currencySymbol}{selectedCategory
                    ? spendingByCategory[selectedCategory]?.toFixed(0)
                    : periodTotal.toFixed(0)}
                </Text>
                <Text style={styles.chartLabel}>{selectedCategory || 'Total'}</Text>
              </View>
            )}
          />
        </View>

        <Text style={styles.sectionTitle}>Category Breakdown</Text>
      </View>
    )
  }, [currencySymbol, totalIncome, totalSpent, balance, chartData, selectedCategory, spendingByCategory, periodTotal]);

  const filteredFlatData = selectedCategory
    ? flatListData.filter(item => item.id === selectedCategory)
    : flatListData

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <FlatList
          data={selectedCategory ? filteredFlatData : insightListWithAds}
          keyExtractor={(item, index) => item.id || `ad_${index}`}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => {
            if (item.type === 'AD') {
              return (
                <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
                  <BannerAdComponent />
                </View>
              );
            }
            return <RenderInsightitem item={item} />;
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
        
        {/* Banner Ad at bottom - shifted up to avoid floating tabbar */}
        <View style={{ backgroundColor: COLORS.background, marginBottom: 110 }}>
          <BannerAdComponent />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingBottom: 120 },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textMain, marginBottom: 20 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    ...SHADOW.sm,
  },
  summaryValue: { color: 'white', fontSize: 18, fontWeight: '800', marginTop: 8 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600', marginTop: 2 },

  chartWrapper: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 30,
    ...SHADOW.sm,
  },
  chartTotal: { fontSize: 24, fontWeight: '900', color: COLORS.textMain },
  chartLabel: { fontSize: 12, color: COLORS.textSub, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain, marginBottom: 15 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textMain },
  emptySub: { fontSize: 14, color: COLORS.textSub, marginTop: 4, textAlign: 'center' },
})

export default Insight
