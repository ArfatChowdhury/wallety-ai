import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useContext, useState } from 'react'
import tailwind from 'twrnc'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { AppContext } from '../Contex/ContextApi'

const INCOME_SOURCES = [
    { name: 'Salary', icon: '💼' },
    { name: 'Freelance', icon: '💻' },
    { name: 'Business', icon: '🏢' },
    { name: 'Investment', icon: '📈' },
    { name: 'Gift', icon: '🎁' },
    { name: 'Rental', icon: '🏠' },
    { name: 'Bonus', icon: '🎯' },
    { name: 'Other', icon: '💰' },
]

const AddIncome = ({ navigation }) => {
    const { handleAddIncome, incomes, handleDeleteIncome, totalIncome, currencySymbol } = useContext(AppContext)
    const [amount, setAmount] = useState('')
    const [source, setSource] = useState('')
    const [selectedSource, setSelectedSource] = useState(null)
    const [activeField, setActiveField] = useState(null)

    const handleSubmit = () => {
        handleAddIncome({ amount, source: source || selectedSource?.name || '', date: null, navigation })
    }

    const handleSelectSource = (src) => {
        setSelectedSource(src)
        setSource(src.name)
    }

    const confirmDelete = (id) => {
        Alert.alert('Delete Income', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteIncome(id) }
        ])
    }

    return (
        <SafeAreaView style={tailwind`flex-1 bg-gray-100`}>
            {/* Header */}
            <View style={tailwind`flex-row items-center px-5 pt-2 pb-4`}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={tailwind`mr-4`}>
                    <Ionicons name="chevron-back" size={26} color="#111" />
                </TouchableOpacity>
                <Text style={tailwind`text-2xl font-bold text-gray-900`}>Add Income</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tailwind`px-5 pb-10`}>
                {/* Total income summary */}
                <LinearGradient
                    colors={['#052e16', '#166534']}
                    style={tailwind`rounded-2xl p-5 mb-5 items-center`}
                >
                    <Text style={tailwind`text-green-300 text-sm`}>Total Income</Text>
                    <Text style={tailwind`text-white text-4xl font-bold mt-1`}>{currencySymbol}{totalIncome.toFixed(2)}</Text>
                </LinearGradient>

                {/* Amount input */}
                <Text style={tailwind`text-black font-semibold mb-2`}>Amount</Text>
                <TextInput
                    placeholder={`${currencySymbol}0.00`}
                    style={tailwind`border-2 rounded-xl ${activeField === 'amount' ? 'border-green-400' : 'border-gray-300'} p-4 text-lg mb-5 bg-white`}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    onFocus={() => setActiveField('amount')}
                    onBlur={() => setActiveField(null)}
                />

                {/* Source chips */}
                <Text style={tailwind`text-black font-semibold mb-3`}>Source</Text>
                <View style={tailwind`flex-row flex-wrap gap-2 mb-3`}>
                    {INCOME_SOURCES.map(src => (
                        <TouchableOpacity
                            key={src.name}
                            onPress={() => handleSelectSource(src)}
                            style={[
                                tailwind`px-4 py-2 rounded-full border-2 flex-row items-center`,
                                selectedSource?.name === src.name
                                    ? tailwind`border-green-500 bg-green-50`
                                    : tailwind`border-gray-200 bg-white`
                            ]}
                        >
                            <Text style={tailwind`mr-1`}>{src.icon}</Text>
                            <Text style={[tailwind`text-sm font-medium`, selectedSource?.name === src.name ? tailwind`text-green-700` : tailwind`text-gray-600`]}>
                                {src.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Custom source input */}
                <TextInput
                    placeholder="Or type a custom source…"
                    style={tailwind`border-2 rounded-xl ${activeField === 'source' ? 'border-green-400' : 'border-gray-300'} p-4 text-base mb-6 bg-white`}
                    value={source}
                    onChangeText={text => { setSource(text); setSelectedSource(null); }}
                    onFocus={() => setActiveField('source')}
                    onBlur={() => setActiveField(null)}
                />

                {/* Submit */}
                <TouchableOpacity onPress={handleSubmit}>
                    <LinearGradient
                        colors={['#16a34a', '#15803d']}
                        style={tailwind`py-5 rounded-2xl items-center mb-8`}
                    >
                        <Text style={tailwind`text-white text-lg font-bold`}>Add Income</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Past incomes */}
                {incomes.length > 0 && (
                    <>
                        <Text style={tailwind`text-base font-bold text-gray-800 mb-3`}>Income History</Text>
                        {incomes.map(item => (
                            <View key={item.id} style={tailwind`bg-white rounded-xl p-4 mb-3 flex-row justify-between items-center shadow-sm`}>
                                <View style={tailwind`flex-row items-center`}>
                                    <View style={tailwind`bg-green-100 w-10 h-10 rounded-full justify-center items-center mr-3`}>
                                        <Text>💰</Text>
                                    </View>
                                    <View>
                                        <Text style={tailwind`font-bold text-gray-800`}>{item.source}</Text>
                                        <Text style={tailwind`text-xs text-gray-400`}>{item.date}</Text>
                                    </View>
                                </View>
                                <View style={tailwind`items-end`}>
                                    <Text style={tailwind`text-green-600 font-bold text-base`}>+{currencySymbol}{item.amount}</Text>
                                    <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

export default AddIncome
