import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useCoupleStore } from '../../store/couple';

type InviteAcceptScreenNavigationProp = NativeStackNavigationProp<any>;

const createCoupleSchema = z.object({
  name: z.string().optional(),
});

const joinCoupleSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

type CreateCoupleFormData = z.infer<typeof createCoupleSchema>;
type JoinCoupleFormData = z.infer<typeof joinCoupleSchema>;

export default function InviteAcceptScreen() {
  const navigation = useNavigation<InviteAcceptScreenNavigationProp>();
  const {
    isLoading,
    error,
    createCouple,
    acceptInvite,
    clearError,
  } = useCoupleStore();

  const [mode, setMode] = useState<'create' | 'join'>('create');

  const createForm = useForm<CreateCoupleFormData>({
    resolver: zodResolver(createCoupleSchema),
    defaultValues: {
      name: '',
    },
  });

  const joinForm = useForm<JoinCoupleFormData>({
    resolver: zodResolver(joinCoupleSchema),
    defaultValues: {
      inviteCode: '',
    },
  });

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleCreateCouple = async (data: CreateCoupleFormData) => {
    try {
      await createCouple({
        name: data.name || undefined,
      });
      Alert.alert(
        'Success',
        'Couple created successfully! You can now invite your partner.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleJoinCouple = async (data: JoinCoupleFormData) => {
    try {
      await acceptInvite(data.inviteCode.trim());
      Alert.alert(
        'Success',
        'Successfully joined the couple!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Join as Couple</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Mode Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose an Option</Text>
            
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  mode === 'create' && styles.modeOptionSelected,
                ]}
                onPress={() => setMode('create')}
              >
                <View style={styles.modeIconContainer}>
                  <Ionicons name="add-circle" size={24} color={mode === 'create' ? '#007AFF' : '#8E8E93'} />
                </View>
                <Text style={[
                  styles.modeTitle,
                  mode === 'create' && styles.modeTextSelected,
                ]}>
                  Create Couple
                </Text>
                <Text style={[
                  styles.modeDescription,
                  mode === 'create' && styles.modeTextSelected,
                ]}>
                  Start a new couple and invite your partner
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeOption,
                  mode === 'join' && styles.modeOptionSelected,
                ]}
                onPress={() => setMode('join')}
              >
                <View style={styles.modeIconContainer}>
                  <Ionicons name="person-add" size={24} color={mode === 'join' ? '#007AFF' : '#8E8E93'} />
                </View>
                <Text style={[
                  styles.modeTitle,
                  mode === 'join' && styles.modeTextSelected,
                ]}>
                  Join Couple
                </Text>
                <Text style={[
                  styles.modeDescription,
                  mode === 'join' && styles.modeTextSelected,
                ]}>
                  Enter an invite code from your partner
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Create Couple Form */}
          {mode === 'create' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Create New Couple</Text>
              <Text style={styles.sectionDescription}>
                Give your couple a name (optional). You can always change this later.
              </Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Couple Name (Optional)</Text>
                <Controller
                  control={createForm.control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Sarah & Mike"
                      value={value || ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={createForm.handleSubmit(handleCreateCouple)}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Creating...' : 'Create Couple'}
                </Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#007AFF" />
                <Text style={styles.infoText}>
                  After creating, you'll get an invite code to share with your partner.
                </Text>
              </View>
            </View>
          )}

          {/* Join Couple Form */}
          {mode === 'join' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Join Existing Couple</Text>
              <Text style={styles.sectionDescription}>
                Enter the invite code that your partner shared with you.
              </Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Invite Code *</Text>
                <Controller
                  control={joinForm.control}
                  name="inviteCode"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        joinForm.formState.errors.inviteCode && styles.inputError,
                      ]}
                      placeholder="Enter invite code"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  )}
                />
                {joinForm.formState.errors.inviteCode && (
                  <Text style={styles.errorText}>
                    {joinForm.formState.errors.inviteCode.message}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={joinForm.handleSubmit(handleJoinCouple)}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Joining...' : 'Join Couple'}
                </Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Ionicons name="shield-checkmark" size={20} color="#34C759" />
                <Text style={styles.infoText}>
                  Your data sharing preferences can be configured after joining.
                </Text>
              </View>
            </View>
          )}

          {/* Help Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Need Help?</Text>
            
            <View style={styles.helpItem}>
              <Ionicons name="help-circle" size={20} color="#007AFF" />
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>How does couple sharing work?</Text>
                <Text style={styles.helpDescription}>
                  Once connected, you can choose to share your workout progress and habit completions with your partner for motivation and accountability.
                </Text>
              </View>
            </View>

            <View style={styles.helpItem}>
              <Ionicons name="lock-closed" size={20} color="#007AFF" />
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>Is my data secure?</Text>
                <Text style={styles.helpDescription}>
                  You control what data is shared. Only information you explicitly choose to share will be visible to your partner.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6E6E73',
    marginBottom: 16,
    lineHeight: 20,
  },
  modeSelector: {
    gap: 12,
  },
  modeOption: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  modeOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  modeIconContainer: {
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: '#6E6E73',
  },
  modeTextSelected: {
    color: '#007AFF',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
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
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 18,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 14,
    color: '#6E6E73',
    lineHeight: 18,
  },
});