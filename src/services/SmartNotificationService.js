import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHANNEL_BUDGET } from './NotificationService';

/**
 * Extracts the analytical data used for smart notifications.
 */
export const getSmartForecastData = ({
  totalIncome,
  totalSpent,
  monthlyExpenses,
  categoriesWithBudget,
  prevMonthSummary,
}) => {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1, 0
  ).getDate();
  const daysRemaining = daysInMonth - dayOfMonth;
  const daysElapsed = dayOfMonth;

  // ── CALCULATION 1: Daily burn rate ──────
  const dailyBurnRate = daysElapsed > 0
    ? totalSpent / daysElapsed
    : 0;

  // ── CALCULATION 2: Income depletion date
  const isOverspending = totalSpent > totalIncome;
  const daysUntilDepletion = totalIncome > totalSpent && dailyBurnRate > 0
    ? (totalIncome - totalSpent) / dailyBurnRate
    : 0;

  const willDepleteDaysEarly = daysRemaining - Math.floor(daysUntilDepletion);

  // ── CALCULATION 3: Spend rate vs normal ─
  const expectedSpentByNow = totalIncome * (dayOfMonth / daysInMonth);
  const spendingRatio = totalSpent / (expectedSpentByNow || 1);

  // ── CALCULATION 4: Compare to last month
  const lastMonthDailyRate = prevMonthSummary
    ? prevMonthSummary.totalSpent / daysInMonth
    : null;
  const spendingFasterThanLastMonth =
    lastMonthDailyRate
      ? dailyBurnRate > lastMonthDailyRate * 1.2
      : false;

  const safeDailySpend = daysRemaining > 0
    ? Math.max(0, (totalIncome - totalSpent) / daysRemaining)
    : 0;

  const projectedTotal = dailyBurnRate * daysInMonth;

  return {
    dailyBurnRate,
    daysUntilDepletion: Math.floor(daysUntilDepletion),
    willDepleteDaysEarly,
    spendingRatio,
    spendingFasterThanLastMonth,
    lastMonthDailyRate,
    daysRemaining,
    daysElapsed,
    daysInMonth,
    safeDailySpend,
    projectedTotal,
    isOverspending
  };
};

/**
 * Runs smart analysis on user spending and sends proactive notifications.
 */
export const runSmartAnalysis = async (params) => {
  try {
    const {
      dailyBurnRate,
      daysUntilDepletion,
      willDepleteDaysEarly,
      spendingRatio,
      spendingFasterThanLastMonth,
      lastMonthDailyRate,
      daysRemaining,
      daysElapsed,
      isOverspending
    } = getSmartForecastData(params);

    const { totalIncome, totalSpent, categoriesWithBudget } = params;

    const today = new Date();
    // AsyncStorage key to avoid notification spam
    // Only send each smart notification ONCE per day
    const today_str = today.toISOString().split('T')[0];
    const notifKey = `smartNotif_${today_str}`;
    const alreadySent = await AsyncStorage.getItem(notifKey);
    if (alreadySent) return;

    if (daysElapsed <= 1) return; // Skip all smart notifications on Day 1

    let notification = null;

    // ── RULE 1: Early depletion warning ─────
    // If projected to run out 5+ days early
    if (willDepleteDaysEarly >= 5 &&
      daysElapsed >= 5 &&
      totalIncome > 0 &&
      dailyBurnRate > 0) {
      notification = {
        title: '⚠️ Income Running Out Early!',
        body: `At this rate you'll run out of money ${willDepleteDaysEarly} days before month end. Slow down your spending!`,
        data: { screen: 'Insight' },
      };
    }

    // ── RULE 2: Spending 30% in first 3 days ─
    else if (today.getDate() <= 3 &&
      totalIncome > 0 &&
      totalSpent / totalIncome >= 0.50) {
      notification = {
        title: '🚨 You Spent 30% in 3 Days!',
        body: `You've already used ${Math.round(totalSpent / totalIncome * 100)}% of your income in just ${today.getDate()} days. Time to slow down!`,
        data: { screen: 'Budget' },
      };
    }

    // ── RULE 3: Faster than last month ───────
    else if (spendingFasterThanLastMonth &&
      daysElapsed >= 7) {
      const diff = Math.round(
        (dailyBurnRate / (lastMonthDailyRate || 1) - 1) * 100
      );
      notification = {
        title: '📈 Spending Faster Than Usual',
        body: `You're spending ${diff}% faster than last month. Check your expenses before it gets out of hand!`,
        data: { screen: 'Insight' },
      };
    }

    // ── RULE 4: Overall budget 80%+ warning ──
    else if (totalIncome > 0 &&
      totalSpent / totalIncome >= 0.80 &&
      daysRemaining > 7) {
      notification = {
        title: '🔴 80% of Income Used!',
        body: `You've used ${Math.round(totalSpent / totalIncome * 100)}% of your income with ${daysRemaining} days still remaining this month.`,
        data: { screen: 'Budget' },
      };
    }

    // ── RULE 5: Category specific warnings ───
    if (!notification) {
      const overCategories = categoriesWithBudget
        .filter(c =>
          c.budgetLimit > 0 &&
          c.amountSpent > 0 &&
          c.amountSpent / c.budgetLimit >= 0.90 &&
          daysRemaining > 5 &&
          daysElapsed >= 3
        )
        .sort((a, b) =>
          (b.amountSpent / b.budgetLimit) -
          (a.amountSpent / a.budgetLimit)
        );

      if (overCategories.length > 0) {
        const worst = overCategories[0];
        const pct = Math.round(
          worst.amountSpent / worst.budgetLimit * 100
        );
        notification = {
          title: `${worst.icon} ${worst.name} Budget Alert`,
          body: `You've used ${pct}% of your ${worst.name} budget with ${daysRemaining} days left. Try to cut back on ${worst.name.toLowerCase()} spending!`,
          data: { screen: 'Budget' },
        };
      }
    }

    // ── RULE 6: Positive reinforcement ───────
    if (!notification &&
      spendingRatio < 0.7 &&
      daysElapsed >= 10 &&
      totalIncome > 0) {
      const savedPct = Math.round(
        (1 - totalSpent / totalIncome) * 100
      );
      notification = {
        title: '🎉 Great Spending Habits!',
        body: `You still have ${savedPct}% of your income left with ${daysRemaining} days to go. Keep it up!`,
        data: { screen: 'Insight' },
      };
    }

    // ── Send notification if triggered ───────
    if (notification) {
      await AsyncStorage.setItem(notifKey, 'true');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: notification.data,
          ...(Platform.OS === 'android' && {
            channelId: 'wallety-budget-v2',
            largeIcon: 'ic_launcher',
          }),
        },
        trigger: null, // immediate
      });
    }
  } catch (err) {
    console.log('runSmartAnalysis error:', err);
  }
};
