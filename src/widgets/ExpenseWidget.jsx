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
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top Section: AI Data */}
      <FlexWidget style={{ flexDirection: 'column' }}>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <TextWidget
            text="✨ AI Forecast"
            style={{ fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}
          />
        </FlexWidget>
        <TextWidget
          text="Safe Daily Spend"
          style={{ fontSize: 13, color: '#1e293b', fontWeight: '500' }}
        />
        <TextWidget
          text={`${currencySymbol}${Number(safeDailySpend).toFixed(0)}`}
          style={{ fontSize: 26, fontWeight: '900', color: '#22C55E', marginTop: 2 }}
        />
      </FlexWidget>

      {/* Middle Section: Random Quote */}
      <FlexWidget
        style={{
          backgroundColor: '#F8FAFC',
          borderRadius: 12,
          padding: 12,
          marginTop: 10,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}
      >
        <TextWidget
          text={randomQuote || "Track the small things. 🔍"}
          style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}
        />
      </FlexWidget>

      {/* Bottom Section: Open App Button */}
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          backgroundColor: '#22C55E',
          borderRadius: 16,
          paddingVertical: 10,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text="Open Wallety"
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: '#FFFFFF',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
