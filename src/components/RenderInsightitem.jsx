import { View, Text } from 'react-native'
import React, { useContext } from 'react'
import tailwind from 'twrnc'
import { AppContext } from '../Contex/ContextApi'

const RenderInsightitem = ({ item }) => {
    const { totalSpent } = useContext(AppContext)
    const amount = Number(item.amount)
    const percentage = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(0) : 0

    return (
        <View style={tailwind`px-5 mt-4`}>
            <View style={tailwind`flex-row justify-between items-center mb-1`}>
                <View style={tailwind`flex-row items-center`}>
                    <View style={[
                        tailwind`w-3 h-3 rounded-full mr-3`,
                        { backgroundColor: item.category.color }
                    ]} />
                    <Text style={tailwind`text-base text-gray-700 font-medium`}>{item.category?.name}</Text>
                </View>
                <View style={tailwind`items-end`}>
                    <Text style={tailwind`font-bold text-gray-900`}>${amount.toFixed(2)}</Text>
                    <Text style={tailwind`text-xs text-gray-400`}>{percentage}%</Text>
                </View>
            </View>
            {/* Progress bar */}
            <View style={tailwind`bg-gray-200 rounded-full h-2 mb-4`}>
                <View
                    style={[
                        tailwind`h-2 rounded-full`,
                        { width: `${percentage}%`, backgroundColor: item.category.color }
                    ]}
                />
            </View>
        </View>
    )
}

export default RenderInsightitem