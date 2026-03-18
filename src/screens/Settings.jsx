import { Alert, Share, Switch, Text, TouchableOpacity, View, StyleSheet, ScrollView, StatusBar, Image, TextInput, Modal, ActivityIndicator } from 'react-native'
import React, { useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'
import { AppContext } from '../Contex/ContextApi'
import { COLORS, SHADOW } from '../theme'
import { auth } from '../services/firebase'
import { updateProfile } from 'firebase/auth'
import tailwind from 'twrnc'
import { exportTransactionsToPDF } from '../services/ExportService'
import { currencies } from '../constants/currencies'
import AdService from '../services/AdService'

const Settings = ({ navigation }) => {
    const {
        expenses, incomes, currency, currencySymbol, setExpenses, setIncomes,
        isDarkMode, toggleDarkMode, recurringTransactions, setRecurringTransactions,
        handleLogout, userName, setUserName, allTransactions, handleWipeData
    } = useContext(AppContext)

    const [isEditModalVisible, setEditModalVisible] = React.useState(false)
    const [newName, setNewName] = React.useState(auth.currentUser?.displayName || '')
    const [isUpdating, setIsUpdating] = React.useState(false)

    const onLogoutPress = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        const success = await handleLogout();
                        if (!success) {
                            Alert.alert("Error", "Could not sign out. Please check your connection.");
                        }
                    }
                }
            ]
        )
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
        Alert.alert(
            'Clear Everything',
            'This will permanently delete ALL data from your device AND the cloud (Firestore). Your account will be reset to a fresh state. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: async () => {
                        setIsUpdating(true); // Using isUpdating as a generic loading state
                        const success = await handleWipeData();
                        setIsUpdating(false);
                        if (!success) {
                            Alert.alert('Error', 'Failed to wipe cloud data. Please check your connection.');
                        }
                    }
                }
            ]
        )
    }

    const handleExportCSV = () => {
        const header = 'Type,Title/Source,Amount,Category,Date\n'
        const expenseRows = expenses.map(e =>
            `Expense,"${e.title}",${e.amount},"${e.category?.name || ''}",${e.date}`
        ).join('\n')
        const incomeRows = incomes.map(i =>
            `Income,"${i.source || i.title || ''}",${i.amount},,${i.date}`
        ).join('\n')
        const csv = header + expenseRows + (incomeRows ? '\n' + incomeRows : '')

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
            Alert.alert("Error", "Failed to generate PDF report.");
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
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Account</Text>
                    <Text style={styles.subtitle}>Preferences and settings</Text>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    {auth.currentUser?.photoURL ? (
                        <Image source={{ uri: auth.currentUser.photoURL }} style={styles.avatarPic} />
                    ) : (
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={40} color="white" />
                        </View>
                    )}
                    <View style={tailwind`flex-1`}>
                        <View style={tailwind`flex-row items-center gap-2`}>
                            <Text style={styles.profileName} numberOfLines={1}>
                                {auth.currentUser?.displayName || 'Premium User'}
                            </Text>
                            <View style={styles.premiumBadge}>
                                <Ionicons name="star" size={10} color={COLORS.black} />
                                <Text style={styles.premiumText}>PRO</Text>
                            </View>
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

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Preferences</Text>
                    <MenuItem
                        icon="cash-outline"
                        label="Currency"
                        subtitle={`Currently using ${currency} (${currencySymbol})`}
                        onPress={() => navigation.navigate('SettingsCurrency', { isSettings: true })}
                        customIcon={currencySymbol}
                    />
                    {/* <MenuItem
                        icon="moon-outline"
                        label="Dark Mode"
                        subtitle={isDarkMode ? 'Appearance is Dark' : 'Appearance is Light'}
                        isSwitch
                    /> */}
                </View>

                {/* Recurring Items Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Recurring & Planning</Text>
                    <MenuItem
                        icon="calendar-outline"
                        label="Recurring Items"
                        subtitle={`${recurringTransactions.length} items auto-logged monthly`}
                        onPress={() => navigation.navigate('RecurringManager')}
                    />
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
                    <MenuItem
                        icon="document-text-outline"
                        label="Export Report (PDF)"
                        subtitle="Professional transaction summary"
                        onPress={handleExportPDF}
                    />
                    <MenuItem
                        icon="trash-outline"
                        label="Delete Profile Data"
                        subtitle="Wipes all local storage"
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
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerApp}>WALLET APP v1.0.0</Text>
                    <Text style={styles.footerMoto}>Premium Financial Tracking</Text>
                </View>
            </ScrollView>

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
