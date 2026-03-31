import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getYearMonth = (date = new Date()) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
};

// ─── Foreground handler ────────────────────────────────────────────────────
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// ─── Channel IDs ───────────────────────────────────────────────────────────
export const CHANNEL_REMINDER = 'wallety-reminder-v2';
export const CHANNEL_TRANSACTION = 'wallety-transactions-v2';
export const CHANNEL_BUDGET = 'wallety-budget-v2';
export const CHANNEL_ALARM = 'wallety-alarm-v2';

// ─── Create all Android channels (idempotent — safe to call on every launch)
const createAndroidChannels = async () => {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync(CHANNEL_REMINDER, {
        name: '⏰ Daily Reminders',
        description: 'Daily nudge to log your expenses',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: '#22C55E',
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
    });

    await Notifications.setNotificationChannelAsync(CHANNEL_TRANSACTION, {
        name: '💸 Transaction Alerts',
        description: 'Confirmation when you add income or expenses',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 150],
        lightColor: '#06B6D4',
        sound: 'default',
    });

    await Notifications.setNotificationChannelAsync(CHANNEL_BUDGET, {
        name: '🚨 Budget Warnings',
        description: 'Alerts when you approach or exceed a budget',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 400, 200, 400, 200, 400],
        lightColor: '#EF4444',
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
        bypassDnd: true,
    });

    await Notifications.setNotificationChannelAsync(CHANNEL_ALARM, {
        name: '⏰ Loud Alarms',
        description: 'High priority noisy alarms for reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500, 200, 500, 200, 500],
        lightColor: '#EF4444',
        sound: 'default',
        audioAttributes: {
            usage: Notifications.AndroidAudioUsage.ALARM,
            contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
        bypassDnd: true,
    });
};

// ─── Permission + registration ─────────────────────────────────────────────
export const registerForPushNotificationsAsync = async () => {
    try {
        await createAndroidChannels();

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    } catch (error) {
        console.log('Notification registration error:', error);
        return false;
    }
};

// ─── Daily reminder (FIXED: proper channel + daily trigger type) ────────────
const MIDDAY_REMINDER_ID = 'wallety-midday-reminder';
const EVENING_REMINDER_ID = 'wallety-evening-reminder';

export const scheduleDailyReminder = async () => {
    try {
        const reminderKey = 'dailyReminderScheduledWeek';
        const now = new Date();
        const weekNumber = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`;
        const lastScheduledWeek = await AsyncStorage.getItem(reminderKey);
        
        if (lastScheduledWeek === weekNumber) return;

        // Cancel previous to ensure clean state
        await Notifications.cancelScheduledNotificationAsync(MIDDAY_REMINDER_ID).catch(() => { });
        await Notifications.cancelScheduledNotificationAsync(EVENING_REMINDER_ID).catch(() => { });

        const middayMessages = [
            "Did you spend anything this morning? Log it before you forget!",
            "Quick expense check — 2 minutes is all it takes 📊",
            "Stay on top of your budget. Log today's expenses now!",
        ];
        
        const eveningMessages = [
            "How was spending today? Log your expenses before bed!",
            "End your day right — review your daily spending 💪",
            "Don't sleep on your finances. Quick log before bed? 🛏️",
        ];

        const pickMidday = middayMessages[Math.floor(Math.random() * middayMessages.length)];
        const pickEvening = eveningMessages[Math.floor(Math.random() * eveningMessages.length)];

        // 2 PM Reminder
        await Notifications.scheduleNotificationAsync({
            identifier: MIDDAY_REMINDER_ID,
            content: {
                title: '💡 Midday Check-In',
                body: pickMidday,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: { screen: 'Create' },
                ...(Platform.OS === 'android' && { 
                    channelId: CHANNEL_REMINDER,
                    largeIcon: 'wallety_notif_silhouette',
                }),
            },
            trigger: { type: 'daily', hour: 14, minute: 0 },
        });

        // 8 PM Reminder
        await Notifications.scheduleNotificationAsync({
            identifier: EVENING_REMINDER_ID,
            content: {
                title: '🌙 Evening Summary',
                body: pickEvening,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: { screen: 'Create' },
                ...(Platform.OS === 'android' && { 
                    channelId: CHANNEL_REMINDER,
                    largeIcon: 'wallety_notif_silhouette',
                }),
            },
            trigger: { type: 'daily', hour: 20, minute: 0 },
        });

        await AsyncStorage.setItem(reminderKey, weekNumber);
    } catch (err) {
        console.log('scheduleDailyReminder error:', err);
    }
};

export const cancelDailyReminder = async () => {
    await Notifications.cancelScheduledNotificationAsync(MIDDAY_REMINDER_ID).catch(() => { });
    await Notifications.cancelScheduledNotificationAsync(EVENING_REMINDER_ID).catch(() => { });
    await AsyncStorage.removeItem('dailyReminderScheduledWeek');
};

// ─── Transaction confirmation ──────────────────────────────────────────────
export const confirmTransaction = async (type, title, amount, currencySymbol = '$') => {
    const isIncome = type === 'income';
    const symbol = currencySymbol || '$';
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: isIncome ? '💰 Income Added' : '💸 Expense Logged',
                body: `${isIncome ? '✅' : '🔴'} ${symbol}${parseFloat(amount).toFixed(2)} — ${title}`,
                subtitle: isIncome ? 'Great! Keep saving.' : 'Recorded successfully.',
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: { screen: isIncome ? 'Home' : 'Home' },
                ...(Platform.OS === 'android' && { 
                    channelId: CHANNEL_TRANSACTION,
                    largeIcon: 'wallety_notif_silhouette',
                }),
            },
            trigger: null, // immediate
        });
    } catch (err) {
        console.log('confirmTransaction error:', err);
    }
};

// ─── Budget warning ────────────────────────────────────────────────────────
export const sendBudgetWarning = async (category, percentage) => {
    const exceeded = percentage >= 100;
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: exceeded ? '🚨 Budget Exceeded!' : '⚠️ Budget Alert',
                body: exceeded
                    ? `You've blown your ${category} budget (${percentage}% used)! Time to cut back.`
                    : `${percentage}% of your ${category} budget is used. Slow down! 🐢`,
                subtitle: exceeded ? 'Take action now' : `${100 - percentage}% remaining`,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.MAX,
                data: { screen: 'Budget' },
                ...(Platform.OS === 'android' && { 
                    channelId: CHANNEL_BUDGET,
                    largeIcon: 'wallety_notif_silhouette',
                }),
            },
            trigger: null,
        });
    } catch (err) {
        console.log('sendBudgetWarning error:', err);
    }
};

// ─── Milestone / savings celebration ──────────────────────────────────────
export const sendMilestoneAlert = async (savings, currencySymbol = '$') => {
    const symbol = currencySymbol || '$';
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🎉 Savings Milestone!',
                body: `You saved ${symbol}${savings.toLocaleString()} this month — absolutely crushing it! 🏆`,
                subtitle: 'Financial goals on track 🚀',
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: { screen: 'Insight' },
                ...(Platform.OS === 'android' && { 
                    channelId: CHANNEL_TRANSACTION,
                    largeIcon: 'wallety_notif_silhouette',
                }),
            },
            trigger: null,
        });
    } catch (err) {
        console.log('sendMilestoneAlert error:', err);
    }
};

// ─── Monthly summary alert ─────────────────────────────────────────────────
export const scheduleMonthlySummaryAlert = async () => {
    try {
        const current = getYearMonth(); // YYYY-MM
        const scheduleKey = 'monthlySummaryScheduled'; // guard key: "already scheduled this month"
        const lastScheduled = await AsyncStorage.getItem(scheduleKey);
        
        if (lastScheduled === current) return; // already scheduled this month — skip

        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const dayOfMonth = now.getDate();
        const lastDayOfMonth = lastDay.getDate();
        const daysUntilEnd = lastDayOfMonth - dayOfMonth;

        if (daysUntilEnd > 2) {
            return; // Too early — don't touch the key so it can be checked next time
        }

        let triggerDate = new Date(lastDay);
        triggerDate.setHours(20, 0, 0, 0);

        // If we're already past 8PM on the last day, skip — month is essentially over
        if (now > triggerDate) return;

        const identifier = 'wallety-monthly-summary';
        await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => { });

        await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
                title: '📊 Monthly Summary Ready!',
                body: 'Your final results for this month are in. Tap to see how you performed! 🎯',
                subtitle: 'Tap to view your insights',
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: { screen: 'Insight' },
                ...(Platform.OS === 'android' && { 
                    channelId: CHANNEL_BUDGET,
                    largeIcon: 'wallety_notif_silhouette',
                }),
            },
            trigger: Platform.OS === 'android'
                ? { date: triggerDate, channelId: CHANNEL_BUDGET }
                : triggerDate,
        });

        await AsyncStorage.setItem(scheduleKey, current);
    } catch (err) {
        console.log('scheduleMonthlySummaryAlert error:', err);
    }
};

// NEW: called when month rolls over, so that next month can schedule fresh
export const resetMonthlySummaryScheduleKey = async () => {
    await AsyncStorage.removeItem('monthlySummaryScheduled');
};

// ─── Custom User Reminders ──────────────────────────────────────────────────
export const scheduleCustomReminder = async (triggerDate, message, isAlarm = false) => {
    try {
        const identifier = `wallety-custom-${Date.now()}`;
        const targetChannel = isAlarm ? CHANNEL_ALARM : CHANNEL_REMINDER;

        await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
                title: isAlarm ? '⏰ Urgent Reminder' : '🔔 Custom Reminder',
                body: message || "It's time! Don't forget to track your expenses.",
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.MAX,
                data: { screen: 'Create' },
                ...(Platform.OS === 'android' && { 
                    channelId: targetChannel,
                    largeIcon: 'wallety_notif_silhouette',
                }),
            },
            trigger: Platform.OS === 'android'
                ? { type: 'date', date: triggerDate.getTime(), channelId: targetChannel }
                : { type: 'date', date: triggerDate.getTime() },
        });

        return true;
    } catch (err) {
        console.log('scheduleCustomReminder error:', err);
        return false;
    }
};

export const getActiveReminders = async () => {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        // Return only the custom reminders we created
        return scheduled.filter(n => n.identifier.startsWith('wallety-custom-'));
    } catch (err) {
        console.log('getActiveReminders error:', err);
        return [];
    }
};

export const cancelReminder = async (identifier) => {
    try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
        return true;
    } catch (err) {
        console.log('cancelReminder error:', err);
        return false;
    }
};