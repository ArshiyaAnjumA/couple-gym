import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../store/auth';
import { LoginRequest } from '../../types/api';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const APPLE_SIGN_IN_ENABLED = true; // Feature flag

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, loginWithApple, isLoading, error, clearError } = useAuthStore();
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'alex@example.com', // Pre-fill with demo account
      password: 'password123',
    },
  });

  useEffect(() => {
    checkAppleAvailability();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Login Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const checkAppleAvailability = async () => {
    if (APPLE_SIGN_IN_ENABLED && Platform.OS === 'ios') {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAppleAvailable(available);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (error) {
      // Error is handled by the store and displayed via useEffect
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken && credential.authorizationCode) {
        await loginWithApple(credential.identityToken, credential.authorizationCode);
      } else {
        Alert.alert('Error', 'Apple Sign In failed. Please try again.');
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled, do nothing
        return;
      }
      Alert.alert('Error', 'Apple Sign In failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter your email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoComplete="password"
                />
              )}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Apple Sign In */}
          {isAppleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={28}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    paddingBottom: 24,
  },
  backButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6E6E73',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  button: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appleButton: {
    height: 56,
    marginBottom: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 24,
  },
  registerText: {
    fontSize: 16,
    color: '#6E6E73',
  },
  registerLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});