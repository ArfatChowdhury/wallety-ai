import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Animated, Image, Text, Platform, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AppContextProvider, AppContext } from './src/Contex/ContextApi';
import { useContext, useEffect, useState, useRef } from 'react';
import ErrorBoundary from './src/components/ErrorBoundary';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories } from './src/Data/categoriesData';
import LimnersLogo from './assets/compay-logo/limners';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import NativeNotificationService from './src/services/NativeNotificationService';

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

const SplashScreenView = ({ onFinish }) => {
  const contentFade = useRef(new Animated.Value(0)).current;
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Fade in content
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Small delay before showing the logo section
    const logoTimer = setTimeout(() => setShowLogo(true), 400);

    // Hide splash after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(timer);
    };
  }, [contentFade, onFinish]);

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#ffffff',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* App icon + name */}
      <Animated.View style={{ 
        alignItems: 'center',
        opacity: contentFade 
      }}>
        <Image
          source={require('./assets/icon.png')}
          style={{
            width: 90,
            height: 90,
            borderRadius: 20,
          }}
          resizeMode="contain"
        />
        <Text style={{
          fontSize: 26,
          fontWeight: '900',
          color: '#111827',
          marginTop: 12,
          letterSpacing: -0.5,
        }}>
          Wallety
        </Text>
        <Text style={{
          fontSize: 13,
          color: '#6B7280',
          marginTop: 4,
          fontWeight: '500',
        }}>
          AI Budget Tracker
        </Text>
      </Animated.View>

      {/* Animated Limners Logo at bottom */}
      {showLogo && (
        <View style={{
          position: 'absolute',
          bottom: 60,
          alignItems: 'center',
        }}>
          <Text style={{
            fontSize: 11,
            color: '#9CA3AF',
            fontWeight: '600',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            from
          </Text>
          <LimnersLogo width={200} />
        </View>
      )}
    </View>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide native splash screen immediately
    SplashScreen.hideAsync().catch(() => {});

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
      NativeNotificationService.createChannels(); // Initialize Kotlin notification channels
    }

  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppContextProvider>
          <StatusBar style="dark" />
          {showSplash ? (
            <SplashScreenView onFinish={() => setShowSplash(false)} />
          ) : (
            <AppContent />
          )}
        </AppContextProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
