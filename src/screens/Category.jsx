import { View, Text, Pressable, FlatList, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native'
import React, { useContext, useState } from 'react'
import tailwind from 'twrnc'
import RenderItemCard from '../components/RenderItemCard';
import { AppContext } from '../Contex/ContextApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../theme';

const Category = ({ navigation }) => {
  const { categoriesList, handleAddCategory } = useContext(AppContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');

  const handleCategory = (itemCat) => {
    navigation.popTo('BottomTabs', {
      screen: 'Create',
      params: { itemCat }
    })
  }

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = {
      name: newCatName.trim(),
      icon: newCatIcon,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    };
    handleAddCategory(newCat);
    setNewCatName('');
    setModalVisible(false);
  }

  const AddCustomCard = () => (
    <Pressable
      onPress={() => setModalVisible(true)}
      style={[styles.addCard, tailwind`flex-1 items-center p-4 m-2`]}
    >
      <View style={styles.addIconCircle}>
        <Ionicons name="add" size={32} color={COLORS.black} />
      </View>
      <Text style={tailwind`mt-2 text-center text-sm font-bold text-gray-900`}>Add Custom</Text>
    </Pressable>
  )

  return (
    <SafeAreaView style={styles.root}>
      <View style={tailwind`px-5 mt-2`}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
        >
          <Ionicons name="close-circle" size={32} color={COLORS.textMain} />
        </Pressable>
        <Text style={tailwind`text-3xl font-bold mt-4 `}>Select Category</Text>
        <Text style={tailwind`text-base mt-2 text-gray-500 `}>Select a category that describes what you spent money on</Text>
      </View>

      <FlatList
        data={[{ isAddButton: true }, ...categoriesList]}
        keyExtractor={(item, index) => item.isAddButton ? 'add-btn' : (item.name + index)}
        renderItem={({ item }) => item.isAddButton ? <AddCustomCard /> : <RenderItemCard item={item} handleCategory={handleCategory} />}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Category</Text>

            <View style={styles.iconInputGroup}>
              <Text style={styles.modalLabel}>Icon</Text>
              <TextInput
                style={styles.iconInput}
                value={newCatIcon}
                onChangeText={setNewCatIcon}
                maxLength={2}
              />
            </View>

            <View style={styles.nameInputGroup}>
              <Text style={styles.modalLabel}>Category Name</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="e.g. Gym, Pets..."
                value={newCatName}
                onChangeText={setNewCatName}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.createModalBtn]}
                onPress={handleCreateCategory}
              >
                <Text style={styles.createModalText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  closeBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 120, // Avoid overlap with bottom tabs
    paddingTop: 20,
  },
  addCard: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    height: 120,
  },
  addIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.sm,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 30,
    paddingBottom: 50,
    ...SHADOW.md,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 25,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray500,
    marginBottom: 8,
  },
  iconInputGroup: { marginBottom: 20 },
  iconInput: {
    fontSize: 32,
    backgroundColor: COLORS.gray100,
    borderRadius: 16,
    padding: 15,
    textAlign: 'center',
    width: 80,
  },
  nameInputGroup: { marginBottom: 30 },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    color: COLORS.textMain,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  cancelModalBtn: {
    backgroundColor: COLORS.gray100,
  },
  createModalBtn: {
    backgroundColor: COLORS.black,
  },
  cancelModalText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSub,
  },
  createModalText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
})

export default Category