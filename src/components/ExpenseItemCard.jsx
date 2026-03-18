import { Alert, Animated, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import React, { useRef, useState, useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../theme';
import { AppContext } from '../Contex/ContextApi';

const SWIPE_THRESHOLD = 80;

const ExpenseItemCard = ({ item, onEdit, onDelete }) => {
  const { currencySymbol, categoriesList } = useContext(AppContext);
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);
  const [startX, setStartX] = useState(0);

  const isIncome = item.type === 'income';

  const catColor = categoriesList?.find(c => c.name === item.category?.name)?.color || item.category?.color || COLORS.gray200;

  const handleTouchStart = (e) => {
    setStartX(e.nativeEvent.pageX);
  };

  const handleTouchMove = (e) => {
    const diff = e.nativeEvent.pageX - startX;
    if (diff < 0) {
      Animated.timing(translateX, {
        toValue: Math.max(diff, -140),
        duration: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleTouchEnd = (e) => {
    const diff = e.nativeEvent.pageX - startX;
    if (diff < -SWIPE_THRESHOLD) {
      Animated.spring(translateX, {
        toValue: -140,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
      setSwiped(true);
    } else {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
      setSwiped(false);
    }
  };

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setSwiped(false);
  };

  const handleEdit = () => {
    closeSwipe();
    onEdit(item);
  };

  const handleDelete = () => {
    closeSwipe();
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id, item.type) }
      ]
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleEdit}
          style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
        >
          <Ionicons name="pencil" size={20} color="white" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.actionBtn, { backgroundColor: '#EF4444', borderTopRightRadius: 22, borderBottomRightRadius: 22 }]}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.cardContainer, { transform: [{ translateX }] }]}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={swiped ? closeSwipe : undefined}
          style={[
            styles.cardTouch,
            { borderLeftColor: isIncome ? COLORS.income : catColor }
          ]}
        >
          <View style={styles.cardContent}>
            <View style={styles.leftSection}>
              <View style={[styles.iconBox, { backgroundColor: isIncome ? '#ECFDF5' : '#F9FAFB' }]}>
                <Text style={styles.emoji}>{item.icon || (isIncome ? '💰' : '📦')}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.catBadge, { backgroundColor: isIncome ? '#D1FAE5' : catColor }]}>
                  <Text style={[styles.catText, { color: isIncome ? '#065F46' : 'rgba(0,0,0,0.6)' }]}>
                    {isIncome ? 'Income' : (item.category?.name || 'Uncategorized')}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.rightSection}>
              <Text style={[styles.amount, { color: isIncome ? '#059669' : '#DC2626' }]}>
                {isIncome ? '+' : '-'}{currencySymbol}{item.amount}
              </Text>
              <Text style={styles.date}>
                {(() => {
                  try {
                    const d = new Date(item.date);
                    if (isNaN(d.getTime())) return item.date;
                    const day = d.getDate().toString().padStart(2, '0');
                    const month = (d.getMonth() + 1).toString().padStart(2, '0');
                    const year = d.getFullYear();
                    return `${day}/${month}/${year}`;
                  } catch (e) {
                    return item.date;
                  }
                })()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginVertical: 8,
    height: 85,
    borderRadius: 20,
  },
  actions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  actionBtn: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  cardContainer: {
    flex: 1,
    zIndex: 1,
  },
  cardTouch: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    borderLeftWidth: 6,
    ...SHADOW.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  catBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  catText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.6)',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSub,
    marginTop: 2,
  },
});

export default ExpenseItemCard;