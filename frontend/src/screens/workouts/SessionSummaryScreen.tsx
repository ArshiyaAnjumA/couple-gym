import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useWorkoutStore } from '../../store/workout';

type SessionSummaryScreenNavigationProp = NativeStackNavigationProp<any>;

export default function SessionSummaryScreen() {
  const navigation = useNavigation<SessionSummaryScreenNavigationProp>();
  const { weeklyStats, fetchWeeklyStats } = useWorkoutStore();

  const [sessionData] = useState(() => {
    // This would typically come from navigation params or a completed session
    // For now, we'll create mock data based on the last session
    const now = new Date();
    const startTime = new Date(now.getTime() - 45 * 60 * 1000); // 45 minutes ago
    
    return {
      name: 'Chest & Triceps',
      mode: 'gym' as const,
      duration: 45 * 60, // 45 minutes in seconds
      exercises: [
        { name: 'Bench Press', sets: 4, reps: 12, weight: 80 },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 35 },
        { name: 'Tricep Dips', sets: 3, reps: 15 },
        { name: 'Push-ups', sets: 2, reps: 20 },
      ],
      totalVolume: calculateTotalVolume([
        { name: 'Bench Press', sets: 4, reps: 12, weight: 80 },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 35 },
        { name: 'Tricep Dips', sets: 3, reps: 15 },
        { name: 'Push-ups', sets: 2, reps: 20 },
      ]),
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
    };
  });

  useEffect(() => {
    fetchWeeklyStats();
  }, [fetchWeeklyStats]);

  function calculateTotalVolume(exercises: any[]): number {
    return exercises.reduce((total, exercise) => {
      if (exercise.weight && exercise.sets && exercise.reps) {
        return total + (exercise.weight * exercise.sets * exercise.reps);
      }
      return total;
    }, 0);
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleDone = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'WorkoutsScreen' }],
    });
  };

  const handleShareWorkout = () => {
    Alert.alert(
      'Share Workout',
      'Workout sharing with partner will be available in the next update!',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Workout Complete!</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleDone}>
          <Ionicons name="close" size={24} color="#6E6E73" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Celebration Section */}
        <View style={styles.celebrationSection}>
          <View style={styles.celebrationIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#34C759" />
          </View>
          <Text style={styles.celebrationTitle}>Great Job!</Text>
          <Text style={styles.celebrationSubtitle}>
            You've completed another step towards your fitness goals
          </Text>
        </View>

        {/* Workout Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Workout Summary</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.workoutName}>{sessionData.name}</Text>
              <View style={[styles.modeBadge, sessionData.mode === 'gym' ? styles.gymBadge : styles.homeBadge]}>
                <Ionicons 
                  name={sessionData.mode === 'gym' ? 'fitness' : 'home'} 
                  size={12} 
                  color="white" 
                />
                <Text style={styles.modeText}>{sessionData.mode.toUpperCase()}</Text>
              </View>
            </View>
            
            <Text style={styles.workoutTime}>
              {format(new Date(sessionData.startTime), 'h:mm a')} - {format(new Date(sessionData.endTime), 'h:mm a')}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Session Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>{formatDuration(sessionData.duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="barbell" size={24} color="#FF9500" />
              <Text style={styles.statNumber}>{Math.round(sessionData.totalVolume)}</Text>
              <Text style={styles.statLabel}>Volume (kg)</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="list" size={24} color="#34C759" />
              <Text style={styles.statNumber}>{sessionData.exercises.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
          </View>
        </View>

        {/* Exercises Breakdown */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>Exercises Completed</Text>
          
          {sessionData.exercises.map((exercise, index) => (
            <View key={index} style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDetails}>
                {exercise.sets && exercise.reps ? (
                  `${exercise.sets} × ${exercise.reps}${exercise.weight ? ` @ ${exercise.weight}kg` : ''}`
                ) : (
                  'Completed'
                )}
              </Text>
            </View>
          ))}
        </View>

        {/* Weekly Progress */}
        {weeklyStats && (
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>This Week's Progress</Text>
            
            <View style={styles.progressCard}>
              <View style={styles.progressStat}>
                <Text style={styles.progressNumber}>{weeklyStats.sessions_count}</Text>
                <Text style={styles.progressLabel}>Total Workouts</Text>
              </View>
              
              <View style={styles.progressDivider} />
              
              <View style={styles.progressStat}>
                <Text style={styles.progressNumber}>
                  {formatDuration(weeklyStats.total_duration)}
                </Text>
                <Text style={styles.progressLabel}>Total Time</Text>
              </View>
              
              <View style={styles.progressDivider} />
              
              <View style={styles.progressStat}>
                <Text style={styles.progressNumber}>
                  {Math.round(weeklyStats.total_volume)}
                </Text>
                <Text style={styles.progressLabel}>Total Volume</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareWorkout}>
          <Ionicons name="share" size={20} color="#007AFF" />
          <Text style={styles.shareButtonText}>Share with Partner</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  celebrationSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  celebrationIcon: {
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: '#6E6E73',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  gymBadge: {
    backgroundColor: '#007AFF',
  },
  homeBadge: {
    backgroundColor: '#34C759',
  },
  modeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  workoutTime: {
    fontSize: 14,
    color: '#6E6E73',
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6E6E73',
  },
  exercisesSection: {
    marginBottom: 24,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
    flex: 1,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#6E6E73',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressStat: {
    flex: 1,
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6E6E73',
  },
  progressDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  doneButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
});