import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native'
import React from 'react'
import { COLORS, SHADOW } from '../theme'
import { Ionicons } from '@expo/vector-icons'

const PERIODS = [
    { label: 'Today', value: 'today', icon: 'today-outline' },
    { label: 'This Week', value: 'week', icon: 'calendar-outline' },
    { label: 'This Month', value: 'month', icon: 'calendar-number-outline' },
    { label: 'All Time', value: 'all', icon: 'infinite-outline' },
    { label: 'Calendar', value: 'calendar', icon: 'trail-sign-outline' },
]

const DateFilterBar = ({ selectedPeriod, onSelect }) => {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {PERIODS.map(p => (
                <TouchableOpacity
                    key={p.value}
                    onPress={() => onSelect(p.value)}
                    style={[
                        styles.btn,
                        selectedPeriod === p.value ? styles.btnActive : styles.btnInactive,
                        { flexDirection: 'row', alignItems: 'center', gap: 6 }
                    ]}
                >
                    <Ionicons
                        name={p.icon}
                        size={16}
                        color={selectedPeriod === p.value ? COLORS.white : COLORS.textSub}
                    />
                    <Text style={[
                        styles.btnText,
                        selectedPeriod === p.value ? styles.btnTextActive : styles.btnTextInactive
                    ]}>
                        {p.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 8, paddingVertical: 10, flexDirection: 'row' },
    btn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
    },
    btnActive: {
        backgroundColor: COLORS.black,
        borderColor: COLORS.black,
        ...SHADOW.sm,
    },
    btnInactive: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.border,
        ...SHADOW.sm,
    },
    btnText: {
        fontSize: 13,
        fontWeight: '700',
    },
    btnTextActive: {
        color: COLORS.white,
    },
    btnTextInactive: {
        color: COLORS.textSub,
    },
})

export default DateFilterBar
