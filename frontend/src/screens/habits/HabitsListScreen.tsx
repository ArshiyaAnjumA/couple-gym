import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfWeek, addDays } from 'date-fns';

import { useHabitStore } from '../../store/habit';
import { Habit } from '../../types/habit';

type HabitsListScreenNavigationProp = NativeStackNavigationProp<any>;

export default function HabitsListScreen() {
  const navigation = useNavigation<HabitsListScreenNavigationProp>();
  const { 
    habits, 
    isLoading, 
    error, 
    fetchHabits, 
    fetchLogs,
    logHabit,
    getLogsForDate,
    clearError 
  } = useHabitStore();

  const [selectedDate] = useState(new Date());

  useEffect(() => {
    fetchHabits();
    // Fetch logs for current week
    const weekStart = startOfWeek(new Date());
    const weekEnd = addDays(weekStart, 6);
    fetchLogs(
      format(weekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd')
    );
  }, [fetchHabits, fetchLogs]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const todayStr = format(selectedDate, 'yyyy-MM-dd');
  const todayLogs = getLogsForDate(todayStr);

  const getHabitStatusForToday = (habitId: string) => {
    const log = todayLogs.find(log => log.habit_id === habitId);
    return log?.status || null;
  };

  const handleHabitAction = async (habitId: string, status: 'done' | 'skipped') => {
    try {
      await logHabit(habitId, {
        date: todayStr,
        status,
      });
    } catch (error) {
      // Error is handled by the store
    }
  };

  const renderHabit = ({ item: habit }: { item: Habit }) => {
    const status = getHabitStatusForToday(habit.id);
    const isDone = status === 'done';
    const isSkipped = status === 'skipped';

    return (
      <TouchableOpacity
        style={styles.habitCard}
        onPress={() => navigation.navigate('HabitDetail', { habitId: habit.id })}
      >
        <View style={styles.habitInfo}>
          <Text style={styles.habitName}>{habit.name}</Text>
          <Text style={styles.habitCadence}>
            {habit.cadence.charAt(0).toUpperCase() + habit.cadence.slice(1)}
            {habit.reminder_enabled && ' • Reminder'}
          </Text>
        </View>

        <View style={styles.habitActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              isSkipped && styles.skipButtonActive,
            ]}
            onPress={() => handleHabitAction(habit.id, 'skipped')}
          >
            <Ionicons 
              name="close" 
              size={16} 
              color={isSkipped ? 'white' : '#FF3B30'} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              isDone && styles.doneButtonActive,
            ]}
            onPress={() => handleHabitAction(habit.id, 'done')}
          >
            <Ionicons 
              name="checkmark" 
              size={16} 
              color={isDone ? 'white' : '#34C759'} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-circle-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No habits yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first habit to start building better routines
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('HabitCreateEdit')}
      >
        <Text style={styles.createButtonText}>Create Habit</Text>
      </TouchableOpacity>
    </View>
  );

  const activeHabits = habits.filter(h => h.is_active);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Habits</Text>
          <Text style={styles.dateText}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('HabitCreateEdit')}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {todayLogs.filter(log => log.status === 'done').length}
          </Text>
          <Text style={styles.statLabel}>Completed Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activeHabits.length}</Text>
          <Text style={styles.statLabel}>Total Habits</Text>
        </View>
      </View>

      {/* Habits List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={activeHabits}
          renderItem={renderHabit}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  dateText: {
    fontSize: 16,
    color: '#6E6E73',
    marginTop: 4,
  },
  addButton: {
    padding: 8,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6E6E73',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  habitCadence: {
    fontSize: 14,
    color: '#6E6E73',
  },
  habitActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  skipButtonActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  doneButtonActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6E6E73',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});