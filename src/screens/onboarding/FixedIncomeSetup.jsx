import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import React, { useState, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import tailwind from 'twrnc'
import { COLORS, SHADOW } from '../../theme'
import { AppContext } from '../../Contex/ContextApi'

const FixedIncomeSetup = ({ navigation }) => {
    const { handleAddIncome, addRecurringTransaction } = useContext(AppContext);

    const [salary, setSalary] = useState('');
    const [business, setBusiness] = useState('');
    const [sideHustle, setSideHustle] = useState('');

    const skipSetup = () => {
        navigation.navigate('FixedExpensesSetup');
    };

    const handleNext = () => {
        if (salary) {
            addRecurringTransaction({
                id: 'setup-salary',
                type: 'income',
                title: 'Salary',
                amount: parseFloat(salary),
                category: { name: 'Salary', icon: '💰' },
            });
        }
        if (business) {
            addRecurringTransaction({
                id: 'setup-business',
                type: 'income',
                title: 'Business Profit',
                amount: parseFloat(business),
                category: { name: 'Salary', icon: '🏢' },
            });
        }
        if (sideHustle) {
            addRecurringTransaction({
                id: 'setup-side-hustle',
                type: 'income',
                title: 'Side Hustle',
                amount: parseFloat(sideHustle),
                category: { name: 'Salary', icon: '⚡' },
            });
        }

        navigation.navigate('FixedExpensesSetup');
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
                                <Text style={tailwind`text-sm font-bold text-primary uppercase tracking-widest`}>Step 3 of 5</Text>
                                <Text style={tailwind`text-3xl font-extrabold text-gray-900 mt-2`}>Monthly Income</Text>
                            </View>
                            <TouchableOpacity
                                onPress={skipSetup}
                                style={styles.skipHeaderBtn}
                            >
                                <Text style={styles.skipHeaderText}>Skip</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.infoBanner}>
                            <Ionicons name="information-circle" size={24} color="#0D9488" />
                            <Text style={styles.infoText}>
                                <Text style={{ fontWeight: '800' }}>Tip:</Text> You can edit or delete these anytime in <Text style={{ fontWeight: '700' }}>Settings {'>'} Recurring Items</Text>.
                            </Text>
                        </View>

                        <View style={tailwind`mt-6`}>
                            {/* Salary */}
                            <View style={styles.inputGroup}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="cash-outline" size={24} color={COLORS.black} />
                                </View>
                                <View style={tailwind`flex-1 ml-4`}>
                                    <Text style={styles.label}>Salary</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={salary}
                                        onChangeText={setSalary}
                                    />
                                </View>
                            </View>

                            {/* Business */}
                            <View style={styles.inputGroup}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="business-outline" size={24} color={COLORS.black} />
                                </View>
                                <View style={tailwind`flex-1 ml-4`}>
                                    <Text style={styles.label}>Business Profit</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={business}
                                        onChangeText={setBusiness}
                                    />
                                </View>
                            </View>

                            {/* Side Hustle */}
                            <View style={styles.inputGroup}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="flash-outline" size={24} color={COLORS.black} />
                                </View>
                                <View style={tailwind`flex-1 ml-4`}>
                                    <Text style={styles.label}>Side Hustle / Freelance</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={sideHustle}
                                        onChangeText={setSideHustle}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={tailwind`mt-auto pb-10 pt-6`}>
                            <TouchableOpacity
                                style={[styles.btn, (!salary && !business && !sideHustle) && styles.disabledBtn]}
                                onPress={handleNext}
                                disabled={!salary && !business && !sideHustle}
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

export default FixedIncomeSetup
