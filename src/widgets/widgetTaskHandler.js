import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate, navigateToApp } from 'react-native-android-widget';
import { ExpenseWidget } from './ExpenseWidget';

// Internal state for the widget (per instance if needed, but here we simplify)
let currentAmount = '';
let selectedCategory = '';

export async function widgetTaskHandler(props) {
  const { widgetAction, widgetActionData } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
      await requestWidgetUpdate({
        widgetName: 'ExpenseWidget',
        renderWidget: () => <ExpenseWidget />,
        widgetId: props.widgetId,
      });
      break;

    case 'SET_AMOUNT':
      currentAmount = widgetActionData?.value || '';
      break;

    case 'SELECT_CATEGORY':
      selectedCategory = widgetActionData?.category || '';
      // Visual feedback could be added here if the widget supports it, 
      // but for now we just store it.
      break;

    case 'ADD_EXPENSE':
      if (currentAmount && selectedCategory) {
        const expense = {
          amount: parseFloat(currentAmount),
          category: selectedCategory, // This will be mapped in App.js
          date: new Date().toISOString(),
          type: 'expense',
          note: 'Added from widget',
          pending: true
        };

        await AsyncStorage.setItem('widget_pending_expense', JSON.stringify(expense));
        
        // Reset state
        currentAmount = '';
        selectedCategory = '';
        
        // Open the app
        navigateToApp();
      }
      break;

    default:
      break;
  }
}
