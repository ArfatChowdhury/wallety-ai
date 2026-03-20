import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AppContextProvider, AppContext } from './src/Contex/ContextApi';
import { useContext, useEffect } from 'react';
import ErrorBoundary from './src/components/ErrorBoundary';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

function AppContent() {
  const { isLoading } = useContext(AppContext);
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }}>
        <ActivityIndicator size="large" color="#16a34a" />
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
    const iosApiKey = 'test_XaITxtCPZAxAbSQnKReDGZejkKy';
    const androidApiKey = 'test_XaITxtCPZAxAbSQnKReDGZejkKy';

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
