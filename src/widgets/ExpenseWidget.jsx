import React from 'react';
import {
  FlexWidget,
  TextWidget,
  SvgWidget,
  InputWidget,
} from 'react-native-android-widget';

export function ExpenseWidget() {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <TextWidget
          text="💰 Quick Expense"
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: '#1e293b',
          }}
        />
      </FlexWidget>

      {/* Amount Input */}
      <InputWidget
        placeholder="0.00"
        inputType="numberDecimal"
        clickAction="SET_AMOUNT"
        style={{
          width: 'match_parent',
          height: 40,
          backgroundColor: '#f1f5f9',
          borderRadius: 8,
          paddingHorizontal: 8,
          fontSize: 18,
          color: '#1e293b',
          marginBottom: 8,
        }}
      />

      {/* Categories */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        {['Food', 'Transport', 'Shopping', 'Other'].map((cat) => (
          <FlexWidget
            key={cat}
            clickAction="SELECT_CATEGORY"
            clickActionData={{ category: cat }}
            style={{
              width: '22%',
              height: 40,
              backgroundColor: '#f1f5f9',
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <TextWidget
              text={cat === 'Food' ? '🍔' : cat === 'Transport' ? '🚗' : cat === 'Shopping' ? '🛍️' : '📦'}
              style={{ fontSize: 18 }}
            />
          </FlexWidget>
        ))}
      </FlexWidget>

      {/* Add Button */}
      <FlexWidget
        clickAction="ADD_EXPENSE"
        style={{
          width: 'match_parent',
          height: 40,
          backgroundColor: '#22C55E',
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <TextWidget
          text="Add"
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#FFFFFF',
          }}
        />
      </FlexWidget>

      {/* Footer */}
      <TextWidget
        text="Tap to open app for more"
        style={{
          fontSize: 10,
          color: '#64748b',
          textAlign: 'center',
          width: 'match_parent',
        }}
      />
    </FlexWidget>
  );
}
