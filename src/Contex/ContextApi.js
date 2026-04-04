import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories } from "../Data/categoriesData";
import { registerForPushNotificationsAsync, sendBudgetWarning, scheduleMonthlySummaryAlert, scheduleDailyReminder, resetMonthlySummaryScheduleKey } from "../services/NotificationService";
import { db, auth } from "../services/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import AdService from "../services/AdService";
import { runSmartAnalysis, getSmartForecastData } from "../services/SmartNotificationService";
import RevenueCatService from "../services/RevenueCatService";

export const AppContext = createContext()

export const AppContextProvider = ({ children }) => {

    // ── Expenses ──────────────────────────────────────────────
    const [expenses, setExpenses] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [categoriesList, setCategoriesList] = useState(categories)

    // ── Income ────────────────────────────────────────────────
    const [incomes, setIncomes] = useState([])

    // ── Budgets & Preferences ────────────────────────────────
    const [budgets, setBudgets] = useState({}) // { 'Food': 200, 'Bills': 150, ... }
    const [currency, setCurrencyState] = useState('USD')
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [isFirstLaunch, setIsFirstLaunch] = useState(null) // null for initial loading
    const [userName, setUserNameState] = useState('');
    const [recurringTransactions, setRecurringTransactions] = useState([]);
    const [appNotifications, setAppNotifications] = useState([]);
    const [prevMonthSummary, setPrevMonthSummary] = useState(null);
    const [hasFetchedFromCloud, setHasFetchedFromCloud] = useState(false);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [lastProcessedMonth, setLastProcessedMonth] = useState(null);
    const [tabLayouts, setTabLayouts] = useState({});
    const [isPremium, setIsPremium] = useState(false);

    // Sync premium status with AdService
    useEffect(() => {
        AdService.isPremiumUser = isPremium;
    }, [isPremium]);

    // ── Rating Prompt ─────────────────────────────────────────
    const [hasRatedApp, setHasRatedApp] = useState(false);
    const [showRatingPrompt, setShowRatingPrompt] = useState(false);

    // ── Global Premium Alert ──────────────────────────────────
    const [globalAlert, setGlobalAlert] = useState({
        visible: false,
        title: '',
        message: '',
        icon: 'information-circle',
        iconColor: '#000',
        primaryButtonText: 'OK',
        onPrimaryPress: null,
        secondaryButtonText: null,
        onSecondaryPress: null,
    });

    const showGlobalAlert = useCallback((config) => {
        setGlobalAlert({ ...config, visible: true });
    }, []);

    const hideGlobalAlert = useCallback(() => {
        setGlobalAlert(prev => ({ ...prev, visible: false }));
    }, []);

    const startRatingTimer = useCallback(() => {
        if (hasRatedApp) return;
        setTimeout(() => {
            setShowRatingPrompt(true);
        }, 30000);
    }, [hasRatedApp]);

    const updateTabLayout = useCallback((name, layout) => {
        setTabLayouts(prev => ({
            ...prev,
            [name]: layout
        }));
    }, []);

    const logAppNotification = (title, body, type = 'info') => {
        setAppNotifications(prev => {
            const newNotif = {
                id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                title,
                body,
                type,
                date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            };
            const updated = [newNotif, ...prev].slice(0, 50); // Keep last 50
            AsyncStorage.setItem('appNotifications', JSON.stringify(updated));
            return updated;
        });
    };

    const getCurrencySymbol = (code) => {
        const symbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥',
            'AUD': 'A$', 'CAD': 'C$', 'BDT': '৳', 'CNY': '¥', 'SGD': 'S$',
            'AED': 'د.إ', 'SAR': '﷼', 'RUB': '₽', 'BRL': 'R$', 'CHF': 'Fr',
            'TRY': '₺', 'KRW': '₩', 'ZAR': 'R', 'PKR': '₨', 'EGP': 'E£'
        };
        return symbols[code] || '$';
    };

    const getYearMonth = (date = new Date()) => {
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    };

    const getLocalDate = (date = new Date()) => {
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const currencySymbol = getCurrencySymbol(currency);

    // ── Form state ────────────────────────────────────────────
    const [amount, setAmount] = useState('')
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState({})
    const [editingId, setEditingId] = useState(null)
    const [editingType, setEditingType] = useState('expense') // Bug 3: tracks type of transaction being edited

    const resetForm = () => {
        setAmount('');
        setTitle('');
        setCategory({});
        setEditingId(null);
        setEditingType('expense');
    };

    // ── Date filter ───────────────────────────────────────────
    const [selectedPeriod, setSelectedPeriod] = useState('all')

    // ── Load on mount ─────────────────────────────────────────
    useEffect(() => {
        loadData();
        // Initialize ads
        AdService.initializeAds();
        
        // Show app open ad (once per 24 hours)
        setTimeout(() => {
            AdService.showAppOpenAd();
        }, 1000);
        
        // Register permissions first, then schedule using the fixed service
        registerForPushNotificationsAsync().then(granted => {
            if (granted) {
                scheduleDailyReminder();
                scheduleMonthlySummaryAlert();
            }
        });

        // Background check every hour
        const interval = setInterval(() => {
            checkAndResetMonth();
        }, 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    // ── Persist expenses whenever they change ─────────────────
    useEffect(() => {
        if (!isLoading) {
            AsyncStorage.setItem('expenses', JSON.stringify(expenses)).catch(e =>
                console.log('Error saving expenses:', e)
            );
        }
    }, [expenses]);

    // ── Persist incomes whenever they change ──────────────────
    useEffect(() => {
        if (!isLoading) {
            AsyncStorage.setItem('incomes', JSON.stringify(incomes)).catch(e =>
                console.log('Error saving incomes:', e)
            );
        }
    }, [incomes]);

    // ── Persist categories whenever they change ───────────────
    useEffect(() => {
        if (!isLoading) {
            AsyncStorage.setItem('customCategories', JSON.stringify(categoriesList)).catch(e =>
                console.log('Error saving categories:', e)
            );
        }
    }, [categoriesList]);

    // ── Firestore Sync ─────────────────────────────────────────
    const syncToFirestore = async (uid, data) => {
        if (!uid) return;
        try {
            await setDoc(doc(db, "users", uid), {
                ...data,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.error("Firestore Sync Error:", e);
        }
    };

    const fetchFromFirestore = async (uid) => {
        if (!uid) return;
        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.expenses && (data.expenses.length > 0 || expenses.length === 0)) setExpenses(data.expenses);
                if (data.incomes && (data.incomes.length > 0 || incomes.length === 0)) setIncomes(data.incomes);
                if (data.budgets) setBudgets(data.budgets);
                if (data.userName) setUserNameState(data.userName);
                if (data.currency) setCurrencyState(data.currency);
                if (data.customCategories) setCategoriesList(data.customCategories);
                if (data.recurringTransactions) setRecurringTransactions(data.recurringTransactions);
                if (data.prevMonthSummary) setPrevMonthSummary(data.prevMonthSummary);
                if (typeof data.isSetupComplete === 'boolean') setIsSetupComplete(data.isSetupComplete);
                if (data.lastProcessedMonth) {
                    setLastProcessedMonth(data.lastProcessedMonth);
                    await AsyncStorage.setItem(`lastProcessedMonth_${uid}`, data.lastProcessedMonth);
                }

                // If data has recurring items or expenses, assume setup is complete even if flag is missing
                if (data.expenses?.length > 0 || data.recurringTransactions?.length > 0) {
                    setIsSetupComplete(true);
                }

                // Also update local storage to stay in sync
                await AsyncStorage.multiSet([
                    ['expenses', JSON.stringify(data.expenses || expenses)],
                    ['incomes', JSON.stringify(data.incomes || incomes)],
                    ['budgets', JSON.stringify(data.budgets || {})],
                    ['userName', data.userName || ''],
                    ['currency', data.currency || 'USD'],
                    ['customCategories', JSON.stringify(data.customCategories || categories)],
                    ['recurringTransactions', JSON.stringify(data.recurringTransactions || [])],
                    ['prevMonthSummary', JSON.stringify(data.prevMonthSummary || null)],
                    ['isSetupComplete', JSON.stringify(data.isSetupComplete || false)],
                    [`lastProcessedMonth_${uid}`, data.lastProcessedMonth || '']
                ]);

                // ── Trigger Rollover Check ──
                // Now that cloud data (expenses/recurring) is loaded, check if we need to rollover
                const currentMonthYear = getYearMonth();
                if (data.lastProcessedMonth !== currentMonthYear) {
                    setTimeout(() => checkAndResetMonth(uid), 1000);
                }
            }
            setHasFetchedFromCloud(true);
            // Run smart analysis once after cloud load
            setTimeout(() => {
                runSmartAnalysis({
                    totalIncome,
                    totalSpent,
                    monthlyExpenses,
                    categoriesWithBudget,
                    prevMonthSummary,
                });
            }, 2000);
        } catch (e) {
            console.error("Firestore Fetch Error:", e);
            setHasFetchedFromCloud(true); // allow syncing after failed fetch attempt to avoid blocking user
        }
    };

    // Auto-sync whenever critical state changes if user is logged in
    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (uid && !isLoading && hasFetchedFromCloud) {
            const timer = setTimeout(() => {
                syncToFirestore(uid, {
                    expenses,
                    incomes,
                    budgets,
                    userName,
                    currency,
                    customCategories: categoriesList,
                    recurringTransactions,
                    prevMonthSummary,
                    isSetupComplete,
                    lastProcessedMonth: lastProcessedMonth
                });
            }, 1500); // 1.5s debounce for heavier sync
            return () => clearTimeout(timer);
        }
    }, [expenses, incomes, budgets, userName, currency, categoriesList, recurringTransactions, prevMonthSummary, isSetupComplete, lastProcessedMonth, isLoading, hasFetchedFromCloud]);

    // Listen for Auth changes to fetch data and sync RevenueCat
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                fetchFromFirestore(user.uid);
                try {
                    await RevenueCatService.logIn(user.uid);
                    const premium = await RevenueCatService.checkSubscriptionStatus();
                    setIsPremium(premium);
                } catch (err) {
                    console.error("RevenueCat Sync Error:", err);
                }
            } else {
                setIsPremium(false);
            }
        });
        return unsubscribe;
    }, []);

    const loadData = async () => {
        try {
            const [storedExpenses, storedIncomes, storedBudgets, storedCurrency, storedDarkMode, storedCategories, storedFirstLaunch, storedUserName, storedRecurring, storedLastProcessed, storedNotifs, storedIsSetupComplete] = await Promise.all([
                AsyncStorage.getItem('expenses'),
                AsyncStorage.getItem('incomes'),
                AsyncStorage.getItem('budgets'),
                AsyncStorage.getItem('currency'),
                AsyncStorage.getItem('isDarkMode'),
                AsyncStorage.getItem('customCategories'),
                AsyncStorage.getItem('isFirstLaunch'),
                AsyncStorage.getItem('userName'),
                AsyncStorage.getItem('recurringTransactions'),
                AsyncStorage.getItem('lastProcessedMonth'),
                AsyncStorage.getItem('appNotifications'),
                AsyncStorage.getItem('isSetupComplete'),
            ]);
            if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
            if (storedIncomes) setIncomes(JSON.parse(storedIncomes));
            if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
            if (storedCurrency) setCurrencyState(storedCurrency);
            if (storedDarkMode) setIsDarkMode(JSON.parse(storedDarkMode));
            if (storedCategories) setCategoriesList(JSON.parse(storedCategories));

            if (storedNotifs) setAppNotifications(JSON.parse(storedNotifs));

            const [storedPrevSummary, storedHasRated, storedLastRatePrompt] = await Promise.all([
                AsyncStorage.getItem('prevMonthSummary'),
                AsyncStorage.getItem('hasRatedApp'),
                AsyncStorage.getItem('lastRatePrompt')
            ]);
            if (storedPrevSummary) setPrevMonthSummary(JSON.parse(storedPrevSummary));
            if (storedIsSetupComplete) setIsSetupComplete(JSON.parse(storedIsSetupComplete));
            
            if (storedHasRated) {
                setHasRatedApp(JSON.parse(storedHasRated));
            } else if (storedLastRatePrompt) {
                const lastPromptTime = parseInt(storedLastRatePrompt);
                const TWELVE_HOURS = 12 * 60 * 60 * 1000;
                if (Date.now() - lastPromptTime > TWELVE_HOURS) {
                    setTimeout(() => setShowRatingPrompt(true), 30000);
                }
            }

            // Recurring logic
            const recurring = storedRecurring ? JSON.parse(storedRecurring) : [];
            setRecurringTransactions(recurring);

            // Onboarding logic: default to true if never set
            setIsFirstLaunch(storedFirstLaunch === null ? true : JSON.parse(storedFirstLaunch));
            if (storedUserName) setUserNameState(storedUserName);

            // Per-user last processed month
            const uid = auth.currentUser?.uid;
            const userSpecificLastMonth = uid ? await AsyncStorage.getItem(`lastProcessedMonth_${uid}`) : storedLastProcessed;

            if (userSpecificLastMonth) setLastProcessedMonth(userSpecificLastMonth);

            // Auto-log recurring items for current month if not done
            const currentMonthYear = getYearMonth();
            if (userSpecificLastMonth !== currentMonthYear) {
                // Wait for state to be fully loaded then trigger reset
                setTimeout(() => checkAndResetMonth(uid), 500);
            }
        } catch (error) {
            console.log('Error loading data:', error);
            showGlobalAlert({
                title: 'Error',
                message: 'Failed to load your data',
                icon: 'warning',
                iconColor: '#F43F5E',
                primaryButtonText: 'Got it'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // No-op: moved smart analysis to run once after cloud fetch for performance

    const cachePreviousMonthSummary = async (expensesStr, incomesStr, monthYear) => {
        try {
            const exps = expensesStr ? JSON.parse(expensesStr) : [];
            const incs = incomesStr ? JSON.parse(incomesStr) : [];

            const monthExps = exps.filter(e => e.date.startsWith(monthYear));
            const monthIncs = incs.filter(i => i.date.startsWith(monthYear));

            const totalE = monthExps.reduce((sum, e) => sum + Number(e.amount), 0);
            const totalI = monthIncs.reduce((sum, i) => sum + Number(i.amount), 0);

            const summary = {
                monthYear,
                totalSpent: totalE,
                totalIncome: totalI,
                savings: totalI - totalE
            };

            await AsyncStorage.setItem('prevMonthSummary', JSON.stringify(summary));
        } catch (e) {
            console.log('Error caching monthly summary:', e);
        }
    };

    const checkAndResetMonth = async (userUid = auth.currentUser?.uid) => {
        const currentMonthYear = getYearMonth();
        const storageKey = userUid ? `lastProcessedMonth_${userUid}` : 'lastProcessedMonth';
        const storedLastMonth = await AsyncStorage.getItem(storageKey);

        if (storedLastMonth && storedLastMonth !== currentMonthYear) {
            console.log(`Month changed from ${storedLastMonth} to ${currentMonthYear} for user ${userUid}`);

            // 1. Archive previous month's summary
            const monthExps = expenses.filter(e => e.date.startsWith(storedLastMonth));
            const monthIncs = incomes.filter(i => i.date.startsWith(storedLastMonth));

            const totalE = monthExps.reduce((sum, e) => sum + Number(e.amount), 0);
            const totalI = monthIncs.reduce((sum, i) => sum + Number(i.amount), 0);

            const summary = {
                monthYear: storedLastMonth,
                totalSpent: totalE,
                totalIncome: totalI,
                savings: totalI - totalE
            };

            await AsyncStorage.setItem('prevMonthSummary', JSON.stringify(summary));
            setPrevMonthSummary(summary);

            // 2. Add recurring transactions for new month (Idempotency check inside)
            if (recurringTransactions.length > 0) {
                await processRecurring(recurringTransactions, currentMonthYear);
            }

            // 3. Log notification
            logAppNotification(
                "📅 New Month Started",
                `Welcome to ${new Date().toLocaleString('default', { month: 'long' })}! ` +
                (recurringTransactions.length > 0
                    ? `${recurringTransactions.length} recurring items added.`
                    : `Start adding your expenses for this month.`),
                'success'
            );

            // 4. Reset monthly summary schedule key for the new month
            await resetMonthlySummaryScheduleKey();

            // 5. Update last processed (Both local and sync will catch state update)
            await AsyncStorage.setItem(storageKey, currentMonthYear);
            setLastProcessedMonth(currentMonthYear);
        } else if (!storedLastMonth) {
            // First time setup of the tracker for this user
            await AsyncStorage.setItem(storageKey, currentMonthYear);
            setLastProcessedMonth(currentMonthYear);
        }
    };

    const processRecurring = async (recurring, monthYear) => {
        const newExpenses = [];
        const newIncomes = [];
        
        for (const item of recurring) {
            // Per-item idempotency check
            const idempotencyKey = `recurring_done_${item.id}_${monthYear}`;
            const alreadyDone = await AsyncStorage.getItem(idempotencyKey);
            if (alreadyDone) continue;

            const day = String(item.recurringDay || 1).padStart(2, '0');
            const date = `${monthYear}-${day}`;
            
            // Only process if the chosen day has arrived (or it's a past month)
            const today = new Date();
            const currentDay = today.getDate();
            const isFutureDay = monthYear === getYearMonth() && parseInt(day) > currentDay;
            if (isFutureDay) continue;

            const transaction = {
                id: `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: item.title,
                amount: parseFloat(item.amount),
                category: item.category,
                icon: item.category?.icon || (item.type === 'income' ? '💰' : '📦'),
                date: date,
            };

            if (item.type === 'income') {
                transaction.source = item.title;
                newIncomes.push(transaction);
            } else {
                newExpenses.push(transaction);
            }

            // Mark as done for this month
            await AsyncStorage.setItem(idempotencyKey, 'true');
        }

        if (newExpenses.length > 0) {
            setExpenses(prev => [...newExpenses, ...prev]);
        }
        if (newIncomes.length > 0) {
            setIncomes(prev => [...newIncomes, ...prev]);
        }

        await AsyncStorage.setItem('lastProcessedMonth', monthYear);
    };

    const addRecurringTransaction = async (item) => {
        setRecurringTransactions(prev => {
            const newItem = {
                ...item,
                id: item.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
            };
            let updated;
            if (item.id) {
                updated = [...prev.filter(r => r.id !== item.id), newItem];
            } else {
                updated = [...prev, newItem];
            }
            AsyncStorage.setItem('recurringTransactions', JSON.stringify(updated));
            return updated;
        });
    };

    const deleteRecurringTransaction = async (id) => {
        setRecurringTransactions(prev => {
            const updated = prev.filter(item => item.id !== id);
            AsyncStorage.setItem('recurringTransactions', JSON.stringify(updated));
            return updated;
        });
    };

    const updateRecurringTransaction = async (id, updatedItem) => {
        setRecurringTransactions(prev => {
            const updated = prev.map(item => item.id === id ? { ...item, ...updatedItem } : item);
            AsyncStorage.setItem('recurringTransactions', JSON.stringify(updated));
            return updated;
        });
    };

    const completeOnboarding = useCallback(async () => {
        try {
            const currentMonth = getYearMonth();

            // 1. Process recurring items immediately so they appear on dashboard
            if (recurringTransactions.length > 0) {
                await processRecurring(recurringTransactions, currentMonth);
            }

            // 2. Persist onboarding status
            await AsyncStorage.multiSet([
                ['isFirstLaunch', JSON.stringify(false)],
                ['isSetupComplete', JSON.stringify(true)],
                ['lastProcessedMonth', currentMonth]
            ]);

            setIsSetupComplete(true);
            setIsFirstLaunch(false);
        } catch (e) {
            console.error('Error completing onboarding', e);
        }
    }, [recurringTransactions, processRecurring]);

    const setUserName = async (name) => {
        setUserNameState(name);
        await AsyncStorage.setItem('userName', name);
    };

    // ── Category CRUD ─────────────────────────────────────────
    const handleAddCategory = useCallback((newCat) => {
        setCategoriesList(prev => [newCat, ...prev]);
    }, []);

    // ── Expense CRUD ──────────────────────────────────────────
    const handleAddExpense = ({ title: t, amount: amt, category: cat, date: d, navigation }) => {
        if (!t || !amt || !cat?.name) {
            showGlobalAlert({
                title: 'Missing Fields',
                message: 'All fields are required',
                icon: 'alert-circle',
                iconColor: '#F43F5E',
                primaryButtonText: 'Okay'
            });
            return;
        }
        const newExpense = {
            id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: t.trim(),
            category: cat,
            amount: parseFloat(parseFloat(amt).toFixed(2)),
            icon: cat.icon,
            date: d || getLocalDate(),
            type: 'expense'
        };
        setExpenses(prev => {
            const updated = [newExpense, ...prev];

            // Check budget alert
            const budgetLimit = budgets[cat.name] || 0;
            if (budgetLimit > 0) {
                const totalInCat = updated
                    .filter(e => e.category?.name === cat.name)
                    .reduce((sum, e) => sum + Number(e.amount), 0);

                if (totalInCat > budgetLimit) {
                    const percentage = Math.round((totalInCat / budgetLimit) * 100);
                    sendBudgetWarning(cat.name, percentage);
                    logAppNotification(
                        percentage >= 100 ? "🚨 Budget Exceeded!" : "⚠️ Budget Warning",
                        percentage >= 100 ? `You've used ${percentage}% of your ${cat.name} budget!` : `You've used ${percentage}% of your ${cat.name} budget.`,
                        'warning'
                    );
                }
            }
            return updated;
        });
        logAppNotification("💸 Expense Added", `✅ ${currencySymbol}${parseFloat(amt).toFixed(2)}: ${t.trim()}`, 'success');
        resetForm();
        if (navigation) navigation.navigate('Home');
    };

    const handleEdit = (item) => {
        setTitle(item.title || item.source || '');
        setAmount(item.amount.toString());
        setCategory(item.category || {});
        setEditingId(item.id);
        setEditingType(item.type || 'expense'); // Bug 3: set the correct type for editing
    };

    // Bug 3 fix: Accept explicit overrides so caller data is always used,
    // not stale context state. Falls back to context state if no override.
    const handleUpdateExpense = (navigation, overrides = {}) => {
        const t = overrides.title ?? title;
        const amt = overrides.amount ?? amount;
        const cat = overrides.category ?? category;

        if (!t || !amt || !cat?.name) {
            showGlobalAlert({
                title: 'Missing Fields',
                message: 'All fields are required',
                icon: 'alert-circle',
                iconColor: '#F43F5E',
                primaryButtonText: 'Okay'
            });
            return;
        }
        setExpenses(prev => {
            const updated = prev.map(e =>
                e.id === editingId
                    ? { ...e, title: t.toString().trim(), amount: parseFloat(parseFloat(amt).toFixed(2)), category: cat, icon: cat.icon }
                    : e
            );

            // Check budget alert for the category
            const budgetLimit = budgets[cat.name] || 0;
            if (budgetLimit > 0) {
                const totalInCat = updated
                    .filter(e => e.category?.name === cat.name)
                    .reduce((sum, e) => sum + Number(e.amount), 0);

                if (totalInCat > budgetLimit) {
                    const percentage = Math.round((totalInCat / budgetLimit) * 100);
                    sendBudgetWarning(cat.name, percentage);
                }
            }
            return updated;
        });
        logAppNotification("💸 Expense Updated", `✅ ${currencySymbol}${parseFloat(amt).toFixed(2)}: ${t.toString().trim()}`, 'success');
        resetForm();
        navigation.navigate('Home');
    };

    const handleDelete = (id) => {
        setExpenses(prev => prev.filter(item => item.id !== id));
    };

    // ── Income CRUD ───────────────────────────────────────────
    const handleAddIncome = async ({ amount, source, date, navigation }) => {
        if (!amount || !source) {
            showGlobalAlert({
                title: 'Missing Fields',
                message: 'Please fill all fields',
                icon: 'alert-circle',
                iconColor: '#F43F5E',
                primaryButtonText: 'Okay'
            });
            return;
        }

        const newIncome = {
            id: `inc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: source.trim(),
            amount: parseFloat(parseFloat(amount).toFixed(2)),
            date: date || getLocalDate(),
            type: 'income',
            icon: '💰'
        };
        setIncomes(prev => [newIncome, ...prev]);
        logAppNotification("💰 Income Added", `✅ ${currencySymbol}${parseFloat(amount).toFixed(2)}: ${source.trim()}`, 'success');
        resetForm();
        if (navigation) navigation.navigate('Home');
    };

    const handleDeleteIncome = (id) => {
        setIncomes(prev => prev.filter(item => item.id !== id));
    };

    const handleAddTransaction = (navigation, { type, title: t, amount: amt, category: cat, date: d }) => {
        if (type === 'income') {
            handleAddIncome({ amount: amt, source: t, date: d, navigation });
        } else {
            handleAddExpense({ title: t, amount: amt, category: cat, date: d, navigation });
        }
    };

    // Bug 3 fix: pass explicit params to handleUpdateExpense instead of relying on stale context state
    const handleUpdateTransaction = (navigation, { type, title: t, amount: amt, category: cat }) => {
        if (type === 'income') {
            setIncomes(prev => prev.map(inv => inv.id === editingId ? { ...inv, source: t, amount: parseFloat(parseFloat(amt).toFixed(2)) } : inv));
            logAppNotification("💰 Income Updated", `✅ ${currencySymbol}${parseFloat(amt).toFixed(2)}: ${t.trim()}`, 'success');
        } else {
            handleUpdateExpense(navigation, { title: t, amount: amt, category: cat });
            return;
        }
        resetForm();
        navigation.navigate('Home');
    };

    // ── Budget actions ─────────────────────────────────────
    const setBudget = (categoryName, limit) => {
        setBudgets(prev => {
            const newBudgets = { ...prev, [categoryName]: limit };
            AsyncStorage.setItem('budgets', JSON.stringify(newBudgets)).catch(e =>
                console.log('Error saving budgets:', e)
            );
            return newBudgets;
        });
    };

    const setCurrency = (c) => {
        setCurrencyState(c);
        AsyncStorage.setItem('currency', c).catch(e => console.log('Error saving currency:', e));
    };

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        AsyncStorage.setItem('isDarkMode', JSON.stringify(newMode)).catch(e => console.log('Error saving dark mode:', e));
    };

    const handleLogout = async () => {
        try {
            // Unsubscribe from any listeners if needed
            await auth.signOut();

            // Clear Local Local State
            setExpenses([]);
            setIncomes([]);
            setBudgets({});
            setAppNotifications([]);
            setUserNameState('');
            setHasFetchedFromCloud(false); // Reset cloud fetch state on logout

            // Clear Local Storage
            const allKeys = await AsyncStorage.getAllKeys();
            const keysToRemove = allKeys.filter(key => 
                [
                    'expenses', 'incomes', 'budgets', 'appNotifications', 'userName',
                    'lastProcessedMonth', 'prevMonthSummary', 'recurringTransactions',
                    'hasCompletedTour', 'shouldStartTour',
                    'monthlySummaryScheduled', 'dailyReminderScheduledWeek',
                    'isSetupComplete'
                ].includes(key) || key.startsWith('recurring_done_')
            );
            await AsyncStorage.multiRemove(keysToRemove);

            // Clear today's smart notification key
            const today_str = new Date().toISOString().split('T')[0];
            await AsyncStorage.removeItem(`smartNotif_${today_str}`);

            setIsSetupComplete(false);

            // Refresh local categories
            setCategoriesList(categories);

            // RevenueCat Logout
            await RevenueCatService.logOut();
            setIsPremium(false);

            return true;
        } catch (error) {
            console.error("Logout Error:", error);
            showGlobalAlert({
                title: 'Logout Error',
                message: 'Failed to log out. Please try again.',
                icon: 'alert-circle',
                iconColor: '#F43F5E',
                primaryButtonText: 'Got it'
            });
            return false;
        }
    };

    const handleWipeData = async () => {
        const user = auth.currentUser;
        if (!user) {
            await handleLogout();
            return true;
        }

        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                expenses: [],
                incomes: [],
                budgets: {},
                recurringTransactions: [],
                isSetupComplete: false,
                userName: user.displayName || '',
                currency: currency || 'USD',
                customCategories: categories,
                prevMonthSummary: null
            });

            await handleLogout();
            return true;
        } catch (error) {
            console.error('Error wiping data:', error);
            return false;
        }
    };

    // ── Derived values (Monthly First) ────────────────────────
    const currentMonth = getYearMonth();

    const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
    const monthlyIncomes = incomes.filter(i => i.date.startsWith(currentMonth));

    const totalSpent = monthlyExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalIncome = monthlyIncomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const balance = totalIncome - totalSpent;

    // Cache Data for Home Screen Widget
    useEffect(() => {
        if (isLoading) return;
        const forecastData = getSmartForecastData({
            totalIncome,
            totalSpent,
            monthlyExpenses,
            categoriesWithBudget: categoriesList.map(cat => ({
                ...cat,
                budgetLimit: budgets[cat.name] || 0,
                amountSpent: monthlyExpenses
                    .filter(exp => exp.category?.name === cat.name)
                    .reduce((sum, exp) => sum + Number(exp.amount), 0)
            })),
            prevMonthSummary
        });

        const widgetCache = {
            safeDailySpend: forecastData.safeDailySpend,
            currencySymbol,
        };
        AsyncStorage.setItem('widget_data_cache', JSON.stringify(widgetCache))
            .catch(e => console.log('Error caching widget data:', e));

    }, [totalIncome, totalSpent, expenses, budgets, categoriesList, currencySymbol, isLoading]);

    // Smart Insights
    const monthlySummary = useMemo(() => {
        const topCatItem = monthlyExpenses.reduce((acc, curr) => {
            const catName = curr.category?.name || 'Uncategorized';
            acc[catName] = (acc[catName] || 0) + Number(curr.amount);
            return acc;
        }, {});

        const topCategoryName = Object.keys(topCatItem).sort((a, b) => topCatItem[b] - topCatItem[a])[0] || 'None';

        const now = new Date();
        const today = now.getDate();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const isClosingTime = today >= lastDay - 2; // Last 3 days
        const isLastDay = today === lastDay;
        const isPreClosing = isClosingTime && !isLastDay;

        return {
            topCategory: topCategoryName,
            isClosingTime,
            isLastDay,
            isPreClosing,
            savings: balance,
            isDebt: balance < 0
        };
    }, [monthlyExpenses, balance]);

    const allTransactions = useMemo(() => {
        return [
            ...expenses.map(e => ({ ...e, type: 'expense' })),
            ...incomes.map(i => ({ ...i, type: 'income', title: i.source || i.title, category: { name: 'Income', icon: '💰' } }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses, incomes]);

    const filteredExpenses = (() => {
        const now = new Date();
        const todayStr = getLocalDate(now);
        if (selectedPeriod === 'today') {
            return expenses.filter(e => e.date === todayStr);
        }
        if (selectedPeriod === 'week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return expenses.filter(e => new Date(e.date) >= weekAgo);
        }
        if (selectedPeriod === 'month') {
            return expenses.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        }
        return expenses; // 'all'
    })();

    // ── Derived Budgets ───────────────────────────────────────
    const categoriesWithBudget = useMemo(() => {
        return categoriesList.map(cat => {
            const budgetLimit = budgets[cat.name] || 0;
            // ✅ Only count current month's expenses — prevents previous month's data
            // from triggering false "Budget Exceeded" warnings in a new month.
            const amountSpent = monthlyExpenses
                .filter(exp => exp.category?.name === cat.name)
                .reduce((sum, exp) => sum + Number(exp.amount), 0);

            return {
                ...cat,
                budgetLimit,
                amountSpent
            };
        });
    }, [monthlyExpenses, budgets, categoriesList]);

    // ── Helpers ───────────────────────────────────────────────
    const getCategorySuggestion = (text) => {
        if (!text) return null;
        const lowerText = text.toLowerCase();

        const suggestions = {
            // Transport
            'uber': 'Transport', 'bolt': 'Transport', 'taxi': 'Transport', 'grab': 'Transport', 'lyft': 'Transport', 'metro': 'Transport', 'train': 'Transport', 'bus': 'Transport', 'fuel': 'Transport', 'gas': 'Transport', 'petrol': 'Transport', 'parking': 'Transport', 'flight': 'Transport', 'airline': 'Transport', 'car': 'Transport', 'auto': 'Transport', 'toll': 'Transport', 'ferry': 'Transport', 'transit': 'Transport', 'shell': 'Transport', 'chevron': 'Transport', 'exxon': 'Transport',

            // Food & Dining
            'kfc': 'Food', 'mcdonald': 'Food', 'burger': 'Food', 'pizza': 'Food', 'starbucks': 'Food', 'restaurant': 'Food', 'dinner': 'Food', 'lunch': 'Food', 'breakfast': 'Food', 'cafe': 'Food', 'subway': 'Food', 'domino': 'Food', 'dunkin': 'Food', 'food': 'Food', 'eat': 'Food', 'snack': 'Food', 'coffee': 'Food', 'tea': 'Food', 'drink': 'Food', 'bar': 'Food', 'pub': 'Food', 'bakery': 'Food', 'sushi': 'Food', 'taco': 'Food', 'wendy': 'Food', 'chipotle': 'Food', 'kitchen': 'Food', 'deli': 'Food', 'grill': 'Food', 'chicken': 'Food', 'steak': 'Food', 'seafood': 'Food', 'doordash': 'Food', 'ubereats': 'Food', 'grubhub': 'Food', 'deliveroo': 'Food',

            // Bills & Utilities
            'rent': 'Bills', 'electricity': 'Bills', 'water': 'Bills', 'internet': 'Bills', 'phone': 'Bills', 'mobile': 'Bills', 'utility': 'Bills', 'insurance': 'Bills', 'tax': 'Bills', 'council': 'Bills', 'mortgage': 'Bills', 'loan': 'Bills', 'credit': 'Bills', 'cable': 'Bills', 'trash': 'Bills', 'sewage': 'Bills', 'fee': 'Bills', 'bill': 'Bills', 'verizon': 'Bills', 'att': 'Bills', 't-mobile': 'Bills', 'comcast': 'Bills', 'xfinity': 'Bills',

            // Subscriptions
            'netflix': 'Subscription', 'spotify': 'Subscription', 'apple': 'Subscription', 'youtube': 'Subscription', 'disney': 'Subscription', 'amazon prime': 'Subscription', 'hbo': 'Subscription', 'gym': 'Subscription', 'hulu': 'Subscription', 'prime video': 'Subscription', 'patreon': 'Subscription', 'adobe': 'Subscription', 'microsoft': 'Subscription', 'xbox': 'Subscription', 'playstation': 'Subscription', 'nintendo': 'Subscription', 'cloud': 'Subscription', 'premium': 'Subscription', 'membership': 'Subscription', 'crunchyroll': 'Subscription',

            // Shopping
            'walmart': 'Shopping', 'amazon': 'Shopping', 'target': 'Shopping', 'grocery': 'Shopping', 'market': 'Shopping', 'shop': 'Shopping', 'store': 'Shopping', 'mall': 'Shopping', 'clothing': 'Shopping', 'ebay': 'Shopping', 'adidas': 'Shopping', 'nike': 'Shopping', 'ikea': 'Shopping', 'costco': 'Shopping', 'best buy': 'Shopping', 'home depot': 'Shopping', 'zara': 'Shopping', 'h&m': 'Shopping', 'hm': 'Shopping', 'apparel': 'Shopping', 'shoes': 'Shopping', 'electronics': 'Shopping', 'supermarket': 'Shopping', 'retail': 'Shopping', 'aldi': 'Shopping', 'trader joe': 'Shopping', 'whole foods': 'Shopping', 'kroger': 'Shopping',

            // Health
            'hospital': 'Health', 'pharmacy': 'Health', 'doctor': 'Health', 'medicine': 'Health', 'dentist': 'Health', 'clinic': 'Health', 'vet': 'Health', 'fitness': 'Health', 'therapy': 'Health', 'optometrist': 'Health', 'vision': 'Health', 'medical': 'Health', 'pill': 'Health', 'rx': 'Health', 'drugstore': 'Health', 'cvs': 'Health', 'walgreens': 'Health', 'walgreens': 'Health', 'rite aid': 'Health',

            // Education
            'school': 'Education', 'college': 'Education', 'university': 'Education', 'course': 'Education', 'tutor': 'Education', 'book': 'Education', 'tuition': 'Education', 'student': 'Education', 'class': 'Education', 'training': 'Education', 'udemy': 'Education', 'coursera': 'Education', 'masterclass': 'Education',

            // Income
            'salary': 'Income', 'bonus': 'Income', 'freelance': 'Income', 'dividend': 'Income', 'interest': 'Income', 'refund': 'Income', 'paycheck': 'Income', 'wage': 'Income', 'gift': 'Income'
        };

        for (const [key, cat] of Object.entries(suggestions)) {
            if (lowerText.includes(key)) {
                return categoriesList.find(c => c.name === cat) || categoriesList.find(c => c.name.includes(cat)) || null;
            }
        }
        return null;
    };

    const refreshData = async () => {
        setIsLoading(true);
        await loadData();
    };

    const value = useMemo(() => ({
        // State
        expenses, setExpenses,
        incomes, setIncomes,
        amount, setAmount,
        title, setTitle,
        category, setCategory,
        editingId, setEditingId,
        editingType, setEditingType,
        isLoading,
        categoriesList,
        // Category actions
        handleAddCategory,
        // Auth actions
        handleLogout, handleWipeData, checkAndResetMonth,
        // Date filter
        selectedPeriod, setSelectedPeriod,
        filteredExpenses,
        // Budget & Preferences
        budgets, setBudget, setBudgets,
        currency, setCurrency,
        isDarkMode, toggleDarkMode,
        isFirstLaunch, completeOnboarding,
        userName, setUserName,
        recurringTransactions, addRecurringTransaction, deleteRecurringTransaction, updateRecurringTransaction,
        currencySymbol,
        // Derived
        allTransactions,
        totalSpent, totalIncome, balance,
        monthlySummary,
        categoriesWithBudget,
        // Expense actions
        handleAddExpense, handleEdit, handleUpdateExpense, handleDelete,
        // Income actions
        handleAddIncome, handleDeleteIncome,
        // Unified Actions
        handleAddTransaction, handleUpdateTransaction,
        appNotifications, logAppNotification,
        prevMonthSummary, getCategorySuggestion,
        hasFetchedFromCloud, setHasFetchedFromCloud,
        isSetupComplete, setIsSetupComplete,
        handleLogout, handleWipeData, checkAndResetMonth,
        getLocalDate, getYearMonth,
        refreshData,
        tabLayouts, updateTabLayout,
        hasRatedApp, setHasRatedApp,
        showRatingPrompt, setShowRatingPrompt, startRatingTimer,
        globalAlert, showGlobalAlert, hideGlobalAlert,
        isPremium, setIsPremium
    }), [
        expenses, incomes, amount, title, category, editingId, editingType, isLoading, categoriesList,
        selectedPeriod, filteredExpenses, budgets, currency, isDarkMode, isFirstLaunch,
        userName, recurringTransactions, currencySymbol, allTransactions, totalSpent,
        totalIncome, balance, monthlySummary, categoriesWithBudget, appNotifications,
        prevMonthSummary, hasFetchedFromCloud, isSetupComplete, lastProcessedMonth,
        refreshData, tabLayouts, updateTabLayout, hasRatedApp, showRatingPrompt, startRatingTimer, 
        globalAlert, isPremium
    ]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
