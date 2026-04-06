import { Alert, Share, Switch, Text, TouchableOpacity, View, StyleSheet, ScrollView, StatusBar, Image, TextInput, Modal, ActivityIndicator, Linking, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useContext, useState, useRef, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import SpotlightTour from '../components/SpotlightTour'
import PremiumAlert from '../components/PremiumAlert'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'
import { AppContext } from '../Contex/ContextApi'
import { BannerAdComponent } from '../services/AdService'
import { COLORS, SHADOW } from '../theme'
import { auth } from '../services/firebase'
import { updateProfile } from 'firebase/auth'
import tailwind from 'twrnc'
import { exportTransactionsToPDF } from '../services/ExportService'
import { currencies } from '../constants/currencies'
import AdService from '../services/AdService'
import { requestWidgetUpdate } from 'react-native-android-widget'
import LimnersLogo from '../../assets/compay-logo/limners'
import RevenueCatService from '../services/RevenueCatService'
import * as WebBrowser from 'expo-web-browser';

const Settings = ({ navigation }) => {
    const {
        expenses, incomes, currency, currencySymbol, setExpenses, setIncomes,
        isDarkMode, toggleDarkMode, recurringTransactions, setRecurringTransactions,
        handleLogout, userName, setUserName, allTransactions, handleWipeData, startRatingTimer, showGlobalAlert,
        isPremium, setIsPremium
    } = useContext(AppContext)

    const [tourStep, setTourStep] = useState(-1);
    const [tourSteps, setTourSteps] = useState([]);
    const { width: W, height: H } = Dimensions.get('window');

    const currencyRef = useRef();
    const widgetRef = useRef();
    const recurringRef = useRef();
    const exportRef = useRef();
    const scrollViewRef = useRef();

    const tourStepsConfig = [
        {
            ref: currencyRef, shape: 'rect', title: 'Change Currency',
            body: 'Switch between 150+ currencies at any time. Your reports will automatically update.'
        },
        {
            ref: widgetRef, shape: 'rect', title: 'Home Screen Widget',
            body: 'Add our beautiful widget to your home screen to see your balance and log items without opening the app!'
        },
        {
            ref: recurringRef, shape: 'rect', title: 'Recurring Manager',
            body: 'View and manage all your automated subscriptions and income sources in one place.'
        },
        {
            ref: exportRef, shape: 'rect', title: 'Export Your Data',
            body: 'Download your financial history in PDF or CSV format for tax season or personal budgeting.'
        }
    ];

    const measureRefAbsolute = (ref) => {
        return new Promise((resolve) => {
            if (!ref.current) return resolve({ x: -1000, y: -1000, width: 0, height: 0 });
            ref.current.measure((fx, fy, width, height, px, py) => {
                if (px === undefined) resolve({ x: -1000, y: -1000, width: 0, height: 0 });
                else resolve({ x: px + width / 2, y: py + height / 2, width, height })
            })
        })
    }

    useFocusEffect(
        useCallback(() => {
            const checkTour = async () => {
                const shouldStart = await AsyncStorage.getItem('shouldStartSettingsTour');
                if (shouldStart === 'true') {
                    await AsyncStorage.removeItem('shouldStartSettingsTour');
                    
                    // Initialize empty steps so SpotlightTour knows it has 4 steps
                    setTourSteps(tourStepsConfig.map(c => ({
                        ...c, x: -1000, y: -1000, width: 0, height: 0
                    })));

                    // Start step 0 - Increased delay significantly (1.5s) to allow Ads to load and push layout
                    setTimeout(() => setTourStep(0), 1500);
                }
            };
            checkTour();
        }, [])
    );

    // Watch tourStep and dynamically scroll + measure
    React.useEffect(() => {
        if (tourStep >= 0 && tourStep < tourStepsConfig.length) {
            const stepConfig = tourStepsConfig[tourStep];
            if (!stepConfig.ref.current || !scrollViewRef.current) return;

            // 1. Measure relative to ScrollView to scroll to the item
            stepConfig.ref.current.measureLayout(
                scrollViewRef.current,
                (x, y, w, h) => {
                    // Scroll so item is roughly in the middle of the screen
                    scrollViewRef.current.scrollTo({ y: Math.max(0, y - H / 3), animated: true });
                    
                    // 2. Wait for scroll to finish, then measure absolute screen position
                    setTimeout(async () => {
                        const abs = await measureRefAbsolute(stepConfig.ref);
                        setTourSteps(prev => {
                            const newSteps = [...prev];
                            newSteps[tourStep] = {
                                ...newSteps[tourStep],
                                x: abs.x,
                                y: abs.y,
                                width: abs.width,
                                height: abs.height
                            };
                            return newSteps;
                        });
                    }, 800); // 800ms to allow for long scroll animations and Ad layouts to settle
                },
                () => { console.warn("Could not measure offset for scroll"); }
            );
        }
    }, [tourStep]);

    const [isEditModalVisible, setEditModalVisible] = useState(false)
    const [newName, setNewName] = useState(auth.currentUser?.displayName || '')
    const [isUpdating, setIsUpdating] = useState(false)
    const [showTourCompleteAlert, setShowTourCompleteAlert] = useState(false);

    const [isFeedbackModalVisible, setFeedbackModalVisible] = useState(false)
    const [feedbackMessage, setFeedbackMessage] = useState('')

    const [packages, setPackages] = useState([]);
    const [isFetchingPackages, setIsFetchingPackages] = useState(true);
    const [purchaseLoading, setPurchaseLoading] = useState(false);

    React.useEffect(() => {
        const setupRevenueCat = async () => {
            try {
                const active = await RevenueCatService.checkSubscriptionStatus();
                setIsPremium(active);
                if (!active) {
                    const pkgs = await RevenueCatService.getOfferings();
                    setPackages(pkgs);
                }
            } catch (error) {
                console.error("Error setting up RevenueCat", error);
            } finally {
                setIsFetchingPackages(false);
            }
        };
        setupRevenueCat();
    }, []);

    const handlePurchase = async (pkg) => {
        setPurchaseLoading(true);
        try {
            const result = await RevenueCatService.purchasePackage(pkg);
            if (result.success) {
                setIsPremium(true);
                Alert.alert("Success", "Welcome to Wallety PRO!");
            } else if (!result.userCancelled) {
                Alert.alert("Error", result.error || "Purchase failed.");
            }
        } catch (error) {
            console.error("Purchase error", error);
        } finally {
            setPurchaseLoading(false);
        }
    };

    const handleRestore = async () => {
        setPurchaseLoading(true);
        try {
            const result = await RevenueCatService.restorePurchases();
            if (result.success) {
                setIsPremium(true);
                Alert.alert("Success", "Purchases restored successfully!");
            } else {
                Alert.alert("Error", result.error || "No active subscriptions found.");
            }
        } catch (error) {
            console.error("Restore error", error);
        } finally {
            setPurchaseLoading(false);
        }
    };

    const openPrivacyPolicy = () => {
        WebBrowser.openBrowserAsync('https://wallety-nine.vercel.app/privacy');
    };

    const openTermsOfService = () => {
        WebBrowser.openBrowserAsync('https://wallety-nine.vercel.app/terms');
    };

    const onLogoutPress = () => {
        showGlobalAlert({
            title: "Logout",
            message: "Are you sure you want to log out?",
            icon: "log-out",
            iconColor: COLORS.expense,
            primaryButtonText: "Logout",
            secondaryButtonText: "Cancel",
            onPrimaryPress: async () => {
                const success = await handleLogout();
                if (!success) {
                    showGlobalAlert({
                        title: "Error",
                        message: "Could not sign out. Please check your connection.",
                        icon: "alert-circle",
                        iconColor: COLORS.expense,
                        primaryButtonText: "Got it"
                    });
                }
            }
        });
    }

    const handleUpdateName = async () => {
        if (!newName.trim()) return;
        setIsUpdating(true);
        try {
            await updateProfile(auth.currentUser, { displayName: newName.trim() });
            setUserName(newName.trim());
            setEditModalVisible(false);
        } catch (error) {
            Alert.alert("Error", "Failed to update name.");
        } finally {
            setIsUpdating(false);
        }
    }

    const handleClearAll = () => {
        showGlobalAlert({
            title: "Clear Everything",
            message: "This will permanently delete ALL data from your device AND the cloud (Firestore). Your account will be reset to a fresh state. Are you sure?",
            icon: "trash",
            iconColor: COLORS.expense,
            primaryButtonText: "Delete Everything",
            secondaryButtonText: "Cancel",
            onPrimaryPress: async () => {
                setIsUpdating(true);
                const success = await handleWipeData();
                setIsUpdating(false);
                if (!success) {
                    showGlobalAlert({
                        title: "Error",
                        message: "Failed to wipe cloud data. Please check your connection.",
                        icon: "alert-circle",
                        iconColor: COLORS.expense,
                        primaryButtonText: "Got it"
                    });
                }
            }
        });
    }

    const handleFeedback = () => {
        setFeedbackMessage('');
        setFeedbackModalVisible(true);
    };

    const handleSendFeedback = () => {
        if (!feedbackMessage.trim()) {
            Alert.alert('Empty Message', 'Please write something before sending.');
            return;
        }

        const email = 'limnersapp@gmail.com';
        const subject = 'App Feedback / Support';
        const body = feedbackMessage.trim();
        const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
                setFeedbackModalVisible(false);
            } else {
                Alert.alert('Error', 'Email app is not available.');
            }
        });
    };

    const handleExportCSV = async () => {
        const header = 'Type,Title/Source,Amount,Category,Date\n'
        const expenseRows = expenses.map(e =>
            `Expense,"${e.title}",${e.amount},"${e.category?.name || ''}",${e.date}`
        ).join('\n')
        const incomeRows = incomes.map(i =>
            `Income,"${i.source || i.title || ''}",${i.amount},,${i.date}`
        ).join('\n')
        const csv = header + expenseRows + (incomeRows ? '\n' + incomeRows : '')

            // Show interstitial ad before exporting CSV
            await AdService.showPdfExportAd(); // Reusing the same interstitial logic for now
            Share.share({
                message: csv,
                title: 'My Expense Data',
            })
    }

    const handleExportPDF = async () => {
        try {
            // Show interstitial ad before exporting PDF
            await AdService.showPdfExportAd();
            await exportTransactionsToPDF(allTransactions, currencySymbol, auth.currentUser?.displayName || userName);
        } catch (error) {
            showGlobalAlert({
                title: 'Error',
                message: 'Failed to generate PDF report.',
                icon: 'alert-circle',
                iconColor: '#F43F5E',
                primaryButtonText: 'Got it'
            });
        }
    }

    const promptAddWidget = async () => {
        try {
            await requestWidgetUpdate({
                widgetName: 'ExpenseWidget',
                renderWidget: () => <TextWidget text="Quick Expense" />, // Fallback/Basic update call to trigger pinning if supported
            });
            // Note: direct requestPinAppWidget call is preferred if available in the package
            // But since the prompt specifically mentioned requestWidgetUpdate for this task:
            showGlobalAlert({
                title: 'Widget',
                message: "To add the widget, long press your home screen and find 'Expense Tracker' in the widgets list.",
                icon: 'grid',
                iconColor: COLORS.primary,
                primaryButtonText: 'Got it'
            });

        } catch (error) {
            console.error("Error prompting widget:", error);
        }
    }

    const MenuItem = ({ icon, label, subtitle, onPress, danger, isSwitch, customIcon }) => (
        <TouchableOpacity
            onPress={onPress}
            disabled={!onPress && !isSwitch}
            style={styles.menuItem}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBox, danger ? styles.dangerIcon : styles.neutralIcon]}>
                {customIcon ? (
                    <Text style={[tailwind`text-lg font-bold`, { color: danger ? COLORS.expense : COLORS.textMain }]}>{customIcon}</Text>
                ) : (
                    <Ionicons name={icon} size={20} color={danger ? COLORS.expense : COLORS.textMain} />
                )}
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, danger && styles.dangerLabel]}>{label}</Text>
                {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
            </View>
            {isSwitch ? (
                <Switch
                    value={isDarkMode}
                    onValueChange={toggleDarkMode}
                    trackColor={{ false: COLORS.gray200, true: COLORS.black }}
                    thumbColor="#ffffff"
                />
            ) : onPress ? (
                <Ionicons name="chevron-forward" size={18} color={COLORS.gray400} />
            ) : null}
        </TouchableOpacity>
    )

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="dark-content" />
            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Account</Text>
                    <Text style={styles.subtitle}>Preferences and settings</Text>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    {auth.currentUser?.photoURL ? (
                        <Image source={{ uri: auth.currentUser.photoURL }} style={styles.avatarPic} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: COLORS.black, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }]}>
                            <Text style={{ color: 'white', fontSize: 28, fontWeight: '900' }}>
                                {(auth.currentUser?.displayName || 'P').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <View style={tailwind`flex-1`}>
                        <View style={tailwind`flex-row items-center gap-2`}>
                            <Text style={styles.profileName} numberOfLines={1}>
                                {auth.currentUser?.displayName || 'Premium User'}
                            </Text>
                            {isPremium && (
                                <View style={styles.premiumBadge}>
                                    <Ionicons name="star" size={10} color={COLORS.black} />
                                    <Text style={styles.premiumText}>PRO</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.profileEmail} numberOfLines={1}>
                            {auth.currentUser?.email || 'Diamond Member'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setNewName(auth.currentUser?.displayName || '');
                            setEditModalVisible(true);
                        }}
                        style={styles.editBtn}
                    >
                        <Ionicons name="pencil" size={18} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Premium Subscription Section */}
                {!isPremium ? (
                    <View style={[styles.section, { paddingHorizontal: 20 }]}>
                        <View style={{ backgroundColor: COLORS.card, borderRadius: 24, padding: 20, ...SHADOW.md }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                                    <Ionicons name="star" size={20} color="#FFD700" />
                                </View>
                                <View>
                                    <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.white }}>Upgrade to PRO</Text>
                                    <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Unlock all features</Text>
                                </View>
                            </View>

                            <View style={{ marginBottom: 20 }}>
                                {['Unlimited tracking', 'Advanced AI Analytics', 'Export data to PDF/CSV', 'Priority Support'].map((feat, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <Ionicons name="checkmark-circle" size={16} color="#4ADE80" style={{ marginRight: 8 }} />
                                        <Text style={{ color: 'white', fontSize: 14 }}>{feat}</Text>
                                    </View>
                                ))}
                            </View>

                            {isFetchingPackages ? (
                                <ActivityIndicator size="small" color="white" style={{ marginVertical: 20 }} />
                            ) : packages.length > 0 ? (
                                <View style={{ gap: 10 }}>
                                    {packages.map((pkg) => {
                                        const isAnnual = pkg.identifier === 'annual' || pkg.packageType === 'ANNUAL';
                                        return (
                                            <TouchableOpacity 
                                                key={pkg.identifier}
                                                onPress={() => handlePurchase(pkg)}
                                                disabled={purchaseLoading}
                                                style={{ 
                                                    backgroundColor: isAnnual ? '#FFD700' : 'rgba(255,255,255,0.1)', 
                                                    borderRadius: 16, 
                                                    padding: 15,
                                                    borderWidth: isAnnual ? 0 : 1,
                                                    borderColor: 'rgba(255,255,255,0.3)',
                                                    flexDirection: 'row',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <Text style={{ color: isAnnual ? COLORS.black : 'white', fontSize: 16, fontWeight: '700' }}>
                                                            {isAnnual ? 'Yearly' : 'Monthly'}
                                                        </Text>
                                                        {isAnnual && (
                                                            <View style={{ backgroundColor: '#FF3B30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                                <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>SAVE 30%</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={{ color: isAnnual ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 }}>
                                                        {pkg.product.description}
                                                    </Text>
                                                </View>
                                                <Text style={{ color: isAnnual ? COLORS.black : 'white', fontSize: 18, fontWeight: '800' }}>
                                                    {pkg.product.priceString}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                    
                                    <TouchableOpacity onPress={handleRestore} disabled={purchaseLoading} style={{ alignItems: 'center', marginTop: 10, padding: 10 }}>
                                        {purchaseLoading ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' }}>Restore Purchases</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={{ color: 'white', textAlign: 'center', opacity: 0.7 }}>No subscription packages available right now.</Text>
                            )}
                        </View>
                        <View style={{ marginTop: 25, height: 65, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <BannerAdComponent />
                        </View>
                    </View>
                ) : (
                    <View style={[styles.section, { paddingHorizontal: 20 }]}>
                        <View style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)', flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#4ADE80', justifyContent: 'center', alignItems: 'center', marginRight: 15 }}>
                                <Ionicons name="star" size={20} color="white" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.textMain }}>Premium Active</Text>
                                <Text style={{ fontSize: 13, color: COLORS.textSub, marginTop: 2 }}>You have access to all PRO features.</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Preferences</Text>
                    <View ref={currencyRef} collapsable={false}>
                         <MenuItem
                            icon="cash-outline"
                            label="Currency"
                            subtitle={`Currently using ${currency} (${currencySymbol})`}
                            onPress={() => navigation.navigate('SettingsCurrency', { isSettings: true })}
                            customIcon={currencySymbol}
                        />
                    </View>

                    <View ref={widgetRef} collapsable={false}>
                        <MenuItem
                            icon="apps-outline"
                            label="Add Home Screen Widget"
                            subtitle="Log expenses without opening the app"
                            onPress={promptAddWidget}
                        />
                    </View>
                    <View style={{ marginTop: 10, height: 65, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <BannerAdComponent />
                    </View>
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Support & Feedback</Text>
                    <MenuItem
                        icon="chatbubble-outline"
                        label="Give Feedback"
                        subtitle="Share suggestions or report bugs"
                        onPress={handleFeedback}
                    />
                    <View style={{ marginTop: 10, height: 65, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <BannerAdComponent />
                    </View>
                </View>

                {/* Recurring Items Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Recurring & Planning</Text>
                    <View ref={recurringRef} collapsable={false}>
                        <MenuItem
                            icon="calendar-outline"
                            label="Recurring Items"
                            subtitle={`${recurringTransactions.length} items auto-logged monthly`}
                            onPress={() => navigation.navigate('RecurringManager')}
                        />
                    </View>
                    <View style={{ marginTop: 10, height: 65, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <BannerAdComponent />
                    </View>
                </View>

                {/* Actions Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Data & Security</Text>
                    <MenuItem
                        icon="cloud-download-outline"
                        label="Export Data (CSV)"
                        subtitle="Share raw transaction data"
                        onPress={handleExportCSV}
                    />
                    <View ref={exportRef} collapsable={false}>
                        <MenuItem
                            icon="document-text-outline"
                            label="Export Report (PDF)"
                            subtitle="Professional transaction summary"
                            onPress={handleExportPDF}
                        />
                    </View>
                    <MenuItem
                        icon="trash-outline"
                        label="Delete Profile Data"
                        subtitle="Permanently erases all data from device & cloud"
                        onPress={handleClearAll}
                        danger
                    />
                    <MenuItem
                        icon="log-out-outline"
                        label="Logout"
                        subtitle="Sign out of your account"
                        onPress={onLogoutPress}
                        danger
                    />
                    <View style={{ marginTop: 10, height: 65, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <BannerAdComponent />
                    </View>
                </View>

                {/* Legal Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Legal</Text>
                    <MenuItem
                        icon="shield-checkmark-outline"
                        label="Privacy Policy"
                        subtitle="How we handle your data"
                        onPress={openPrivacyPolicy}
                    />
                    <MenuItem
                        icon="document-text-outline"
                        label="Terms of Service"
                        subtitle="Our service agreement"
                        onPress={openTermsOfService}
                    />
                </View>

                {/* Footer */}
                <View style={[styles.footer, { paddingBottom: 20 }]}>
                    <View style={{ width: '50%', height: 40, marginBottom: 15, opacity: 0.6 }}>
                        <LimnersLogo />
                    </View>
                    <Text style={styles.footerApp}>WALLET APP v1.0.0</Text>
                    <Text style={styles.footerMoto}>Premium Financial Tracking</Text>
                </View>
            </ScrollView>

            {tourStep >= 0 && (
                <SpotlightTour
                    steps={tourSteps}
                    currentStep={tourStep}
                    onNext={() => {
                        if (tourStep >= tourSteps.length - 1) {
                            setTourStep(-1);
                            setShowTourCompleteAlert(true);
                        } else {
                            setTourStep(tourStep + 1);
                        }
                    }}
                    onSkip={() => {
                        setTourStep(-1);
                        setShowTourCompleteAlert(true);
                    }}
                />
            )}

            <Modal
                visible={isEditModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Name</Text>
                        <TextInput
                            style={styles.input}
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Enter your name"
                            placeholderTextColor={COLORS.gray400}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setEditModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={handleUpdateName}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            
            {/* Feedback Modal */}
            <Modal
                visible={isFeedbackModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setFeedbackModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={tailwind`flex-row justify-between items-center mb-4`}>
                            <Text style={styles.modalTitle}>Share Feedback</Text>
                            <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.textSub} />
                            </TouchableOpacity>
                        </View>

                        <Text style={tailwind`text-xs text-gray-500 mb-4 font-bold uppercase tracking-wider`}>Your message to the developers</Text>

                        <TextInput
                            style={[styles.input, { height: 120, textAlignVertical: 'top', paddingTop: 15 }]}
                            value={feedbackMessage}
                            onChangeText={setFeedbackMessage}
                            placeholder="Type your feedback here..."
                            placeholderTextColor={COLORS.gray400}
                            multiline
                            autoFocus
                        />

                        <TouchableOpacity
                            style={[styles.saveBtn, { flexDirection: 'row', gap: 10, paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10 }]}
                            onPress={handleSendFeedback}
                        >
                            <Ionicons name="send" size={18} color="white" />
                            <Text style={styles.saveBtnText}>Send via Email</Text>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
            
            {/* Final Banner Ad at bottom - shifted up for tabbar */}
            <View style={{ backgroundColor: COLORS.background, paddingVertical: 10, height: 65, width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 110 }}>
                <BannerAdComponent />
            </View>

            <PremiumAlert 
                visible={showTourCompleteAlert}
                title="Tour Complete!"
                message="You're all set to manage your finances like a pro."
                icon="rocket"
                iconColor={COLORS.primary}
                primaryButtonText="Let's Go!"
                onPrimaryPress={() => {
                    setShowTourCompleteAlert(false);
                    if (startRatingTimer) startRatingTimer();
                    navigation.navigate('BottomTabs', { screen: 'Home' });
                }}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingBottom: 120 },
    header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 25 },
    title: { fontSize: 28, fontWeight: '800', color: COLORS.textMain },
    subtitle: { fontSize: 14, color: COLORS.textSub, marginTop: 4 },

    profileCard: {
        backgroundColor: COLORS.card,
        marginHorizontal: 20,
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginBottom: 35,
        ...SHADOW.md,
    },
    avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    avatarPic: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
    profileName: { color: 'white', fontSize: 18, fontWeight: '800' },
    profileEmail: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600', marginTop: 2 },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 2,
    },
    premiumText: { color: COLORS.black, fontSize: 10, fontWeight: '900' },
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: COLORS.white, width: '100%', borderRadius: 28, padding: 24, ...SHADOW.lg },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textMain, marginBottom: 20 },
    input: {
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textMain,
        marginBottom: 24,
    },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
    cancelBtn: { backgroundColor: COLORS.gray100 },
    cancelBtnText: { color: COLORS.textSub, fontWeight: '700' },
    saveBtn: { backgroundColor: COLORS.black },
    saveBtnText: { color: COLORS.white, fontWeight: '700' },

    section: { marginBottom: 35 },
    sectionHeader: { fontSize: 12, fontWeight: '800', color: COLORS.gray400, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, paddingHorizontal: 25 },

    currencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
    currencyBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
    currencyBtnActive: { backgroundColor: COLORS.black, borderColor: COLORS.black },
    currencyText: { fontSize: 14, fontWeight: '700', color: COLORS.textSub },
    currencyTextActive: { color: COLORS.white },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
        ...SHADOW.sm,
    },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    neutralIcon: { backgroundColor: COLORS.gray100 },
    dangerIcon: { backgroundColor: '#FFF1F2' },
    menuContent: { flex: 1 },
    menuLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
    dangerLabel: { color: COLORS.expense },
    menuSubtitle: { fontSize: 12, color: COLORS.textSub, marginTop: 2, fontWeight: '600' },

    footer: { alignItems: 'center', marginTop: 20 },
    footerApp: { fontSize: 11, fontWeight: '800', color: COLORS.gray400, letterSpacing: 1 },
    footerMoto: { fontSize: 10, color: COLORS.gray400, marginTop: 4, fontWeight: '600' },
})

export default Settings
