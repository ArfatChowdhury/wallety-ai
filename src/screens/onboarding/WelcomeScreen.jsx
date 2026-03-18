import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import React, { useState, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import tailwind from 'twrnc'
import { COLORS, SHADOW } from '../../theme'
import { AppContext } from '../../Contex/ContextApi'

const WelcomeScreen = ({ navigation }) => {
    const handleNext = () => {
        navigation.navigate('CurrencySetup');
    }

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    <View style={tailwind`px-6 pt-10 flex-1 justify-between pb-10`}>
                        <View>
                            <View style={styles.iconContainer}>
                                <Ionicons name="wallet-outline" size={60} color={COLORS.black} />
                            </View>

                            <Text style={tailwind`text-sm font-bold text-primary uppercase tracking-widest mt-8`}>Step 1 of 5</Text>
                            <Text style={[tailwind`text-4xl font-extrabold text-gray-900 mt-2`, { lineHeight: 48 }]}>
                                Welcome to{"\n"}
                                <Text style={{ color: COLORS.primary }}>Wallety</Text>
                            </Text>

                            <Text style={tailwind`text-lg text-gray-500 mt-4 leading-6`}>
                                Your premium companion for tracking expenses and saving money with ease.
                            </Text>

                            <View style={tailwind`mt-10 bg-white p-6 rounded-3xl shadow-sm border border-gray-100`}>
                                <View style={tailwind`flex-row items-center gap-3 mb-4`}>
                                    <View style={tailwind`w-10 h-10 rounded-xl bg-green-100 items-center justify-center`}>
                                        <Ionicons name="flash" size={20} color="#10B981" />
                                    </View>
                                    <Text style={tailwind`text-base font-bold text-gray-800`}>Quick Smart Setup</Text>
                                </View>
                                <Text style={tailwind`text-sm text-gray-500 leading-5`}>
                                    We'll help you set up your budget in 2 minutes. Your data stays private on your device.
                                </Text>
                                <View style={tailwind`mt-6 pt-6 border-t border-gray-100`}>
                                    <View style={tailwind`flex-row items-center gap-3 mb-2`}>
                                        <Ionicons name="calendar" size={18} color={COLORS.gray400} />
                                        <Text style={tailwind`text-sm font-bold text-gray-700`}>Auto Month Close</Text>
                                    </View>
                                    <Text style={tailwind`text-xs text-gray-400 leading-4`}>
                                        At the end of each month, Wallety automatically closes your period, saves your summary, and rolls over recurring bills for the next month.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.btn}
                            onPress={handleNext}
                        >
                            <Text style={styles.btnText}>Start Quick Setup</Text>
                            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
                        </TouchableOpacity>
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
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 30,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOW.md,
    },
    input: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 18,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.black,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        ...SHADOW.sm,
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
    }
})

export default WelcomeScreen
