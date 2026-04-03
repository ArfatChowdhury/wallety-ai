import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, StatusBar, ImageBackground, Modal, ScrollView as RNScrollView, Image, TextInput, KeyboardAvoidingView, Platform, RefreshControl, Animated, Dimensions } from 'react-native'
import React, { useContext, useMemo, useCallback, useState, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons, AntDesign } from '@expo/vector-icons'
import { AppContext } from '../Contex/ContextApi'
import { COLORS, SHADOW } from '../theme'
import ExpenseItemCard from '../components/ExpenseItemCard'
import EmptyList from '../components/EmptyList'
import DateFilterBar from '../components/DateFilterBar'
import tailwind from 'twrnc'
import { auth } from '../services/firebase'
import { scheduleCustomReminder, getActiveReminders, cancelReminder } from '../services/NotificationService'
import DateTimePicker from '@react-native-community/datetimepicker'
import { BannerAdComponent, NativeAdComponent, insertAdsIntoTransactionList, AdService } from '../services/AdService'
import SpotlightTour from '../components/SpotlightTour'

const HomeListHeader = React.memo(({
  navigation, auth, COLORS, SHADOW, tailwind, Ionicons, AntDesign,
  overBudgetCategories, isBudgetWarningDismissed, setIsBudgetWarningDismissed,
  monthlySummary, hasSeenPreClosingThisMonth, setHasSeenPreClosingThisMonth, getYearMonth,
  hasDismissedSummaryBanner, setHasDismissedSummaryBanner, setShowSummaryModal,
  logAppNotification, scanBtnRef, alarmBtnRef, balanceCardRef, transactionsTitleRef,
  setShowNotifications, selectedPeriod, selectedMonth, prevMonthSummary,
  displayTotals, currencySymbol, totalSpent, balance, setShowMonthPicker,
  handlePeriodSelect
}) => {
  const BudgetWarningBanner = () => {
    if (overBudgetCategories.length === 0 || isBudgetWarningDismissed) return null
    return (
      <View style={styles.warningBanner}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Budget')}
          style={tailwind`flex-row items-center flex-1`}
          activeOpacity={0.9}
        >
          <View style={styles.warningIconBox}>
            <Ionicons name="warning" size={24} color="#FFF" />
          </View>
          <View style={styles.warningTextContent}>
            <Text style={styles.warningTitle}>Budget Alert</Text>
            <Text style={styles.warningDesc}>
              You have exceeded your limit in {overBudgetCategories.length} {overBudgetCategories.length === 1 ? 'category' : 'categories'}.
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsBudgetWarningDismissed(true)}
          style={tailwind`p-2`}
        >
          <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
    )
  }

  const MonthlySummaryBanner = () => {
    if (!monthlySummary.isClosingTime) return null

    // Pre-Closing Info Banner (Last 3 days but not the last day)
    if (monthlySummary.isPreClosing) {
      if (hasSeenPreClosingThisMonth) return null
      return (
        <View style={styles.preClosingBanner}>
          <View style={styles.warningIconBox}>
            <Ionicons name="time" size={24} color="#FFF" />
          </View>
          <View style={styles.warningTextContent}>
            <Text style={styles.warningTitle}>Month Closing Soon</Text>
            <Text style={styles.warningDesc}>
              A new month starts soon! Recurring items will be added automatically.
            </Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              const currentMonth = getYearMonth();
              await AsyncStorage.setItem('preClosingSeenMonth', currentMonth);
              setHasSeenPreClosingThisMonth(true);
            }}
            style={tailwind`p-2`}
          >
            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      )
    }

    // actual Closing Day Banner - ONLY SHOW ON LAST DAY
    if (!monthlySummary.isLastDay || hasDismissedSummaryBanner) return null
    const isSavings = monthlySummary.savings > 0;
    const bannerStyle = isSavings ? styles.closingBannerSuccess : styles.closingBannerWarning;
    const iconName = isSavings ? 'trophy' : 'stats-chart';

    return (
      <View style={bannerStyle}>
        <TouchableOpacity
          style={tailwind`flex-row items-center flex-1`}
          activeOpacity={0.8}
          onPress={() => setShowSummaryModal(true)}
        >
          <View style={styles.warningIconBox}>
            <Ionicons name={iconName} size={24} color="#FFF" />
          </View>
          <View style={styles.warningTextContent}>
            <Text style={styles.warningTitle}>
              {isSavings ? 'Monthly Savings!' : 'Monthly Close'}
            </Text>
            <Text style={styles.warningDesc}>
              {isSavings
                ? `Great job! Click to see how much you saved.`
                : `Monthly summary is ready. You've spent slightly more.`}
            </Text>
            <Text style={styles.insightText}>
              Click to see your full summary
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            const currentMonth = getYearMonth();
            await AsyncStorage.setItem('summaryBannerDismissedMonth', currentMonth);
            setHasDismissedSummaryBanner(true);
            logAppNotification("📊 Monthly Summary Ready!", "Your final results for this month are in! Tap to see how you did.", "info");
          }}
          style={tailwind`p-2`}
        >
          <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.headerContainer}>
      {/* Header Top */}
      <View style={styles.topBar}>
        <View style={tailwind`flex-row items-center gap-3`}>
          {auth.currentUser?.photoURL ? (
            <Image source={{ uri: auth.currentUser.photoURL }} style={styles.profilePic} />
          ) : (
            <View style={[styles.profilePic, { backgroundColor: COLORS.black, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '900' }}>
                {(auth.currentUser?.displayName || 'P').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.greeting}>Hi, {auth.currentUser?.displayName?.split(" ").pop() || "User"} 👋</Text>
            <Text style={styles.subGreeting}>Welcome back!</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            ref={scanBtnRef}
            style={styles.iconBtn}
            onPress={async () => {
              await AdService.showReceiptScanAd();
              navigation.navigate('Scanner');
            }}
            onLayout={() => { }}
          >
            <AntDesign name="scan" size={22} color={COLORS.textMain} />
          </TouchableOpacity>

          <TouchableOpacity
            ref={alarmBtnRef}
            style={styles.iconBtn}
            onPress={() => setShowNotifications(true)}
            onLayout={() => { }}
          >
            <Ionicons name="alarm-outline" size={22} color={COLORS.textMain} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Card Section */}
      <View
        ref={balanceCardRef}
        style={{ borderRadius: 32, overflow: 'hidden', marginBottom: 30 }}
      >
        <ImageBackground
          source={require('../../assets/card-bg.jpg')}
          style={[
            styles.balanceCard,
            { marginBottom: 0, borderRadius: 16 },
            monthlySummary.isDebt && { borderColor: COLORS.expense, borderExtraWidth: 2 }
          ]}
          imageStyle={{ borderRadius: 16 }}
        >
          <View style={styles.cardOverlay} />
          <View style={tailwind`w-full flex-row justify-between items-center`}>
            <Text style={styles.balanceLabel}>
              {selectedPeriod === 'all' ? 'Spent so far' : `${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Spending`}
            </Text>
            {prevMonthSummary && selectedPeriod === 'month' && (
              <View style={styles.comparisonBadge}>
                <Ionicons
                  name={displayTotals.spent > prevMonthSummary.totalSpent ? "trending-up" : "trending-down"}
                  size={12}
                  color={displayTotals.spent > prevMonthSummary.totalSpent ? COLORS.expense : COLORS.income}
                />
                <Text style={[styles.comparisonText, { color: displayTotals.spent > prevMonthSummary.totalSpent ? COLORS.expense : COLORS.income }]}>
                  {Math.abs(((displayTotals.spent - prevMonthSummary.totalSpent) / (prevMonthSummary.totalSpent || 1)) * 100).toFixed(0)}% vs last
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.balanceAmount}>{currencySymbol}{Number(displayTotals.spent).toFixed(2)}</Text>

          {/* Budget Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[
                styles.progressBarFill,
                {
                  width: `${Math.min((totalSpent / (totalSpent + balance > 0 ? (totalSpent + balance) : 1)) * 100, 100)}%`,
                  backgroundColor:
                    (totalSpent / (totalSpent + balance > 0 ? (totalSpent + balance) : 1)) > 0.85 ? COLORS.expense :
                      (totalSpent / (totalSpent + balance > 0 ? (totalSpent + balance) : 1)) > 0.5 ? '#EAB308' : COLORS.income
                }
              ]} />
            </View>
            <View style={tailwind`flex-row justify-between mt-1`}>
              <Text style={styles.progressLabel}>Income Used</Text>
              <Text style={styles.progressValue}>
                {totalSpent + balance > 0
                  ? `${Math.round((totalSpent / (totalSpent + balance)) * 100)}%`
                  : '0%'}
              </Text>
            </View>
          </View>

          <View style={[styles.balanceFooter, { justifyContent: 'space-between', flexDirection: 'row', width: '100%' }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.footerLabel} numberOfLines={1}>Total Income</Text>
              <Text style={styles.footerAmount} numberOfLines={1}>
                {currencySymbol}{Number(displayTotals.income || 0).toFixed(2)}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end', paddingLeft: 10 }}>
              <Text style={styles.footerLabel} numberOfLines={1}>Balance Left</Text>
              <Text style={[
                styles.footerAmount,
                monthlySummary.isDebt && { color: COLORS.expense }
              ]} numberOfLines={1}>
                {currencySymbol}{Number(displayTotals.balance).toFixed(2)}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Budget Warning Banner */}
      <BudgetWarningBanner />

      {/* Monthly Closing Summary */}
      <MonthlySummaryBanner />

      <DateFilterBar
        selectedPeriod={selectedPeriod}
        onSelect={handlePeriodSelect}
      />

      {selectedPeriod === 'calendar' && (
        <View style={styles.calendarFilterInfo}>
          <Ionicons name="calendar" size={16} color={COLORS.textSub} />
          <Text style={styles.calendarFilterText}>
            Showing: {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => setShowMonthPicker(true)}>
            <Text style={styles.changeMonthBtn}>Change</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text
        ref={transactionsTitleRef}
        style={styles.sectionTitle}
      >
        Recent Transactions
      </Text>
    </View>
  )
});

const { width: W, height: H } = Dimensions.get('window');

const Home = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const BOTTOM_AD_MARGIN = 20 + 70 + 8;

  const {
    totalSpent, balance, expenses, allTransactions, handleEdit, handleDelete,
    handleDeleteIncome, categoriesWithBudget, currencySymbol, monthlySummary, appNotifications, logAppNotification,
    prevMonthSummary, checkAndResetMonth, getLocalDate, getYearMonth, refreshData, isSetupComplete,
    tabLayouts, showGlobalAlert, isPremium
  } = useContext(AppContext)

  const [selectedPeriod, setSelectedPeriod] = React.useState('month')
  const [showMonthPicker, setShowMonthPicker] = React.useState(false)
  const [showSummaryModal, setShowSummaryModal] = React.useState(false)
  const [selectedMonth, setSelectedMonth] = React.useState(getYearMonth()) // YYYY-MM
  const [isBudgetWarningDismissed, setIsBudgetWarningDismissed] = React.useState(false)
  const [hasDismissedSummaryBanner, setHasDismissedSummaryBanner] = React.useState(false)
  const [hasSeenPreClosingThisMonth, setHasSeenPreClosingThisMonth] = React.useState(false)
  const [showNotifications, setShowNotifications] = React.useState(false)
  const [reminderMsg, setReminderMsg] = React.useState('')

  // Custom Reminders States
  const [activeReminders, setActiveReminders] = React.useState([])
  const [reminderDate, setReminderDate] = React.useState(new Date())
  const [showPicker, setShowPicker] = React.useState(false)
  const [pickerMode, setPickerMode] = React.useState('date')
  const [isAlarm, setIsAlarm] = React.useState(false)

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const [tourStep, setTourStep] = React.useState(-1); // -1 = inactive, 0-3 = steps
  const [tourSteps, setTourSteps] = React.useState([])

  const scanBtnRef = React.useRef()
  const alarmBtnRef = React.useRef()
  const balanceCardRef = React.useRef()
  const transactionsTitleRef = React.useRef()

  const measureRef = (ref) => {
    return new Promise((resolve) => {
      if (!ref.current) return resolve({ x: 0, y: 0, width: 0, height: 0 });
      ref.current.measure((fx, fy, width, height, px, py) => {
        if (px === undefined) resolve({ x: 0, y: 0, width: 0, height: 0 });
        else resolve({ x: px + width / 2, y: py + height / 2, width, height })
      })
    })
  }

  const fetchReminders = async () => {
    const reminders = await getActiveReminders()
    setActiveReminders(reminders)
  }

  React.useEffect(() => {
    if (showNotifications) {
      fetchReminders()
    }
  }, [showNotifications])

  // Banner & Popup seen status logic
  React.useEffect(() => {
    const checkSeenStatus = async () => {
      const currentMonth = getYearMonth();
      const [lastDismissedBanner, lastSeenPreClosing] = await Promise.all([
        AsyncStorage.getItem('summaryBannerDismissedMonth'),
        AsyncStorage.getItem('preClosingSeenMonth')
      ]);

      if (lastDismissedBanner === currentMonth) setHasDismissedSummaryBanner(true);
      if (lastSeenPreClosing === currentMonth) setHasSeenPreClosingThisMonth(true);
    };
    checkSeenStatus();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkAndResetMonth();

      const checkTour = async () => {
        const shouldStart = await AsyncStorage.getItem('shouldStartTour');
        const hasCompleted = await AsyncStorage.getItem('hasCompletedTour');
        if (shouldStart === 'true' && hasCompleted !== 'true') {
          await AsyncStorage.removeItem('shouldStartTour');

          setTimeout(async () => {
            const scan = await measureRef(scanBtnRef)
            const alarm = await measureRef(alarmBtnRef)
            const card = await measureRef(balanceCardRef)
            const list = await measureRef(transactionsTitleRef)

            if (!scan.x || !alarm.x || !card.x || !list.x) return; // Guard against empty measures

            setTourSteps([
              {
                x: scan.x, y: scan.y, r: 36,
                title: 'Smart Receipt Scanner',
                body: 'Snap a photo of any receipt! Our AI instantly extracts the amount, date, and category for you.',
              },
              {
                x: alarm.x, y: alarm.y, r: 36,
                title: 'Never Miss a Log',
                body: 'Set personalized reminders to stay on top of your daily expenses and monthly goals.',
              },
              {
                x: card.x, y: card.y, r: 120,
                title: 'Financial Snapshot',
                body: "Track your total spending vs. income at a glance. We'll even alert you if you're nearing your budget limit.",
              },
              {
                x: list.x, y: list.y, width: list.width, height: list.height,
                shape: 'rect',
                title: 'Full Transaction History',
                body: 'All your income and expenses organized in one place. Tap any entry to see details or make quick edits.',
              },
              {
                x: tabLayouts.Insight?.x || 100,
                y: tabLayouts.Insight?.y || H - 60,
                r: 36,
                title: 'Smart Analytics',
                body: 'Deep dive into your spending habits with interactive charts and weekly comparisons.',
              },
              {
                x: tabLayouts.Budget?.x || 200,
                y: tabLayouts.Budget?.y || H - 60,
                r: 36,
                title: 'Master Your Budget',
                body: 'Set limits for different categories and track your progress to reach your savings goals faster.',
              },
              {
                x: tabLayouts.SettingsTab?.x || W - 60,
                y: tabLayouts.SettingsTab?.y || H - 60,
                r: 36,
                title: 'Your Account & Settings',
                body: 'Change currency, export data, set reminders and more.',
                onFinish: async () => {
                  await AsyncStorage.setItem('shouldStartSettingsTour', 'true');
                  navigation.navigate('BottomTabs', { screen: 'SettingsTab' });
                }
              },
            ])
            setTourStep(0)
          }, 600)
        }
      };
      checkTour();
    }, [])
  );

  const getNotificationIconColor = (type) => {
    if (type === 'success') return COLORS.income;
    if (type === 'warning') return COLORS.expense;
    return COLORS.primary;
  };

  const handleEditExpense = (item) => {
    handleEdit(item)
    navigation.navigate('Create')
  }

  const handleDeleteRecord = (id, type) => {
    Alert.alert('Delete Record', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          if (type === 'income') handleDeleteIncome(id);
          else handleDelete(id);
        }
      }
    ])
  }

  // Filter Transactions based on selectedPeriod
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDate(now);

    return allTransactions.filter(item => {
      const itemDate = new Date(item.date);
      if (selectedPeriod === 'today') return item.date === todayStr;
      if (selectedPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return itemDate >= weekAgo;
      }
      if (selectedPeriod === 'month') {
        return item.date.startsWith(getYearMonth(now));
      }
      if (selectedPeriod === 'calendar') {
        return item.date.startsWith(selectedMonth);
      }
      return true; // 'all'
    });
  }, [allTransactions, selectedPeriod, selectedMonth]);

  // Insert Native Ads every 5th item
  const transactionsWithAds = useMemo(() => {
    return insertAdsIntoTransactionList(filteredTransactions);
  }, [filteredTransactions, isPremium]);

  // Dynamic Totals based on filter
  const displayTotals = useMemo(() => {
    const spent = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = income - spent;
    return { spent, balance, income };
  }, [filteredTransactions]);

  const handlePeriodSelect = (period) => {
    if (period === 'calendar') {
      setShowMonthPicker(true)
    }
    setSelectedPeriod(period)
  }

  const overBudgetCategories = categoriesWithBudget.filter(cat => cat.budgetLimit > 0 && cat.amountSpent > cat.budgetLimit)

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        <FlatList
          data={transactionsWithAds}
          keyExtractor={(item, index) => item.id || `ad_${index}`}
          ListHeaderComponent={
            <HomeListHeader
              navigation={navigation}
              auth={auth}
              COLORS={COLORS}
              SHADOW={SHADOW}
              tailwind={tailwind}
              Ionicons={Ionicons}
              AntDesign={AntDesign}
              overBudgetCategories={overBudgetCategories}
              isBudgetWarningDismissed={isBudgetWarningDismissed}
              setIsBudgetWarningDismissed={setIsBudgetWarningDismissed}
              monthlySummary={monthlySummary}
              hasSeenPreClosingThisMonth={hasSeenPreClosingThisMonth}
              setHasSeenPreClosingThisMonth={setHasSeenPreClosingThisMonth}
              getYearMonth={getYearMonth}
              hasDismissedSummaryBanner={hasDismissedSummaryBanner}
              setHasDismissedSummaryBanner={setHasDismissedSummaryBanner}
              setShowSummaryModal={setShowSummaryModal}
              logAppNotification={logAppNotification}
              scanBtnRef={scanBtnRef}
              alarmBtnRef={alarmBtnRef}
              balanceCardRef={balanceCardRef}
              transactionsTitleRef={transactionsTitleRef}
              setShowNotifications={setShowNotifications}
              selectedPeriod={selectedPeriod}
              selectedMonth={selectedMonth}
              prevMonthSummary={prevMonthSummary}
              displayTotals={displayTotals}
              currencySymbol={currencySymbol}
              totalSpent={totalSpent}
              balance={balance}
              setShowMonthPicker={setShowMonthPicker}
              handlePeriodSelect={handlePeriodSelect}
            />
          }
          renderItem={({ item }) => {
            if (item.type === 'AD') {
              return (
                <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
                  <BannerAdComponent />
                </View>
              );
            }
            return (
              <ExpenseItemCard
                item={item}
                onEdit={handleEditExpense}
                onDelete={handleDeleteRecord}
              />
            );
          }}
          ListEmptyComponent={<EmptyList />}
          contentContainerStyle={{ paddingBottom: BOTTOM_AD_MARGIN + 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#000000']} />
          }
        />

        {/* Banner Ad — dynamically positioned just above floating tab bar */}
        <View style={{
          position: 'absolute',
          bottom: BOTTOM_AD_MARGIN,
          left: 0,
          right: 0,
          backgroundColor: COLORS.background,
        }}>
          <BannerAdComponent />
        </View>
      </View>

      {/* Month Selector Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={styles.monthPickerContainer}>
            <Text style={styles.monthPickerTitle}>Select Month</Text>
            <RNScrollView style={styles.monthList}>
              {Array.from({ length: 12 }).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const val = getYearMonth(d);
                const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => {
                      setSelectedMonth(val);
                      setShowMonthPicker(false);
                    }}
                    style={[
                      styles.monthItem,
                      selectedMonth === val && styles.monthItemActive
                    ]}
                  >
                    <Text style={[
                      styles.monthItemText,
                      selectedMonth === val && styles.monthItemTextActive
                    ]}>
                      {label}
                    </Text>
                    {selectedMonth === val && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </RNScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Summary Tips Modal */}
      <Modal
        visible={showSummaryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.summaryModalContainer}>
            <View style={[styles.summaryIconBox, { backgroundColor: monthlySummary.isDebt ? '#FEF3C7' : '#D1FAE5' }]}>
              <Ionicons
                name={monthlySummary.isDebt ? 'alert-circle' : 'sparkles'}
                size={40}
                color={monthlySummary.isDebt ? '#D97706' : '#059669'}
              />
            </View>

            <Text style={styles.summaryTitle}>
              {monthlySummary.isDebt ? 'Month Insights' : 'Amazing Progress!'}
            </Text>

            <Text style={styles.summaryAmount}>
              {currencySymbol}{Math.abs(monthlySummary.savings).toFixed(2)}
            </Text>
            <Text style={styles.summarySub}>
              {monthlySummary.isDebt ? 'over your budget this month' : 'saved in your pocket!'}
            </Text>

            <View style={{ marginVertical: 15, alignItems: 'center', width: '100%' }}>
              <BannerAdComponent />
            </View>


            <View style={styles.tipBox}>
              <Ionicons name="bulb" size={20} color={COLORS.primary} />
              <Text style={styles.tipText}>
                {monthlySummary.isDebt
                  ? `Tip: You spent most on ${monthlySummary.topCategory}. Try setting a tighter budget for it next month!`
                  : `Tip: Great job saving! Consider putting this ${currencySymbol}${Math.abs(monthlySummary.savings).toFixed(0)} into your emergency fund.`}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowSummaryModal(false)}
            >
              <Text style={styles.closeModalBtnText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reminders Modal */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.notificationModalContainer, { paddingBottom: 20, maxHeight: '90%' }]}
          >
            <View style={tailwind`flex-row justify-between items-center w-full mb-4`}>
              <Text style={styles.notificationModalTitle}>Custom Reminders</Text>
              <Ionicons name="alarm" size={24} color={COLORS.primary} />
            </View>

            <RNScrollView style={tailwind`w-full`} showsVerticalScrollIndicator={false}>

              <Text style={tailwind`text-gray-500 font-bold text-xs mb-2 uppercase`}>Set New Reminder</Text>
              <View style={tailwind`bg-white rounded-xl border border-gray-200 p-4 mb-6`}>
                <TextInput
                  style={[tailwind`w-full bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200`, { color: COLORS.textMain, fontSize: 15 }]}
                  placeholder="E.g., Log dinner expenses..."
                  placeholderTextColor={COLORS.gray400}
                  value={reminderMsg}
                  onChangeText={setReminderMsg}
                />

                <View style={tailwind`flex-row justify-between mb-4`}>
                  <TouchableOpacity
                    style={tailwind`flex-1 bg-blue-50 border border-blue-100 p-3 rounded-lg mr-2 flex-row items-center justify-center`}
                    onPress={() => { setPickerMode('date'); setShowPicker(true); }}
                  >
                    <Ionicons name="calendar" size={18} color={COLORS.primary} style={tailwind`mr-2`} />
                    <Text style={tailwind`text-blue-700 font-bold text-sm`}>
                      {reminderDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={tailwind`flex-1 bg-purple-50 border border-purple-100 p-3 rounded-lg ml-2 flex-row items-center justify-center`}
                    onPress={() => { setPickerMode('time'); setShowPicker(true); }}
                  >
                    <Ionicons name="time-outline" size={18} color="#7e22ce" style={tailwind`mr-2`} />
                    <Text style={tailwind`text-purple-700 font-bold text-sm`}>
                      {reminderDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={tailwind`flex-row justify-between items-center mb-4 bg-gray-50 rounded-lg p-1 border border-gray-200`}>
                  <TouchableOpacity
                    style={[tailwind`flex-1 py-2 px-3 items-center rounded-md`, !isAlarm ? tailwind`bg-white shadow-sm border border-gray-100` : null]}
                    onPress={() => setIsAlarm(false)}
                  >
                    <View style={tailwind`flex-row items-center`}>
                      <Ionicons name="notifications" size={16} color={!isAlarm ? COLORS.primary : COLORS.gray400} style={tailwind`mr-1`} />
                      <Text style={[tailwind`font-bold text-sm`, { color: !isAlarm ? COLORS.textMain : COLORS.gray400 }]}>Notification</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[tailwind`flex-1 py-2 px-3 items-center rounded-md`, isAlarm ? tailwind`bg-white shadow-sm border border-gray-100` : null]}
                    onPress={() => setIsAlarm(true)}
                  >
                    <View style={tailwind`flex-row items-center`}>
                      <Ionicons name="alarm" size={16} color={isAlarm ? COLORS.expense : COLORS.gray400} style={tailwind`mr-1`} />
                      <Text style={[tailwind`font-bold text-sm`, { color: isAlarm ? COLORS.textMain : COLORS.gray400 }]}>Loud Alarm</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {showPicker && (
                  <DateTimePicker
                    value={reminderDate}
                    mode={pickerMode}
                    is24Hour={false}
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowPicker(false);
                      if (selectedDate) setReminderDate(selectedDate);
                    }}
                  />
                )}

                <TouchableOpacity
                  style={tailwind`w-full bg-green-500 rounded-xl p-3 flex-row items-center justify-center`}
                  onPress={async () => {
                    if (reminderDate <= new Date()) {
                      showGlobalAlert({
                         title: "Invalid Time",
                         message: "Please choose a future date and time.",
                         icon: "time",
                         iconColor: "#EF4444",
                         primaryButtonText: "Okay"
                      });
                      return;
                    }
                    const success = await scheduleCustomReminder(reminderDate, reminderMsg, isAlarm);
                    if (success) {
                      showGlobalAlert({
                         title: "Success",
                         message: "Reminder carefully scheduled!",
                         icon: "checkmark-circle",
                         iconColor: "#22C55E",
                         primaryButtonText: "Awesome!"
                      });
                      setReminderMsg('');
                      fetchReminders();
                    }
                  }}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" style={tailwind`mr-2`} />
                  <Text style={tailwind`text-white font-bold text-base`}>Save Reminder</Text>
                </TouchableOpacity>
              </View>

              {/* Banner Ad inside Reminders Modal */}
              <View style={[tailwind`my-4 items-center`, { width: '100%' }]}>
                <BannerAdComponent />
              </View>

              <Text style={tailwind`text-gray-500 font-bold text-xs mb-2 uppercase`}>Active Scheduled Reminders</Text>
              {activeReminders.length === 0 ? (
                <Text style={tailwind`text-gray-400 text-sm font-semibold mb-6`}>No custom reminders coming up.</Text>
              ) : (
                activeReminders.map(rem => (
                  <View key={rem.identifier} style={tailwind`flex-row items-center bg-gray-50 border border-gray-100 p-4 rounded-xl mb-3`}>
                    <View style={tailwind`bg-green-100 rounded-full p-2 mr-3`}>
                      <Ionicons name="alarm-outline" size={20} color={COLORS.income} />
                    </View>
                    <View style={tailwind`flex-1`}>
                      <Text style={tailwind`text-gray-800 font-bold text-sm`} numberOfLines={1}>{rem.content.body}</Text>
                      <Text style={tailwind`text-gray-500 text-xs mt-1`}>
                        {new Date(rem.trigger?.value).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={tailwind`bg-red-50 p-2 rounded-lg ml-2`}
                      onPress={async () => {
                        await cancelReminder(rem.identifier);
                        fetchReminders();
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.expense} />
                    </TouchableOpacity>
                  </View>
                ))
              )}

            </RNScrollView>

            <TouchableOpacity style={[styles.closeModalBtn, { marginTop: 10, width: '100%', backgroundColor: COLORS.gray100 }]} onPress={() => setShowNotifications(false)}>
              <Text style={[styles.closeModalBtnText, { color: COLORS.textMain }]}>Close</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <SpotlightTour
        steps={tourSteps}
        currentStep={tourStep}
        onNext={() => {
          if (tourStep >= tourSteps.length - 1) {
            setTourStep(-1)
            AsyncStorage.setItem('hasCompletedTour', 'true')
          } else {
            setTourStep(tourStep + 1)
          }
        }}
        onSkip={async () => {
          setTourStep(-1)
          await AsyncStorage.setItem('hasCompletedTour', 'true')
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },


  headerContainer: { paddingHorizontal: 20, paddingTop: 10 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.textMain },
  subGreeting: { fontSize: 13, color: COLORS.textSub, marginTop: 2, fontWeight: '600' },
  profilePic: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: COLORS.border },

  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dot: {
    position: 'absolute',
    top: 12, right: 12,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.expense,
    borderWidth: 2,
    borderColor: COLORS.gray100,
  },

  balanceCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)', // Adjust opacity for the "multiply" look
  },
  balanceLabel: { color: COLORS.gray400, fontSize: 14, fontWeight: '600' },
  balanceAmount: { color: COLORS.white, fontSize: 44, fontWeight: '900', marginTop: 8 },

  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  comparisonText: { fontSize: 10, fontWeight: '800' },

  progressContainer: { width: '100%', marginTop: 20 },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressLabel: { color: COLORS.gray400, fontSize: 10, fontWeight: '700' },
  progressValue: { color: COLORS.white, fontSize: 10, fontWeight: '800' },

  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  footerLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerAmount: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 16,
    letterSpacing: -0.5,
  },

  warningBanner: {
    backgroundColor: COLORS.expense,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    ...SHADOW.md,
  },
  warningIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  warningTextContent: { flex: 1 },
  warningTitle: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  warningDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 2 },
  calendarFilterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    padding: 12,
    borderRadius: 16,
    marginBottom: 15,
    gap: 8,
  },
  calendarFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMain,
    flex: 1,
  },
  changeMonthBtn: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  insightText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginTop: 4, fontStyle: 'italic' },
  preClosingBanner: {
    backgroundColor: '#0D9488', // Teal for info
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    ...SHADOW.md,
  },
  closingBannerSuccess: {
    backgroundColor: COLORS.income,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    ...SHADOW.md,
  },
  closingBannerWarning: {
    backgroundColor: '#F59E0B', // Orange for warning
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    ...SHADOW.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  monthPickerContainer: {
    width: '100%',
    maxHeight: '60%',
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    ...SHADOW.lg,
  },
  monthPickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 20,
    textAlign: 'center',
  },
  monthList: {
    width: '100%',
  },
  monthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  monthItemActive: {
    borderBottomColor: COLORS.primary,
  },
  monthItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSub,
  },
  monthItemTextActive: {
    color: COLORS.textMain,
    fontWeight: '800',
  },
  summaryModalContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    ...SHADOW.lg,
  },
  summaryIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textMain,
    textAlign: 'center',
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.textMain,
    marginVertical: 10,
  },
  summarySub: {
    fontSize: 14,
    color: COLORS.textSub,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 25,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMain,
    fontWeight: '600',
    lineHeight: 20,
  },
  closeModalBtn: {
    backgroundColor: COLORS.black,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    ...SHADOW.md,
  },
  closeModalBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  notificationModalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    ...SHADOW.lg,
  },
  notificationModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  notificationIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: COLORS.textSub,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    color: COLORS.gray400,
    marginTop: 6,
    fontWeight: '600',
  },
  // Tooltip Styles
  tooltipContainer: {
    backgroundColor: '#1F2937', // Dark gray
    borderRadius: 16,
    padding: 16,
    width: 250,
  },
  tooltipContent: {
    width: '100%',
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '500',
  },
  tooltipButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
})

export default Home
