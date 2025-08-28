import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthInit } from './src/hooks/useAuthInit';

export default function App() {
  const { isLoading } = useAuthInit();

  if (isLoading) {
    // TODO: Add proper loading screen in Phase 2
    return <View style={styles.loading} />;
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});