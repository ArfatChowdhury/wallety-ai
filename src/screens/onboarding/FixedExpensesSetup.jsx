import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import React, { useState, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import tailwind from 'twrnc'
import { COLORS, SHADOW } from '../../theme'
import { AppContext } from '../../Contex/ContextApi'

const FixedExpensesSetup = ({ navigation }) => {
    const { handleAddExpense, addRecurringTransaction } = useContext(AppContext);

    const [insurance, setInsurance] = useState('');
    const [rent, setRent] = useState('');
    const [debt, setDebt] = useState('');
    const [debtMonths, setDebtMonths] = useState('');

    const skipSetup = () => {
        navigation.navigate('InitialBudgetSetup');
    };

    const handleNext = () => {
        if (insurance) {
            addRecurringTransaction({
                id: 'setup-insurance',
                type: 'expense',
                title: 'Insurance',
                amount: parseFloat(insurance),
                category: { name: 'Insurance', icon: '🛡️', color: '#FF8C00' },
            });
        }
        if (rent) {
            addRecurringTransaction({
                id: 'setup-rent',
                type: 'expense',
                title: 'Rent',
                amount: parseFloat(rent),
                category: { name: 'Rent', icon: '🏠', color: '#8A2BE2' },
            });
        }
        if (debt) {
            addRecurringTransaction({
                id: 'setup-debt',
                type: 'expense',
                title: 'Bank Debt',
                amount: parseFloat(debt),
                category: { name: 'Bills', icon: '🧾', color: '#4ECDC4' },
                monthsRemaining: debtMonths ? parseInt(debtMonths) : null
            });
        }

        navigation.navigate('InitialBudgetSetup');
    }

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    <View style={tailwind`px-6 pt-10 flex-1`}>
                        <View style={tailwind`flex-row justify-between items-start`}>
                            <View>
                                <Text style={tailwind`text-sm font-bold text-primary uppercase tracking-widest`}>Step 4 of 5</Text>
                                <Text style={tailwind`text-3xl font-extrabold text-gray-900 mt-2`}>Fixed Expenses</Text>
                            </View>
                            <TouchableOpacity
                                onPress={skipSetup}
                                style={styles.skipHeaderBtn}
                            >
                                <Text style={styles.skipHeaderText}>Skip</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Smart Info Banner */}
                        <View style={styles.infoBanner}>
                            <Ionicons name="information-circle" size={24} color="#0D9488" />
                            <Text style={styles.infoText}>
                                <Text style={{ fontWeight: '800' }}>Auto-Log Enabled:</Text> These items will be automatically added for you at the start of every month.
                            </Text>
                        </View>

                        <View style={tailwind`mt-6`}>
                            {/* Insurance */}
                            <View style={styles.inputGroup}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.black} />
                                </View>
                                <View style={tailwind`flex-1 ml-4`}>
                                    <Text style={styles.label}>Monthly Insurance</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={insurance}
                                        onChangeText={setInsurance}
                                    />
                                </View>
                            </View>

                            {/* Rent */}
                            <View style={styles.inputGroup}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="home-outline" size={24} color={COLORS.black} />
                                </View>
                                <View style={tailwind`flex-1 ml-4`}>
                                    <Text style={styles.label}>Monthly Rent / Mortgage</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={rent}
                                        onChangeText={setRent}
                                    />
                                </View>
                            </View>

                            {/* Debt */}
                            <View style={styles.inputGroup}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="card-outline" size={24} color={COLORS.black} />
                                </View>
                                <View style={tailwind`flex-1 ml-4`}>
                                    <Text style={styles.label}>Bank Debt / Loan</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={debt}
                                        onChangeText={setDebt}
                                    />
                                    {debt !== '' && (
                                        <View style={tailwind`mt-2`}>
                                            <Text style={styles.subLabel}>How many months left?</Text>
                                            <TextInput
                                                style={[styles.input, tailwind`py-2 text-sm`]}
                                                placeholder="e.g. 12"
                                                keyboardType="numeric"
                                                value={debtMonths}
                                                onChangeText={setDebtMonths}
                                            />
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        <View style={tailwind`mt-auto pb-10 pt-6`}>
                            <TouchableOpacity
                                style={[styles.btn, (!insurance && !rent && !debt) && styles.disabledBtn]}
                                onPress={handleNext}
                                disabled={!insurance && !rent && !debt}
                            >
                                <Text style={styles.btnText}>Continue</Text>
                                <Ionicons
                                    name="arrow-forward"
                                    size={24}
                                    color={COLORS.white}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: '#F0FDFA',
        padding: 16,
        borderRadius: 20,
        marginTop: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 13,
        color: '#0D9488',
        fontWeight: '600',
        lineHeight: 18,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: 24,
        marginBottom: 16,
        ...SHADOW.sm,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.gray500,
        marginBottom: 4,
    },
    subLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.gray400,
        marginBottom: 4,
    },
    input: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.black,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    btn: {
        backgroundColor: COLORS.black,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        borderRadius: 24,
        gap: 12,
        ...SHADOW.md,
    },
    btnText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '800',
    },
    disabledBtn: {
        backgroundColor: COLORS.gray400,
        opacity: 0.6,
        ...SHADOW.none,
    },
    skipHeaderBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        marginTop: 4,
    },
    skipHeaderText: {
        color: COLORS.gray700,
        fontSize: 14,
        fontWeight: '700',
    }
})

export default FixedExpensesSetup
