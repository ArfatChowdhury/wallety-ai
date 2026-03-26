import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AppContextProvider, AppContext } from './src/Contex/ContextApi';
import { useContext, useEffect } from 'react';
import ErrorBoundary from './src/components/ErrorBoundary';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories } from './src/Data/categoriesData';
import LimnersLogo from './assets/compay-logo/limners';

function AppContent() {
  const { isLoading, handleAddExpense } = useContext(AppContext);

  useEffect(() => {
    const checkWidgetExpense = async () => {
      try {
        const raw = await AsyncStorage.getItem('widget_pending_expense');
        if (!raw) return;
        const expense = JSON.parse(raw);
        if (expense?.pending) {
          const catObj = categories.find(c => c.name === expense.category) || categories.find(c => c.name === 'Other') || categories[0];
          
          handleAddExpense({
            title: expense.note || 'Widget Expense',
            amount: expense.amount.toString(),
            category: catObj,
            date: expense.date,
          });
          
          await AsyncStorage.removeItem('widget_pending_expense');
        }
      } catch (err) {
        console.error('Error checking widget expense:', err);
      }
    };

    // Check on mount
    checkWidgetExpense();

    // Check on app state change to active
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkWidgetExpense();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleAddExpense]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
        <ActivityIndicator size="large" color="#16a34a" />
        <View style={{ marginTop: 20, width: '60%', height: 60 }}>
          <LimnersLogo />
        </View>
      </View>
    );
  }
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    // Platform-specific API keys
    const iosApiKey = 'goog_cIydRbvmVFxaEmXSfGczPyQNrLN';
    const androidApiKey = 'goog_cIydRbvmVFxaEmXSfGczPyQNrLN';

    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: iosApiKey });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: androidApiKey });
    }
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppContextProvider>
          <StatusBar style="dark" />
          <AppContent />
        </AppContextProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
