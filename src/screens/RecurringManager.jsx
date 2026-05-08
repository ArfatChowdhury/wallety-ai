import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, ScrollView } from 'react-native'
import React, { useContext, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import tailwind from 'twrnc'
import { COLORS, SHADOW } from '../theme'
import { AppContext } from '../Contex/ContextApi'
import { BannerAdComponent } from '../services/AdService'

const RecurringManager = ({ navigation }) => {
    const { recurringTransactions, deleteRecurringTransaction, updateRecurringTransaction, addRecurringTransaction, currencySymbol, categoriesList } = useContext(AppContext);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // null = adding new, object = editing
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [recurringDay, setRecurringDay] = useState(1);
    const [selectedType, setSelectedType] = useState('expense'); // 'income' or 'expense'
    const [selectedCategory, setSelectedCategory] = useState(null);

    const handleDelete = (item) => {
        Alert.alert(
            "Delete Recurring Item",
            `Are you sure you want to remove ${item.title}? It will no longer be auto-added each month.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteRecurringTransaction(item.id)
                }
            ]
        );
    }

    const openEditModal = (item) => {
        setEditingItem(item);
        setTitle(item.title);
        setAmount(item.amount.toString());
        setRecurringDay(item.recurringDay || 1);
        setSelectedType(item.type || 'expense');
        setSelectedCategory(item.category || null);
        setModalVisible(true);
    };

    const openAddModal = () => {
        setEditingItem(null);
        setTitle('');
        setAmount('');
        setRecurringDay(1);
        setSelectedType('expense');
        setSelectedCategory(null);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (!title.trim() || !amount.trim()) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        if (editingItem) {
            // Edit existing item
            updateRecurringTransaction(editingItem.id, {
                title: title.trim(),
                amount: parseFloat(amount),
                recurringDay: recurringDay,
                category: selectedCategory,
                type: selectedType,
            });
        } else {
            // Add new item
            const newItem = {
                title: title.trim(),
                amount: parseFloat(amount),
                recurringDay: recurringDay,
                type: selectedType,
                category: selectedCategory || (
                    selectedType === 'income'
                        ? { name: 'Income', icon: '💰', color: '#22C55E' }
                        : { name: 'Other', icon: '📦', color: '#94A3B8' }
                ),
            };
            addRecurringTransaction(newItem);
        }

        setModalVisible(false);
        setEditingItem(null);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: item.type === 'income' ? '#D1FAE5' : '#FEE2E2' }]}>
                <Text style={{ fontSize: 20 }}>{item.category?.icon || (item.type === 'income' ? '💰' : '📦')}</Text>
            </View>
            <View style={tailwind`flex-1 ml-4`}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.subtitle}>
                    {item.type === 'income' ? 'Monthly Income' : 'Monthly Expense'} • Day {item.recurringDay || 1}
                </Text>
            </View>
            <View style={tailwind`items-end mr-3`}>
                <Text style={[styles.amount, { color: item.type === 'income' ? '#059669' : '#DC2626' }]}>
                    {item.type === 'income' ? '+' : '-'}{currencySymbol}{parseFloat(item.amount || 0).toFixed(2)}
                </Text>
            </View>
            <View style={styles.btnRow}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={[styles.actionBtn, styles.editBtn]}>
                    <Ionicons name="pencil" size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.actionBtn, styles.deleteBtn]}>
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Recurring Items</Text>
                <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
                    <Ionicons name="add" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            <View style={tailwind`px-6 flex-1`}>
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle" size={20} color="#0D9488" />
                    <Text style={styles.infoText}>
                        These items are automatically logged at the start of every month.
                    </Text>
                </View>

                <FlatList
                    data={recurringTransactions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={tailwind`pb-10 pt-4`}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={() => (
                        <View style={tailwind`mt-20 items-center`}>
                            <Ionicons name="calendar-outline" size={60} color="#E5E7EB" />
                            <Text style={tailwind`text-gray-400 mt-4 font-bold`}>No recurring items yet</Text>
                            <Text style={tailwind`text-gray-400 text-center px-10 mt-2`}>
                                Tap the + button above to add a recurring income or expense.
                            </Text>
                        </View>
                    )}
                />

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                    statusBarTranslucent
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1, justifyContent: 'flex-end' }}
                    >
                        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                            <View style={styles.modalOverlay} />
                        </TouchableWithoutFeedback>
                        <View style={[styles.modalContent, { maxHeight: '90%' }]}>
                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                <Text style={styles.modalTitle}>
                                    {editingItem ? 'Edit Item' : 'Add Recurring'}
                                </Text>

                                {/* Type Toggle */}
                                <View style={styles.typeToggleRow}>
                                    <TouchableOpacity
                                        onPress={() => setSelectedType('expense')}
                                        style={[styles.typeBtn, selectedType === 'expense' && styles.typeBtnExpenseActive]}
                                    >
                                        <Text style={[styles.typeBtnText, selectedType === 'expense' && { color: '#fff' }]}>
                                            Expense
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setSelectedType('income')}
                                        style={[styles.typeBtn, selectedType === 'income' && styles.typeBtnIncomeActive]}
                                    >
                                        <Text style={[styles.typeBtnText, selectedType === 'income' && { color: '#fff' }]}>
                                            Income
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Category Quick Picker (expense only) */}
                                {selectedType === 'expense' && (
                                    <View style={styles.modalInputGroup}>
                                        <Text style={styles.modalLabel}>Category</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                                {(categoriesList || []).slice(0, 12).map(cat => (
                                                    <TouchableOpacity
                                                        key={cat.name}
                                                        onPress={() => setSelectedCategory(cat)}
                                                        style={[
                                                            styles.catChip,
                                                            selectedCategory?.name === cat.name && styles.catChipActive
                                                        ]}
                                                    >
                                                        <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                                                        <Text style={[
                                                            styles.catChipText,
                                                            selectedCategory?.name === cat.name && { color: '#fff' }
                                                        ]}>
                                                            {cat.name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    </View>
                                )}

                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>Title</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={title}
                                        onChangeText={setTitle}
                                        placeholder="e.g. Rent, Salary"
                                    />
                                </View>

                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>Monthly Amount ({currencySymbol})</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={amount}
                                        onChangeText={(val) => {
                                            if (val === '' || val === '.') { setAmount(val); return; }
                                            const num = parseFloat(val);
                                            if (!isNaN(num) && num <= 999999999) setAmount(val);
                                        }}
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                        returnKeyType="done"
                                    />
                                </View>

                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>Recurring Day (1-28)</Text>
                                    <View style={styles.dayChipContainer}>
                                        {[1, 5, 10, 15, 20, 25].map(d => (
                                            <TouchableOpacity
                                                key={d}
                                                onPress={() => setRecurringDay(d)}
                                                style={[styles.dayChip, recurringDay === d && styles.dayChipActive]}
                                            >
                                                <Text style={[styles.dayChipText, recurringDay === d && styles.dayChipTextActive]}>{d}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TextInput
                                        style={[styles.modalInput, { marginTop: 10 }]}
                                        value={recurringDay.toString()}
                                        onChangeText={(val) => {
                                            const d = parseInt(val);
                                            if (!isNaN(d) && d >= 1 && d <= 28) setRecurringDay(d);
                                            else if (val === '') setRecurringDay('');
                                        }}
                                        keyboardType="numeric"
                                        placeholder="Day (1-28)"
                                        returnKeyType="done"
                                    />
                                </View>

                                <View style={styles.modalBtnRow}>
                                    <TouchableOpacity
                                        style={[styles.modalBtn, styles.cancelBtn]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalBtn, styles.saveBtn]}
                                        onPress={handleSave}
                                    >
                                        <Text style={styles.saveBtnText}>
                                            {editingItem ? 'Save Changes' : 'Add Item'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </View>

            {/* Banner Ad at bottom */}
            <View style={{ backgroundColor: COLORS.background, paddingVertical: 10, alignItems: 'center' }}>
                <BannerAdComponent />
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOW.sm,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.black,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOW.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.black,
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: '#F0FDFA',
        padding: 12,
        borderRadius: 16,
        marginTop: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 13,
        color: '#0D9488',
        fontWeight: '600',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        ...SHADOW.sm,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    amount: {
        fontSize: 16,
        fontWeight: '800',
    },
    btnRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBtn: {
        backgroundColor: '#EFF6FF',
    },
    deleteBtn: {
        backgroundColor: '#FEF2F2',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.black,
        marginBottom: 20,
        textAlign: 'center',
    },
    typeToggleRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
    },
    typeBtnExpenseActive: {
        backgroundColor: '#DC2626',
    },
    typeBtnIncomeActive: {
        backgroundColor: '#059669',
    },
    typeBtnText: {
        fontWeight: '700',
        fontSize: 14,
        color: '#6B7280',
    },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    catChipActive: {
        backgroundColor: '#1a1a1a',
        borderColor: '#1a1a1a',
    },
    catChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    modalInputGroup: {
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.gray500,
        marginBottom: 8,
    },
    modalInput: {
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
    },
    modalBtnRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        backgroundColor: COLORS.gray100,
    },
    saveBtn: {
        backgroundColor: COLORS.black,
    },
    cancelBtnText: {
        color: COLORS.gray600,
        fontWeight: '700',
        fontSize: 16,
    },
    saveBtnText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 16,
    },
    dayChipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dayChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: COLORS.gray100,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    dayChipActive: {
        backgroundColor: COLORS.black,
        borderColor: COLORS.black,
    },
    dayChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.gray600,
    },
    dayChipTextActive: {
        color: COLORS.white,
    },
})

export default RecurringManager
