import { View, Text, Pressable, FlatList, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useContext, useState } from 'react'
import tailwind from 'twrnc'
import RenderItemCard from '../components/RenderItemCard';
import { AppContext } from '../Contex/ContextApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../theme';

const EMOJI_LIST = [
  // Finance & Money
  '💰', '💵', '💳', '📈', '🏦', '💹', '💎', '🪙', '💸', '🧧',
  // Shopping & Food
  '🛒', '🛍️', '🍔', '🍕', '🍎', '🍰', '☕', '🍺', '🍱', '🍿',
  // Transport & Travel
  '🚗', '🚲', '🚆', '✈️', '🚢', '🗺️', '⛽', '🚕', '🚌', '🚉',
  // Home & Bills
  '🏠', '💡', '📡', '🚿', '🛋️', '🧹', '🔑', '🚪', '🧺', '🪴',
  // Lifestyle & Entertainment
  '🎬', '🎮', '⚽', '🎨', '📺', '🎧', '📷', '🎭', '🎻', '🎰',
  // Personal & Health
  '🏥', '💊', '💇', '🧖', '💆', '💍', '👗', '👔', '💄', '🧼',
  // Education & Work
  '🎓', '📚', '💻', '🖋️', '📎', '💼', '📅', '📞', '📠', '💾',
  // Misc & Alerts
  '❤️', '🚨', '📁', '📦', '✨', '🔥', '🚀', '🛠️', '⚙️', '🎁'
];

const Category = ({ navigation }) => {
  const { categoriesList, handleAddCategory } = useContext(AppContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);

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
        <Text style={tailwind`text-3xl font-bold mt-4 `} maxFontSizeMultiplier={1.3}>Select Category</Text>
        <Text style={tailwind`text-base mt-2 text-gray-500 `} maxFontSizeMultiplier={1.3}>Select a category that describes what you spent money on</Text>
      </View>

      <FlatList
        data={[{ isAddButton: true }, ...categoriesList]}
        keyExtractor={(item, index) => item.isAddButton ? 'add-btn' : (item.name + index)}
        renderItem={({ item }) => item.isAddButton ? <AddCustomCard /> : <RenderItemCard item={item} handleCategory={handleCategory} />}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle} maxFontSizeMultiplier={1.3}>New Category</Text>

              <View style={styles.iconInputGroup}>
                <Text style={styles.modalLabel} maxFontSizeMultiplier={1.3}>Icon</Text>
                <TouchableOpacity 
                  style={styles.iconInputBox}
                  onPress={() => setEmojiPickerVisible(true)}
                >
                  <Text style={styles.iconTextLarge}>{newCatIcon}</Text>
                  <View style={styles.editBadge}>
                    <Ionicons name="pencil" size={12} color="white" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.nameInputGroup}>
                <Text style={styles.modalLabel} maxFontSizeMultiplier={1.3}>Category Name</Text>
                <TextInput
                  style={styles.nameInput}
                  placeholder="e.g. Gym, Pets..."
                  value={newCatName}
                  onChangeText={setNewCatName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCreateCategory}
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
        </KeyboardAvoidingView>
      </Modal>

      {/* Centered Emoji Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={emojiPickerVisible}
        onRequestClose={() => { setEmojiPickerVisible(false); }}
        statusBarTranslucent
      >
        <View style={styles.emojiModalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.emojiModalCenteredContent}
          >
            <View style={styles.emojiHeader}>
              <Text style={styles.emojiTitle}>Select Icon</Text>
              <TouchableOpacity onPress={() => setEmojiPickerVisible(false)}>
                <Ionicons name="close-circle" size={32} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>

            {/* Manual Input Area */}
            <View style={styles.manualInputContainer}>
              <Text style={styles.manualLabel}>Type custom or choose below</Text>
              <TextInput
                style={styles.manualEmojiInput}
                value={newCatIcon}
                onChangeText={setNewCatIcon}
                maxLength={4}
                placeholder="📁"
                placeholderTextColor={COLORS.gray400}
                textAlign="center"
                autoFocus
              />
            </View>
            
            <FlatList
              data={EMOJI_LIST}
              numColumns={5}
              keyExtractor={(item, index) => item + index}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.emojiBtn,
                    newCatIcon === item && { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary }
                  ]}
                  onPress={() => {
                    setNewCatIcon(item);
                    setEmojiPickerVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
              <TouchableOpacity 
                style={[styles.modalBtnSmall, { backgroundColor: COLORS.gray100 }]}
                onPress={() => setEmojiPickerVisible(false)}
              >
                <Text style={{ color: COLORS.textSub, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnSmall, { backgroundColor: COLORS.black, flex: 2 }]}
                onPress={() => setEmojiPickerVisible(false)}
              >
                <Text style={{ color: 'white', fontWeight: '800' }}>Confirm Selection</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
  
  iconInputBox: {
    backgroundColor: COLORS.gray100,
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconTextLarge: {
    fontSize: 32,
  },
  editBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: COLORS.black,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  // Emoji Picker Styles
  emojiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emojiModalCenteredContent: {
    backgroundColor: COLORS.white,
    width: '100%',
    height: '80%',
    borderRadius: 32,
    padding: 24,
    ...SHADOW.lg,
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  emojiTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  manualInputContainer: {
    backgroundColor: COLORS.gray100,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  manualLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSub,
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  manualEmojiInput: {
    fontSize: 36,
    color: COLORS.textMain,
    fontWeight: 'bold',
    width: '100%',
  },
  emojiBtn: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    backgroundColor: COLORS.gray100,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  modalBtnSmall: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
})

export default Category