import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useWorkoutStore } from '../../store/workout';
import { WorkoutTemplate, Exercise } from '../../types/workout';

type SessionStartScreenNavigationProp = NativeStackNavigationProp<any>;

interface RouteParams {
  templateId?: string;
  mode?: 'gym' | 'home';
}

export default function SessionStartScreen() {
  const navigation = useNavigation<SessionStartScreenNavigationProp>();
  const route = useRoute();
  const { templateId, mode } = (route.params as RouteParams) || {};

  const { templates, startSession, isLoading, error, clearError } = useWorkoutStore();

  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [selectedMode, setSelectedMode] = useState<'gym' | 'home'>(mode || 'gym');
  const [customWorkoutName, setCustomWorkoutName] = useState('');
  const [isCustomWorkout, setIsCustomWorkout] = useState(!templateId);

  useEffect(() => {
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
        setSelectedMode(template.mode);
        setIsCustomWorkout(false);
      }
    }
  }, [templateId, templates]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const startWorkoutSession = async () => {
    try {
      let workoutName = '';
      let exercises: Exercise[] = [];

      if (isCustomWorkout) {
        if (!customWorkoutName.trim()) {
          Alert.alert('Error', 'Please enter a workout name');
          return;
        }
        workoutName = customWorkoutName.trim();
        exercises = []; // Will add exercises during session
      } else if (selectedTemplate) {
        workoutName = selectedTemplate.name;
        exercises = selectedTemplate.exercises.map(ex => ({ ...ex })); // Copy exercises
      } else {
        Alert.alert('Error', 'Please select a template or enter a custom workout name');
        return;
      }

      await startSession({
        template_id: selectedTemplate?.id,
        name: workoutName,
        mode: selectedMode,
        exercises,
        start_time: new Date().toISOString(),
      });

      // Navigate to session tracking
      navigation.replace('SessionTrack');
    } catch (error) {
      // Error is handled by the store and displayed via useEffect
    }
  };

  const renderTemplateOption = (template: WorkoutTemplate) => (
    <TouchableOpacity
      key={template.id}
      style={[
        styles.templateOption,
        selectedTemplate?.id === template.id && styles.templateOptionSelected,
      ]}
      onPress={() => {
        setSelectedTemplate(template);
        setSelectedMode(template.mode);
        setIsCustomWorkout(false);
      }}
    >
      <View style={styles.templateInfo}>
        <Text style={styles.templateName}>{template.name}</Text>
        <Text style={styles.templateMeta}>
          {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''} • {template.mode.toUpperCase()}
        </Text>
      </View>
      <View style={[styles.modeBadge, template.mode === 'gym' ? styles.gymBadge : styles.homeBadge]}>
        <Ionicons 
          name={template.mode === 'gym' ? 'fitness' : 'home'} 
          size={12} 
          color="white" 
        />
      </View>
    </TouchableOpacity>
  );

  // Filter templates by selected mode
  const filteredTemplates = templates.filter(t => t.mode === selectedMode);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Start Workout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mode Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Mode</Text>
          <View style={styles.modeSelector}>
            {[
              { key: 'gym', label: 'Gym', icon: 'fitness' },
              { key: 'home', label: 'Home', icon: 'home' },
            ].map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.modeOption,
                  selectedMode === mode.key && styles.modeOptionSelected,
                ]}
                onPress={() => {
                  setSelectedMode(mode.key as 'gym' | 'home');
                  setSelectedTemplate(null); // Clear selection when mode changes
                }}
              >
                <Ionicons
                  name={mode.icon as any}
                  size={20}
                  color={selectedMode === mode.key ? 'white' : '#007AFF'}
                />
                <Text
                  style={[
                    styles.modeOptionText,
                    selectedMode === mode.key && styles.modeOptionTextSelected,
                  ]}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Workout Option */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.customOption,
              isCustomWorkout && styles.customOptionSelected,
            ]}
            onPress={() => {
              setIsCustomWorkout(true);
              setSelectedTemplate(null);
            }}
          >
            <Ionicons 
              name={isCustomWorkout ? 'radio-button-on' : 'radio-button-off'} 
              size={20} 
              color={isCustomWorkout ? '#007AFF' : '#C7C7CC'} 
            />
            <Text style={styles.customOptionText}>Custom Workout</Text>
          </TouchableOpacity>
          
          {isCustomWorkout && (
            <TextInput
              style={styles.customNameInput}
              placeholder="Enter workout name"
              value={customWorkoutName}
              onChangeText={setCustomWorkoutName}
              autoFocus
            />
          )}
        </View>

        {/* Template Selection */}
        {!isCustomWorkout && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Choose Template ({selectedMode.toUpperCase()})
            </Text>
            
            {filteredTemplates.length > 0 ? (
              <View style={styles.templatesList}>
                {filteredTemplates.map(renderTemplateOption)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="fitness-outline" size={48} color="#C7C7CC" />
                <Text style={styles.emptyText}>
                  No {selectedMode} templates available
                </Text>
                <TouchableOpacity
                  style={styles.createTemplateButton}
                  onPress={() => navigation.navigate('TemplateCreateEdit', { mode: selectedMode })}
                >
                  <Text style={styles.createTemplateText}>Create Template</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Selected Template Preview */}
        {selectedTemplate && !isCustomWorkout && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Preview</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>{selectedTemplate.name}</Text>
              {selectedTemplate.description && (
                <Text style={styles.previewDescription}>{selectedTemplate.description}</Text>
              )}
              <Text style={styles.previewExercises}>
                {selectedTemplate.exercises.length} exercise{selectedTemplate.exercises.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            (!selectedTemplate && !isCustomWorkout) && styles.startButtonDisabled,
          ]}
          onPress={startWorkoutSession}
          disabled={isLoading || (!selectedTemplate && !isCustomWorkout)}
        >
          <Ionicons name="play" size={20} color="white" />
          <Text style={styles.startButtonText}>
            {isLoading ? 'Starting...' : 'Start Workout'}
          </Text>
        </TouchableOpacity>
      </View>
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
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
  customOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  customOptionSelected: {
    // Add selected styles if needed
  },
  customOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  customNameInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  templatesList: {
    gap: 8,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  templateOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  templateMeta: {
    fontSize: 14,
    color: '#6E6E73',
  },
  modeBadge: {
    padding: 6,
    borderRadius: 6,
  },
  gymBadge: {
    backgroundColor: '#007AFF',
  },
  homeBadge: {
    backgroundColor: '#34C759',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6E6E73',
    marginTop: 8,
    marginBottom: 16,
  },
  createTemplateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  createTemplateText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6E6E73',
    marginBottom: 8,
  },
  previewExercises: {
    fontSize: 14,
    color: '#6E6E73',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
});