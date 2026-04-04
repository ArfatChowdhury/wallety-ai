import React from 'react';
import {
  FlexWidget,
  TextWidget,
} from 'react-native-android-widget';

export function ExpenseWidget({ safeDailySpend = 0, currencySymbol = '$', randomQuote = '' }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0A0A0A', // Deep black for Panda aesthetic
        borderRadius: 24,
        padding: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#262626' // Subtle border
      }}
      clickAction="OPEN_APP"
    >
      {/* Top Section */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text="DAILY LIMIT"
            style={{ fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.5 }}
          />
          <TextWidget
            text={`${currencySymbol}${Number(safeDailySpend).toFixed(0)}`}
            style={{ fontSize: 38, fontWeight: '900', color: '#FFFFFF', marginTop: 2, letterSpacing: -1 }}
          />
        </FlexWidget>
        
        {/* Sleek '+' action button */}
        <FlexWidget
          clickAction="OPEN_APP"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#FFFFFF',
            shadowOpacity: 0.2,
            shadowRadius: 10,
          }}
        >
          <TextWidget
            text="+"
            style={{ fontSize: 26, fontWeight: '400', color: '#000000', marginTop: -2 }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Bottom Section */}
      <FlexWidget
        style={{
          borderTopWidth: 1,
          borderColor: '#262626',
          paddingTop: 14,
        }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text={randomQuote || "Keep your expenses minimal."}
          style={{ fontSize: 13, color: '#A3A3A3', fontStyle: 'italic', fontWeight: '500' }}
          maxLines={2}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
