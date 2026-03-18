import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React, { useState, useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import tailwind from 'twrnc'
import { COLORS, SHADOW } from '../../theme'
import { AppContext } from '../../Contex/ContextApi'
import Slider from '@react-native-community/slider';

const BudgetSlider = ({ label, value, onValueChange, icon, color, currencySymbol }) => (
    <View style={styles.budgetCard}>
        <View style={tailwind`flex-row justify-between items-center mb-4`}>
            <View style={tailwind`flex-row items-center`}>
                <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text style={styles.budgetLabel}>{label}</Text>
            </View>
            <Text style={styles.budgetValue}>{currencySymbol}{value}</Text>
        </View>
        <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={2000}
            step={50}
            value={value}
            onValueChange={onValueChange}
            minimumTrackTintColor={color}
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor={color}
        />
    </View>
)

const InitialBudgetSetup = ({ navigation }) => {
    const { setBudget, completeOnboarding, currencySymbol } = useContext(AppContext);

    const [foodBudget, setFoodBudget] = useState(500);
    const [transportBudget, setTransportBudget] = useState(200);
    const [funBudget, setFunBudget] = useState(300);

    const handleFinish = () => {
        setBudget('Food', foodBudget);
        setBudget('Transport', transportBudget);
        setBudget('Entertainment', funBudget);

        completeOnboarding();
        // Navigation will be handled by the root navigator listening to isFirstLaunch
    }


    return (
        <SafeAreaView style={styles.root}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={tailwind`px-6 pt-10 flex-1`}>
                    <View>
                        <Text style={tailwind`text-sm font-bold text-primary uppercase tracking-widest`}>Step 5 of 5</Text>
                        <Text style={tailwind`text-3xl font-extrabold text-gray-900 mt-2`}>Set Your Monthly Budgets</Text>
                        <Text style={tailwind`text-base text-gray-500 mt-2`}>
                            Setting goals helps you save faster. You can always change these later in settings.
                        </Text>
                    </View>

                    <View style={tailwind`mt-10`}>
                        <BudgetSlider
                            key="food"
                            label="Food & Dining"
                            value={foodBudget}
                            onValueChange={setFoodBudget}
                            icon="restaurant-outline"
                            color="#F59E0B"
                            currencySymbol={currencySymbol}
                        />
                        <BudgetSlider
                            key="transport"
                            label="Transport"
                            value={transportBudget}
                            onValueChange={setTransportBudget}
                            icon="car-outline"
                            color="#3B82F6"
                            currencySymbol={currencySymbol}
                        />
                        <BudgetSlider
                            key="fun"
                            label="Entertainment"
                            value={funBudget}
                            onValueChange={setFunBudget}
                            icon="happy-outline"
                            color="#8B5CF6"
                            currencySymbol={currencySymbol}
                        />
                    </View>

                    <View style={tailwind`mt-auto pb-10 pt-6`}>
                        <TouchableOpacity
                            style={styles.btn}
                            onPress={handleFinish}
                        >
                            <Text style={styles.btnText}>Finish Setup</Text>
                            <Ionicons name="sparkles" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    budgetCard: {
        backgroundColor: COLORS.white,
        padding: 24,
        borderRadius: 28,
        marginBottom: 16,
        ...SHADOW.md,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    budgetLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
    },
    budgetValue: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.black,
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

export default InitialBudgetSetup
