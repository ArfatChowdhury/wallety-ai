import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate, navigateToApp } from 'react-native-android-widget';
import { ExpenseWidget } from './ExpenseWidget';

const FINANCE_QUOTES = [
  "Pay yourself first. 💰",
  "Track the small things. 🔍",
  "A penny saved is a penny earned. 🐷",
  "Invest in your future. 🚀",
  "Beware of little expenses. 💸",
  "Budgeting is financial freedom. 🔓",
  "Don't forget to log that coffee! ☕",
  "Wealth is built daily. 🏗️",
  "Consistency is key. 🔑",
];

export async function widgetTaskHandler(props) {
  const { widgetAction, widgetActionData } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
      let safeDailySpend = 0;
      let currencySymbol = '$';
      
      try {
        const cache = await AsyncStorage.getItem('widget_data_cache');
        if (cache) {
          const parsed = JSON.parse(cache);
          safeDailySpend = parsed.safeDailySpend || 0;
          currencySymbol = parsed.currencySymbol || '$';
        }
      } catch (e) {
        console.log("Widget Handler Error: ", e);
      }

      const randomQuote = FINANCE_QUOTES[Math.floor(Math.random() * FINANCE_QUOTES.length)];

      await requestWidgetUpdate({
        widgetName: 'ExpenseWidget',
        renderWidget: () => <ExpenseWidget safeDailySpend={safeDailySpend} currencySymbol={currencySymbol} randomQuote={randomQuote} />,
        widgetId: props.widgetId,
      });
      break;

    case 'OPEN_APP':
      navigateToApp();
      break;

    default:
      break;
  }
}
