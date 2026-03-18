import { Modal, View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import tailwind from 'twrnc';

const ExpenseActionPopup = ({ visible, onClose, onEdit, onDelete, item }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={tailwind`flex-1 bg-black bg-opacity-50 justify-center items-center`}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={tailwind`bg-white rounded-2xl p-6 w-80`}>
          <Text style={tailwind`text-xl font-bold text-center mb-4`}>
            Expense Actions
          </Text>
          
          <View style={tailwind`border-b border-gray-200 pb-3 mb-3`}>
            <Text style={tailwind`text-lg font-semibold`}>{item?.title}</Text>
            <Text style={tailwind`text-gray-500`}>${item?.amount} • {item?.category?.name}</Text>
          </View>

          <TouchableOpacity 
            onPress={onEdit}
            style={tailwind`bg-blue-500 rounded-xl p-4 mb-3`}
          >
            <Text style={tailwind`text-white text-center font-bold text-lg`}>
              ✏️ Edit Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={onDelete}
            style={tailwind`bg-red-500 rounded-xl p-4`}
          >
            <Text style={tailwind`text-white text-center font-bold text-lg`}>
              🗑️ Delete Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={onClose}
            style={tailwind`mt-4 p-3`}
          >
            <Text style={tailwind`text-gray-500 text-center font-semibold`}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ExpenseActionPopup;