import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Handle deep links for auth callback
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      await processAuthCallback(event.url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a URL (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        processAuthCallback(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        // Verify session with backend
        const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
        setSessionToken(token);
      }
    } catch (error) {
      console.log('No valid session found');
      await AsyncStorage.removeItem('session_token');
    } finally {
      setLoading(false);
    }
  };

  const processAuthCallback = async (url: string) => {
    try {
      // Extract session_id from URL (support both # and ? formats)
      const sessionIdMatch = url.match(/[#?]session_id=([^&]+)/);
      if (!sessionIdMatch) return;

      const sessionId = sessionIdMatch[1];
      setLoading(true);

      // Exchange session_id for session_token
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/session`,
        {},
        { headers: { 'X-Session-ID': sessionId } }
      );

      const { session_token, user_id, email, name, picture } = response.data;

      // Store session token
      await AsyncStorage.setItem('session_token', session_token);
      setSessionToken(session_token);
      setUser({ user_id, email, name, picture });
    } catch (error) {
      console.error('Auth callback error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const redirectUrl = Platform.OS === 'web'
        ? `${BACKEND_URL}/`
        : Linking.createURL('/');

      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;

      if (Platform.OS === 'web') {
        window.location.href = authUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
        if (result.type === 'success' && result.url) {
          await processAuthCallback(result.url);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await axios.post(
          `${BACKEND_URL}/api/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${sessionToken}` } }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('session_token');
      setUser(null);
      setSessionToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, sessionToken, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};