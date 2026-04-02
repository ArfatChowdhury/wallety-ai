import { FlatList, StyleSheet, Text, View, StatusBar, TouchableOpacity } from 'react-native'
import React, { useContext, useMemo } from 'react'
import { PieChart } from 'react-native-gifted-charts'
import { AppContext } from '../Contex/ContextApi'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SHADOW } from '../theme'
import RenderInsightitem from '../components/RenderInsightitem'
import { BannerAdComponent, NativeAdComponent, insertAdsIntoBudgetList, AdService } from '../services/AdService'
import { getSmartForecastData } from '../services/SmartNotificationService'
import AsyncStorage from '@react-native-async-storage/async-storage'

const Insight = () => {
  const { filteredExpenses, expenses, totalSpent, totalIncome, balance, categoriesList, currencySymbol, monthlyExpenses, categoriesWithBudget, prevMonthSummary } = useContext(AppContext)
  const [selectedCategory, setSelectedCategory] = React.useState(null)
  const [viewMode, setViewMode] = React.useState('trends') // 'trends' or 'forecast'
  const allExpenses = filteredExpenses?.length > 0 ? filteredExpenses : expenses

  const forecastData = useMemo(() => {
    return getSmartForecastData({
      totalIncome,
      totalSpent,
      monthlyExpenses: expenses, // Use all expenses for forecast
      categoriesWithBudget,
      prevMonthSummary
    });
  }, [totalIncome, totalSpent, expenses, categoriesWithBudget, prevMonthSummary]);

  const spendingByCategory = useMemo(() => {
    return (filteredExpenses?.length > 0 ? filteredExpenses : expenses).reduce((acc, expense) => {
      const categoryName = expense.category?.name || 'Other';
      const amount = Number(expense.amount) || 0;
      acc[categoryName] = (acc[categoryName] || 0) + amount;
      return acc;
    }, {});
  }, [filteredExpenses, expenses]);

  const periodTotal = useMemo(() => {
    return Object.values(spendingByCategory).reduce((sum, val) => sum + val, 0);
  }, [spendingByCategory]);

  const chartData = useMemo(() => {
    return Object.keys(spendingByCategory).map((categoryName) => {
      const amount = spendingByCategory[categoryName]
      const percentage = Math.round((amount / (periodTotal || 1)) * 100)
      const categoryInfo = categoriesList.find((cat) => cat.name === categoryName)
      return {
        value: percentage,
        color: categoryInfo?.color || COLORS.gray400,
        text: `${percentage}%`,
        label: categoryName
      }
    });
  }, [spendingByCategory, periodTotal, categoriesList]);

  const flatListData = useMemo(() => {
    return Object.keys(spendingByCategory).map((categoryName) => {
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
    }).sort((a, b) => b.amount - a.amount);
  }, [spendingByCategory, categoriesList]);

  const insightListWithAds = useMemo(() => insertAdsIntoBudgetList(flatListData), [flatListData]);

  const handleToggleForecast = async (mode) => {
    if (mode === 'forecast' && viewMode !== 'forecast') {
      const hasSeenAd = await AsyncStorage.getItem('hasSeenAiForecastAd');
      if (!hasSeenAd) {
        const adShown = await AdService.showAiInsightsAd();
        if (adShown) {
          await AsyncStorage.setItem('hasSeenAiForecastAd', 'true');
        }
      }
    }
    setViewMode(mode);
  };

  const ListHeader = useMemo(() => {
    if (totalSpent === 0 || expenses.length === 0) return null;
    return (
      <View style={styles.header}>
        <Text style={styles.title}>History & Insights</Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'trends' && styles.toggleBtnActive]}
            onPress={() => handleToggleForecast('trends')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="stats-chart" size={14} color={viewMode === 'trends' ? 'white' : COLORS.textSub} style={{ marginRight: 6 }} />
              <Text style={[styles.toggleText, viewMode === 'trends' && styles.toggleTextActive]}>Trends</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'forecast' && styles.toggleBtnActive]}
            onPress={() => handleToggleForecast('forecast')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="sparkles" size={14} color={viewMode === 'forecast' ? 'white' : COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.toggleText, viewMode === 'forecast' && styles.toggleTextActive]}>AI Forecast</Text>
            </View>
          </TouchableOpacity>
        </View>

        {viewMode === 'trends' ? (
          <>
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
          </>
        ) : (
          <View style={styles.forecastContainer}>
            <View style={[styles.forecastCard, { backgroundColor: forecastData.daysUntilDepletion < 7 && forecastData.isOverspending ? '#FEF2F2' : '#F0FDF4' }]}>
              <View style={styles.forecastHeader}>
                <Text style={styles.forecastTitle}>Cash Runway</Text>
                <Ionicons
                  name={forecastData.daysUntilDepletion < 7 && forecastData.isOverspending ? "alert-circle" : "checkmark-circle"}
                  size={24}
                  color={forecastData.daysUntilDepletion < 7 && forecastData.isOverspending ? '#EF4444' : '#22C55E'}
                />
              </View>
              <Text style={styles.runwayValue}>
                {forecastData.isOverspending
                  ? forecastData.daysUntilDepletion > 0
                    ? `${forecastData.daysUntilDepletion} Days Left`
                    : 'Funds Depleted'
                  : 'Budget is Safe'}
              </Text>
              <Text style={styles.runwaySub}>
                {forecastData.isOverspending
                  ? `Based on your burn rate of ${currencySymbol}${forecastData.dailyBurnRate.toFixed(0)}/day`
                  : `You are currently spending well within your income!`}
              </Text>
            </View>

            <View style={{ marginVertical: 10 }}>
              <BannerAdComponent />
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Safe Daily Spend</Text>
                <Text style={styles.statValue}>{currencySymbol}{forecastData.safeDailySpend.toFixed(0)}</Text>
                <Text style={styles.statInsight}>to last the month</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Projected Total</Text>
                <Text style={styles.statValue}>{currencySymbol}{forecastData.projectedTotal.toFixed(0)}</Text>
                <Text style={styles.statInsight}>Estimated end of month</Text>
              </View>
            </View>

            {forecastData.spendingFasterThanLastMonth && (
              <View style={styles.warningBox}>
                <Ionicons name="trending-up" size={20} color="#B45309" />
                <Text style={styles.warningText}>
                  You're spending faster than last month. Consider reviewing your "Other" expenses.
                </Text>
              </View>
            )}

            <View style={styles.aiInsightCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="bulb" size={20} color={COLORS.primary} />
                <Text style={styles.aiInsightTitle}>AI Recommendation</Text>
              </View>
              <Text style={styles.aiInsightText}>
                {forecastData.isOverspending
                  ? `If you reduce your daily spending by ${currencySymbol}${(forecastData.dailyBurnRate * 0.2).toFixed(0)}, your funds will last an additional ${Math.round(forecastData.daysUntilDepletion * 0.25)} days.`
                  : "You're doing great! This is a perfect time to take 10% of your current balance and put it into a high-yield savings account."}
              </Text>
            </View>
          </View>
        )}
      </View>
    )
  }, [currencySymbol, totalIncome, totalSpent, balance, chartData, selectedCategory, spendingByCategory, periodTotal, viewMode, forecastData]);

  const filteredFlatData = selectedCategory
    ? flatListData.filter(item => item.id === selectedCategory)
    : flatListData

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
            return <RenderInsightitem item={item} total={periodTotal} />;
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Banner Ad at bottom - shifted up to avoid floating tabbar */}
        {viewMode === 'trends' && (
          <View style={{ backgroundColor: COLORS.background, marginBottom: 110 }}>
            <BannerAdComponent />
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingBottom: 120 },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textMain, marginBottom: 15 },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 16,
    marginBottom: 25,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
    ...SHADOW.md,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSub,
  },
  toggleTextActive: {
    color: 'white',
  },

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

  forecastContainer: {
    paddingBottom: 20,
  },
  forecastCard: {
    padding: 24,
    borderRadius: 32,
    ...SHADOW.sm,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  forecastTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSub,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  runwayValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textMain,
    marginBottom: 8,
  },
  runwaySub: {
    fontSize: 13,
    color: COLORS.textSub,
    lineHeight: 18,
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSub,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  statInsight: {
    fontSize: 10,
    color: COLORS.textSub,
    marginTop: 2,
  },

  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 18,
  },

  aiInsightCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  aiInsightTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: 8,
  },
  aiInsightText: {
    fontSize: 14,
    color: COLORS.textMain,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textMain },
  emptySub: { fontSize: 14, color: COLORS.textSub, marginTop: 4, textAlign: 'center' },
})

export default Insight
