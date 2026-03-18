import { View, Text, Pressable, StyleSheet } from 'react-native'
import React from 'react'
import tailwind from 'twrnc'
import { COLORS, SHADOW } from '../theme'

const RenderItemCard = ({ item, handleCategory }) => {
    return (
        <Pressable
            onPress={() => handleCategory(item)}
            style={[styles.card, tailwind`flex-1 items-center p-4 m-2 bg-white`]}
        >
            <Text style={tailwind`text-4xl mb-1`}>{item.icon}</Text>
            <Text style={tailwind`mt-2 text-center text-sm font-medium text-gray-700`}>{item.name}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        ...SHADOW.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    }
})

export default RenderItemCard