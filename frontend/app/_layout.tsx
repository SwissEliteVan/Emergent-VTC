import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="confirmation" />
        <Stack.Screen name="ride-status" />
        <Stack.Screen name="driver-dispatch" />
        <Stack.Screen name="driver-active" />
      </Stack>
    </AuthProvider>
  );
}