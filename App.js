import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AppContextProvider, AppContext } from './src/Contex/ContextApi';
import { useContext, useEffect, useState } from 'react';
import ErrorBoundary from './src/components/ErrorBoundary';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories } from './src/Data/categoriesData';
import LimnersLogo from './assets/compay-logo/limners';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoading, handleAddExpense } = useContext(AppContext);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    const hideSplash = async () => {
      if (!isLoading && minTimeElapsed) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('Error hiding splash screen', e);
        }
      }
    };
    hideSplash();
  }, [isLoading, minTimeElapsed]);

  if (isLoading || !minTimeElapsed) {
    return null;
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
      NavigationBar.setBackgroundColorAsync('#ffffff');
      NavigationBar.setButtonStyleAsync('dark');
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
