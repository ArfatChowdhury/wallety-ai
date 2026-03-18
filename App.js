import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AppContextProvider, AppContext } from './src/Contex/ContextApi';
import { useContext } from 'react';
import ErrorBoundary from './src/components/ErrorBoundary';

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
