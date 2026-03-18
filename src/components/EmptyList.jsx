import { Text, View, StyleSheet } from 'react-native'
import React from 'react'
import { COLORS } from '../theme'

const EmptyList = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>💸</Text>
            <Text style={styles.title}>No transactions yet</Text>
            <Text style={styles.subtitle}>
                Tap "Add" below to record your first expense
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
    icon: { fontSize: 50, marginBottom: 15 },
    title: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
    subtitle: { fontSize: 13, color: COLORS.textSub, marginTop: 4, textAlign: 'center', paddingHorizontal: 40, fontWeight: '600' },
})

export default EmptyList