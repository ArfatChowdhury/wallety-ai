import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, StatusBar } from 'react-native'
import React, { useContext, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppContext } from '../Contex/ContextApi'
import { categories } from '../Data/categoriesData'
import { COLORS, SHADOW } from '../theme'
import { BannerAdComponent, NativeAdComponent, insertAdsIntoBudgetList, AdService } from '../services/AdService'

const Budget = () => {
    const { expenses, budgets, setBudget, categoriesList, currencySymbol } = useContext(AppContext)
    const [editingCat, setEditingCat] = useState(null)
    const [inputValue, setInputValue] = useState('')

    React.useEffect(() => {
        AdService.showBudgetAd();
    }, []);

    // Date Logic
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Robust Date Parsing for Sync Fix
    const parseDateSafely = (dateStr) => {
        if (!dateStr) return new Date();
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;

        // Handle M/D/YYYY or D/M/YYYY or ISO parts
        const filteredStr = dateStr.replace(/[^0-9/ -]/g, ' ').trim();
        const parts = filteredStr.split(/[ /-]+/).filter(p => !isNaN(parseInt(p)));

        if (parts.length >= 3) {
            let p0 = parseInt(parts[0]);
            let p1 = parseInt(parts[1]);
            let p2 = parseInt(parts[2]);

            // Year is usually the long one or the last one
            let year = p2 > 1000 ? p2 : p0 > 1000 ? p0 : p2 + 2000;
            let month, day;

            if (p0 > 12) { // DD/MM/YYYY
                month = p1 - 1;
                day = p0;
            } else if (p1 > 12) { // MM/DD/YYYY
                month = p0 - 1;
                day = p1;
            } else {
                // Ambiguous, assume MM/DD unless month matches current month's logic
                month = p0 - 1;
                day = p1;
            }
            return new Date(year, month, day);
        }
        return new Date();
    }

    // Fixed Sync: Pulling from global expenses for current month
    const spentByCategory = expenses.reduce((acc, e) => {
        const d = parseDateSafely(e.date)
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const name = e.category?.name || 'Other'
            acc[name] = (acc[name] || 0) + Number(e.amount)
        }
        return acc
    }, {})

    const handleSaveBudget = (catName) => {
        const val = parseFloat(inputValue)
        if (isNaN(val) || val <= 0) {
            Alert.alert('Error', 'Enter a valid amount')
            return
        }
        setBudget(catName, val)
        setEditingCat(null)
        setInputValue('')
    }

    const allCategories = categoriesList.map(cat => ({
        ...cat,
        spent: spentByCategory[cat.name] || 0,
        budget: budgets?.[cat.name] || 0,
    }))

    // Insert ads into budget list (every 3rd item)
    const budgetListWithAds = insertAdsIntoBudgetList(allCategories)

    const renderItem = ({ item }) => {
        // Render native ad if item type is AD
        if (item.type === 'AD') {
            return <BannerAdComponent />
        }

        const budget = item.budget || 0
        const spent = item.spent || 0
        const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
        const isOver = spent > budget && budget > 0
        const isEditing = editingCat === item.name

        return (
            <View style={styles.card}>
                <View style={styles.cardTop}>
                    <View style={styles.catInfo}>
                        <View style={[styles.iconBox, { backgroundColor: COLORS.gray100 }]}>
                            <Text style={styles.iconText}>{item.icon}</Text>
                        </View>
                        <View>
                            <Text style={styles.catName}>{item.name}</Text>
                            {isOver ? (
                                <Text style={styles.overText}>⚠️ Exceeded by {currencySymbol}${(spent - budget).toFixed(0)}</Text>
                            ) : (
                                <Text style={styles.remainingText}>
                                    {budget > 0 ? `${currencySymbol}${(budget - spent).toFixed(0)} left` : 'No limit set'}
                                </Text>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => { setEditingCat(item.name); setInputValue(budget > 0 ? budget.toString() : '') }}
                        style={styles.editBtn}
                    >
                        <Ionicons name={budget > 0 ? "pencil" : "add"} size={20} color={COLORS.textMain} />
                    </TouchableOpacity>
                </View>

                {isEditing && (
                    <View style={styles.editForm}>
                        <TextInput
                            style={styles.input}
                            keyboardType="decimal-pad"
                            placeholder="Set limit"
                            value={inputValue}
                            onChangeText={setInputValue}
                            autoFocus
                            placeholderTextColor={COLORS.gray400}
                        />
                        <TouchableOpacity onPress={() => handleSaveBudget(item.name)} style={styles.saveBtn}>
                            <Text style={styles.saveText}>Set</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditingCat(null)} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={COLORS.gray400} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.progressSection}>
                    <View style={styles.progressLabels}>
                        <Text style={styles.progressVal}>{currencySymbol}{spent.toFixed(0)} spent</Text>
                        <Text style={styles.limitVal}>of {currencySymbol}{budget.toFixed(0)} limit</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[
                            styles.progressBarFill,
                            { width: `${pct}%`, backgroundColor: isOver ? COLORS.expense : COLORS.black }
                        ]} />
                    </View>
                </View>
            </View>
        )
    }

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.title}>Budgeting</Text>
                <Text style={styles.subtitle}>Manage your monthly limits</Text>
            </View>

            <FlatList
                data={budgetListWithAds}
                keyExtractor={(item, index) => item.name + index || item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    listContent: { paddingBottom: 120, paddingTop: 10 },
    header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '800', color: COLORS.textMain },
    subtitle: { fontSize: 14, color: COLORS.textSub, marginTop: 4 },

    card: {
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOW.sm,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    catInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    iconText: { fontSize: 22 },
    catName: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
    overText: { fontSize: 11, color: COLORS.expense, fontWeight: '700', marginTop: 2 },
    remainingText: { fontSize: 11, color: COLORS.textSub, fontWeight: '600', marginTop: 2 },

    editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center' },

    editForm: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    input: { flex: 1, backgroundColor: COLORS.gray100, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.textMain, fontWeight: '600' },
    saveBtn: { backgroundColor: COLORS.black, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    saveText: { color: 'white', fontWeight: '800', fontSize: 14 },
    closeBtn: { padding: 4 },

    progressSection: {},
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressVal: { fontSize: 13, fontWeight: '700', color: COLORS.textMain },
    limitVal: { fontSize: 12, fontWeight: '600', color: COLORS.textSub },
    progressBarBg: { height: 8, backgroundColor: COLORS.gray100, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
})

export default Budget
