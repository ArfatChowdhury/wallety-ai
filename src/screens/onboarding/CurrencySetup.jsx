import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native'
import React, { useContext, useState, useMemo } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import tailwind from 'twrnc'
import { COLORS, SHADOW } from '../../theme'
import { AppContext } from '../../Contex/ContextApi'

import { currencies } from '../../constants/currencies'

const CurrencySetup = ({ navigation, route }) => {
    const { currency, setCurrency } = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState('');
    const isSettings = route.params?.isSettings;

    const filteredCurrencies = useMemo(() => {
        if (!searchQuery) return currencies;
        return currencies.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const handleSelect = (code) => {
        setCurrency(code);
    }

    const skipSetup = () => {
        navigation.navigate('FixedIncomeSetup');
    };

    const handleNext = () => {
        if (isSettings) {
            navigation.goBack();
        } else {
            navigation.navigate('FixedIncomeSetup');
        }
    }

    return (
        <SafeAreaView style={styles.root}>
            <View style={tailwind`px-6 pt-10 flex-1`}>
                <View style={tailwind`flex-row justify-between items-start`}>
                    <View>
                        {!isSettings && <Text style={tailwind`text-sm font-bold text-primary uppercase tracking-widest`}>Step 2 of 5</Text>}
                        <Text style={tailwind`text-3xl font-extrabold text-gray-900 mt-2`}>
                            {isSettings ? 'Change Currency' : 'Choose currency'}
                        </Text>
                    </View>
                    {!isSettings && (
                        <TouchableOpacity
                            onPress={skipSetup}
                            style={styles.skipHeaderBtn}
                        >
                            <Text style={styles.skipHeaderText}>Skip</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={tailwind`text-base text-gray-500 mt-2`}>
                    {isSettings ? 'Update your preferred currency symbol.' : 'This will be used for all your budget records.'}
                </Text>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search currency (e.g. USD, Rupee)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9CA3AF"
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    data={filteredCurrencies}
                    keyExtractor={(item) => item.code}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.card,
                                currency === item.code && styles.activeCard
                            ]}
                            onPress={() => handleSelect(item.code)}
                        >
                            <View style={styles.symbolContainer}>
                                <Text style={styles.symbol}>{item.symbol}</Text>
                            </View>
                            <View style={tailwind`flex-1 ml-4`}>
                                <Text style={styles.currencyName}>{item.name}</Text>
                                <Text style={styles.currencyCode}>{item.code} • {item.region}</Text>
                            </View>
                            {currency === item.code && (
                                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={tailwind`mt-2 pb-10`}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={tailwind`mt-10 items-center`}>
                            <Text style={tailwind`text-gray-400 italic`}>No currency found matching "{searchQuery}"</Text>
                        </View>
                    )}
                />

                <TouchableOpacity
                    style={styles.btn}
                    onPress={handleNext}
                >
                    <Text style={styles.btnText}>{isSettings ? 'Save Changes' : 'Continue'}</Text>
                    <Ionicons name={isSettings ? "checkmark-done" : "arrow-forward"} size={24} color={COLORS.white} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginTop: 20,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: COLORS.black,
        fontWeight: '600',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        ...SHADOW.sm,
    },
    activeCard: {
        borderColor: COLORS.primary,
        backgroundColor: '#F0FDFA',
    },
    symbolContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: COLORS.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    symbol: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.black,
    },
    currencyName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
    },
    currencyCode: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    btn: {
        backgroundColor: COLORS.black,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        borderRadius: 24,
        gap: 12,
        marginBottom: 20,
        ...SHADOW.md,
    },
    btnText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '800',
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

export default CurrencySetup
