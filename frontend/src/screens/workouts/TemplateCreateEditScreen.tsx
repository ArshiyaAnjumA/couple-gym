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
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useWorkoutStore } from '../../store/workout';
import { Exercise } from '../../types/workout';

type TemplateCreateEditScreenNavigationProp = NativeStackNavigationProp<any>;

const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  sets: z.number().min(1).optional(),
  reps: z.number().min(1).optional(),
  weight: z.number().min(0).optional(),
  duration: z.number().min(1).optional(),
});

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  mode: z.enum(['gym', 'home']),
  exercises: z.array(exerciseSchema).min(1, 'At least one exercise is required'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface RouteParams {
  templateId?: string;
}

export default function TemplateCreateEditScreen() {
  const navigation = useNavigation<TemplateCreateEditScreenNavigationProp>();
  const route = useRoute();
  const { templateId } = (route.params as RouteParams) || {};
  
  const { 
    templates, 
    isLoading, 
    error, 
    createTemplate, 
    updateTemplate, 
    clearError 
  } = useWorkoutStore();

  const isEditing = !!templateId;
  const existingTemplate = isEditing ? templates.find(t => t.id === templateId) : null;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: existingTemplate?.name || '',
      description: existingTemplate?.description || '',
      mode: existingTemplate?.mode || 'gym',
      exercises: existingTemplate?.exercises || [{ name: '', sets: 3, reps: 10 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'exercises',
  });

  useEffect(() => {
    if (existingTemplate) {
      reset({
        name: existingTemplate.name,
        description: existingTemplate.description || '',
        mode: existingTemplate.mode,
        exercises: existingTemplate.exercises.length > 0 
          ? existingTemplate.exercises 
          : [{ name: '', sets: 3, reps: 10 }],
      });
    }
  }, [existingTemplate, reset]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const onSubmit = async (data: TemplateFormData) => {
    try {
      if (isEditing && templateId) {
        await updateTemplate(templateId, data);
      } else {
        await createTemplate(data);
      }
      navigation.goBack();
    } catch (error) {
      // Error is handled by the store and displayed via useEffect
    }
  };

  const addExercise = () => {
    append({ name: '', sets: 3, reps: 10 });
  };

  const removeExercise = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      Alert.alert('Error', 'At least one exercise is required');
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
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? 'Edit Template' : 'Create Template'}
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
          {/* Template Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Template Info</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name *</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Enter template name"
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

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mode *</Text>
              <Controller
                control={control}
                name="mode"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.modeSelector}>
                    {[
                      { key: 'gym', label: 'Gym', icon: 'fitness' },
                      { key: 'home', label: 'Home', icon: 'home' },
                    ].map((mode) => (
                      <TouchableOpacity
                        key={mode.key}
                        style={[
                          styles.modeOption,
                          value === mode.key && styles.modeOptionSelected,
                        ]}
                        onPress={() => onChange(mode.key)}
                      >
                        <Ionicons
                          name={mode.icon as any}
                          size={20}
                          color={value === mode.key ? 'white' : '#007AFF'}
                        />
                        <Text
                          style={[
                            styles.modeOptionText,
                            value === mode.key && styles.modeOptionTextSelected,
                          ]}
                        >
                          {mode.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>
          </View>

          {/* Exercises */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exercises</Text>
              <TouchableOpacity style={styles.addExerciseButton} onPress={addExercise}>
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.addExerciseText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>

            {fields.map((field, index) => (
              <View key={field.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseNumber}>Exercise {index + 1}</Text>
                  {fields.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeExercise(index)}
                    >
                      <Ionicons name="trash" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Exercise Name *</Text>
                  <Controller
                    control={control}
                    name={`exercises.${index}.name`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          styles.input,
                          errors.exercises?.[index]?.name && styles.inputError,
                        ]}
                        placeholder="Enter exercise name"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    )}
                  />
                  {errors.exercises?.[index]?.name && (
                    <Text style={styles.errorText}>
                      {errors.exercises[index]!.name!.message}
                    </Text>
                  )}
                </View>

                <View style={styles.exerciseParams}>
                  <View style={styles.paramInput}>
                    <Text style={styles.inputLabel}>Sets</Text>
                    <Controller
                      control={control}
                      name={`exercises.${index}.sets`}
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={styles.input}
                          placeholder="Sets"
                          value={value?.toString() || ''}
                          onChangeText={(text) => {
                            const num = parseInt(text);
                            onChange(isNaN(num) ? undefined : num);
                          }}
                          keyboardType="numeric"
                        />
                      )}
                    />
                  </View>

                  <View style={styles.paramInput}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <Controller
                      control={control}
                      name={`exercises.${index}.reps`}
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={styles.input}
                          placeholder="Reps"
                          value={value?.toString() || ''}
                          onChangeText={(text) => {
                            const num = parseInt(text);
                            onChange(isNaN(num) ? undefined : num);
                          }}
                          keyboardType="numeric"
                        />
                      )}
                    />
                  </View>

                  <View style={styles.paramInput}>
                    <Text style={styles.inputLabel}>Weight (kg)</Text>
                    <Controller
                      control={control}
                      name={`exercises.${index}.weight`}
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={styles.input}
                          placeholder="Weight"
                          value={value?.toString() || ''}
                          onChangeText={(text) => {
                            const num = parseFloat(text);
                            onChange(isNaN(num) ? undefined : num);
                          }}
                          keyboardType="numeric"
                        />
                      )}
                    />
                  </View>
                </View>
              </View>
            ))}

            {errors.exercises && (
              <Text style={styles.errorText}>
                {typeof errors.exercises === 'object' && 'root' in errors.exercises
                  ? (errors.exercises as any).root?.message
                  : 'Please check exercise details'
                }
              </Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
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
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    gap: 8,
  },
  modeOptionSelected: {
    backgroundColor: '#007AFF',
  },
  modeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modeOptionTextSelected: {
    color: 'white',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addExerciseText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  exerciseCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  removeButton: {
    padding: 4,
  },
  exerciseParams: {
    flexDirection: 'row',
    gap: 12,
  },
  paramInput: {
    flex: 1,
  },
});