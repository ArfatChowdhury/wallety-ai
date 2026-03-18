import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useContext, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import tailwind from 'twrnc'
import { COLORS, SHADOW } from '../theme'
import { AppContext } from '../Contex/ContextApi'

const RecurringManager = ({ navigation }) => {
    const { recurringTransactions, deleteRecurringTransaction, updateRecurringTransaction, currencySymbol } = useContext(AppContext);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');

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
        setModalVisible(true);
    };

    const handleSaveEdit = () => {
        if (!title.trim() || !amount.trim()) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }
        updateRecurringTransaction(editingItem.id, {
            title: title.trim(),
            amount: parseFloat(amount)
        });
        setModalVisible(false);
        setEditingItem(null);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: item.type === 'income' ? '#D1FAE5' : '#FEE2E2' }]}>
                <Text style={{ fontSize: 20 }}>{item.category?.icon || (item.type === 'income' ? '💰' : '📦')}</Text>
            </View>
            <View style={tailwind`flex-1 ml-4`}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.type === 'income' ? 'Monthly Income' : 'Monthly Expense'}</Text>
            </View>
            <View style={tailwind`items-end mr-3`}>
                <Text style={[styles.amount, { color: item.type === 'income' ? '#059669' : '#DC2626' }]}>
                    {item.type === 'income' ? '+' : '-'}{currencySymbol}{item.amount}
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
                <View style={{ width: 40 }} />
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
                    ListEmptyComponent={() => (
                        <View style={tailwind`mt-20 items-center`}>
                            <Ionicons name="calendar-outline" size={60} color="#E5E7EB" />
                            <Text style={tailwind`text-gray-400 mt-4 font-bold`}>No recurring items yet</Text>
                            <Text style={tailwind`text-gray-400 text-center px-10 mt-2`}>
                                Add fixed income or expenses during onboarding or in future updates.
                            </Text>
                        </View>
                    )}
                />

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.modalContent}
                        >
                            <Text style={styles.modalTitle}>Edit Item</Text>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Title</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Enter title"
                                />
                            </View>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.modalLabel}>Monthly Amount ({currencySymbol})</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                    placeholder="0.00"
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
                                    onPress={handleSaveEdit}
                                >
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </Modal>
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
    title: {
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
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
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
        marginBottom: 24,
        textAlign: 'center',
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
})

export default RecurringManager
