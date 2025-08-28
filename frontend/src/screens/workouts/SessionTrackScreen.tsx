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
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useWorkoutStore } from '../../store/workout';
import { Exercise } from '../../types/workout';

type SessionTrackScreenNavigationProp = NativeStackNavigationProp<any>;

export default function SessionTrackScreen() {
  const navigation = useNavigation<SessionTrackScreenNavigationProp>();
  const { 
    currentSession, 
    updateCurrentSession, 
    finishSession, 
    isLoading, 
    error, 
    clearError,
    clearCurrentSession,
  } = useWorkoutStore();

  const [startTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAddExerciseModalVisible, setIsAddExerciseModalVisible] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');

  useEffect(() => {
    if (!currentSession) {
      navigation.replace('WorkoutsScreen');
      return;
    }

    // Start timer
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession, navigation, startTime]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  if (!currentSession) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const updatedExercises = [...currentSession.exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    updateCurrentSession({ exercises: updatedExercises });
  };

  const addExercise = () => {
    if (!newExerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    const newExercise: Exercise = {
      name: newExerciseName.trim(),
      sets: 3,
      reps: 10,
    };

    updateCurrentSession({
      exercises: [...currentSession.exercises, newExercise],
    });

    setNewExerciseName('');
    setIsAddExerciseModalVisible(false);
  };

  const removeExercise = (index: number) => {
    const updatedExercises = currentSession.exercises.filter((_, i) => i !== index);
    updateCurrentSession({ exercises: updatedExercises });
  };

  const finishWorkout = async () => {
    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'default',
          onPress: async () => {
            try {
              await finishSession();
              navigation.replace('SessionSummary');
            } catch (error) {
              // Error is handled by the store
            }
          },
        },
      ]
    );
  };

  const exitWorkout = () => {
    Alert.alert(
      'Exit Workout',
      'Your progress will be lost. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            clearCurrentSession();
            navigation.replace('WorkoutsScreen');
          },
        },
      ]
    );
  };

  const renderExercise = (exercise: Exercise, index: number) => (
    <View key={index} style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <TouchableOpacity
          style={styles.removeExerciseButton}
          onPress={() => removeExercise(index)}
        >
          <Ionicons name="trash" size={16} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.exerciseInputs}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Sets</Text>
          <TextInput
            style={styles.paramInput}
            value={exercise.sets?.toString() || ''}
            onChangeText={(text) => {
              const num = parseInt(text);
              updateExercise(index, 'sets', isNaN(num) ? undefined : num);
            }}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps</Text>
          <TextInput
            style={styles.paramInput}
            value={exercise.reps?.toString() || ''}
            onChangeText={(text) => {
              const num = parseInt(text);
              updateExercise(index, 'reps', isNaN(num) ? undefined : num);
            }}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <TextInput
            style={styles.paramInput}
            value={exercise.weight?.toString() || ''}
            onChangeText={(text) => {
              const num = parseFloat(text);
              updateExercise(index, 'weight', isNaN(num) ? undefined : num);
            }}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        {currentSession.mode === 'home' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Time (min)</Text>
            <TextInput
              style={styles.paramInput}
              value={exercise.duration ? (exercise.duration / 60).toString() : ''}
              onChangeText={(text) => {
                const num = parseFloat(text);
                updateExercise(index, 'duration', isNaN(num) ? undefined : num * 60);
              }}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={exitWorkout}>
          <Ionicons name="close" size={24} color="#FF3B30" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.workoutName}>{currentSession.name}</Text>
          <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
        </View>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>{currentSession.mode.toUpperCase()}</Text>
        </View>
      </View>

      {/* Exercises */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.exercisesList}>
          {currentSession.exercises.map(renderExercise)}
          
          <TouchableOpacity
            style={styles.addExerciseCard}
            onPress={() => setIsAddExerciseModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.finishButton}
          onPress={finishWorkout}
          disabled={isLoading}
        >
          <Text style={styles.finishButtonText}>
            {isLoading ? 'Finishing...' : 'Finish Workout'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Exercise Modal */}
      <Modal
        visible={isAddExerciseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddExerciseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Exercise name"
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewExerciseName('');
                  setIsAddExerciseModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addExercise}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  exitButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 4,
  },
  modeBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exercisesList: {
    paddingVertical: 16,
  },
  exerciseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
  },
  removeExerciseButton: {
    padding: 4,
  },
  exerciseInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6E6E73',
    marginBottom: 4,
  },
  paramInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#FAFAFA',
  },
  addExerciseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  addExerciseText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
  },
  finishButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6E6E73',
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});