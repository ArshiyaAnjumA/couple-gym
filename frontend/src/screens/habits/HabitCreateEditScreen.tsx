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
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useHabitStore } from '../../store/habit';

type HabitCreateEditScreenNavigationProp = NativeStackNavigationProp<any>;

const habitSchema = z.object({
  name: z.string().min(1, 'Habit name is required'),
  description: z.string().optional(),
  cadence: z.enum(['daily', 'weekly', 'custom']),
  cadence_config: z.object({
    days_of_week: z.array(z.number()).optional(),
    custom_days: z.number().min(1).optional(),
  }).optional(),
  reminder_enabled: z.boolean(),
  reminder_time_local: z.string().optional(),
});

type HabitFormData = z.infer<typeof habitSchema>;

interface RouteParams {
  habitId?: string;
}

const DAYS_OF_WEEK = [
  { key: 0, label: 'Sun' },
  { key: 1, label: 'Mon' },
  { key: 2, label: 'Tue' },
  { key: 3, label: 'Wed' },
  { key: 4, label: 'Thu' },
  { key: 5, label: 'Fri' },
  { key: 6, label: 'Sat' },
];

export default function HabitCreateEditScreen() {
  const navigation = useNavigation<HabitCreateEditScreenNavigationProp>();
  const route = useRoute();
  const { habitId } = (route.params as RouteParams) || {};
  
  const { 
    habits, 
    isLoading, 
    error, 
    createHabit, 
    updateHabit, 
    clearError 
  } = useHabitStore();

  const isEditing = !!habitId;
  const existingHabit = isEditing ? habits.find(h => h.id === habitId) : null;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: existingHabit?.name || '',
      description: existingHabit?.description || '',
      cadence: existingHabit?.cadence || 'daily',
      cadence_config: existingHabit?.cadence_config || {
        days_of_week: [1, 2, 3, 4, 5], // Mon-Fri default
        custom_days: 3,
      },
      reminder_enabled: existingHabit?.reminder_enabled || false,
      reminder_time_local: existingHabit?.reminder_time_local || '09:00',
    },
  });

  const watchedCadence = watch('cadence');
  const watchedReminderEnabled = watch('reminder_enabled');

  useEffect(() => {
    if (existingHabit) {
      reset({
        name: existingHabit.name,
        description: existingHabit.description || '',
        cadence: existingHabit.cadence,
        cadence_config: existingHabit.cadence_config || {
          days_of_week: [1, 2, 3, 4, 5],
          custom_days: 3,
        },
        reminder_enabled: existingHabit.reminder_enabled,
        reminder_time_local: existingHabit.reminder_time_local || '09:00',
      });
    }
  }, [existingHabit, reset]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const onSubmit = async (data: HabitFormData) => {
    try {
      if (isEditing && habitId) {
        await updateHabit(habitId, data);
      } else {
        await createHabit(data);
      }
      navigation.goBack();
    } catch (error) {
      // Error is handled by the store and displayed via useEffect
    }
  };

  const toggleDayOfWeek = (day: number, currentDays: number[] | undefined) => {
    const days = currentDays || [];
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day].sort();
    return newDays;
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
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? 'Edit Habit' : 'Create Habit'}
          </Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            <Text style={styles.saveText}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name *</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Enter habit name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter description (optional)"
                    value={value || ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                )}
              />
            </View>
          </View>

          {/* Cadence */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequency</Text>
            
            <Controller
              control={control}
              name="cadence"
              render={({ field: { onChange, value } }) => (
                <View style={styles.cadenceOptions}>
                  {[
                    { key: 'daily', label: 'Daily' },
                    { key: 'weekly', label: 'Weekly' },
                    { key: 'custom', label: 'Custom' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.cadenceOption,
                        value === option.key && styles.cadenceOptionSelected,
                      ]}
                      onPress={() => onChange(option.key)}
                    >
                      <Text
                        style={[
                          styles.cadenceOptionText,
                          value === option.key && styles.cadenceOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />

            {watchedCadence === 'weekly' && (
              <View style={styles.weeklyConfig}>
                <Text style={styles.configLabel}>Select days of the week:</Text>
                <Controller
                  control={control}
                  name="cadence_config.days_of_week"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.daysRow}>
                      {DAYS_OF_WEEK.map((day) => (
                        <TouchableOpacity
                          key={day.key}
                          style={[
                            styles.dayButton,
                            value?.includes(day.key) && styles.dayButtonSelected,
                          ]}
                          onPress={() => {
                            const newDays = toggleDayOfWeek(day.key, value);
                            onChange(newDays);
                          }}
                        >
                          <Text
                            style={[
                              styles.dayButtonText,
                              value?.includes(day.key) && styles.dayButtonTextSelected,
                            ]}
                          >
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
              </View>
            )}

            {watchedCadence === 'custom' && (
              <View style={styles.customConfig}>
                <Text style={styles.configLabel}>Every X days:</Text>
                <Controller
                  control={control}
                  name="cadence_config.custom_days"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.numberInput}
                      value={value?.toString() || ''}
                      onChangeText={(text) => {
                        const num = parseInt(text);
                        onChange(isNaN(num) ? 1 : num);
                      }}
                      keyboardType="numeric"
                      placeholder="3"
                    />
                  )}
                />
              </View>
            )}
          </View>

          {/* Reminders */}
          <View style={styles.section}>
            <View style={styles.reminderHeader}>
              <Text style={styles.sectionTitle}>Reminders</Text>
              <Controller
                control={control}
                name="reminder_enabled"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    thumbColor="white"
                  />
                )}
              />
            </View>

            {watchedReminderEnabled && (
              <View style={styles.reminderConfig}>
                <Text style={styles.configLabel}>Reminder time:</Text>
                <Controller
                  control={control}
                  name="reminder_time_local"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.timeInput}
                      value={value || '09:00'}
                      onChangeText={onChange}
                      placeholder="09:00"
                    />
                  )}
                />
                <Text style={styles.reminderNote}>
                  Push notifications will be implemented in Phase 3
                </Text>
              </View>
            )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: 'white',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
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
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  cadenceOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cadenceOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cadenceOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  cadenceOptionText: {
    fontSize: 16,
    color: '#6E6E73',
  },
  cadenceOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  weeklyConfig: {
    marginTop: 8,
  },
  customConfig: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  configLabel: {
    fontSize: 16,
    color: '#6E6E73',
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#6E6E73',
  },
  dayButtonTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  numberInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reminderConfig: {
    marginTop: -8,
  },
  timeInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  reminderNote: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
});