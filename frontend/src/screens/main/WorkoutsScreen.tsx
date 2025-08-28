import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useWorkoutStore } from '../../store/workout';

type WorkoutsScreenNavigationProp = NativeStackNavigationProp<any>;

export default function WorkoutsScreen() {
  const navigation = useNavigation<WorkoutsScreenNavigationProp>();
  const { currentSession, weeklyStats, fetchWeeklyStats } = useWorkoutStore();

  useEffect(() => {
    fetchWeeklyStats();
  }, [fetchWeeklyStats]);

  // If there's a current session, navigate to tracking
  useEffect(() => {
    if (currentSession) {
      navigation.navigate('SessionTrack');
    }
  }, [currentSession, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Workouts</Text>
          <TouchableOpacity
            style={styles.templatesButton}
            onPress={() => navigation.navigate('TemplatesList')}
          >
            <Ionicons name="library" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Quick Start */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Start</Text>
            <View style={styles.quickStartRow}>
              <TouchableOpacity
                style={[styles.quickStartButton, styles.gymButton]}
                onPress={() => navigation.navigate('SessionStart', { mode: 'gym' })}
              >
                <Ionicons name="fitness" size={24} color="white" />
                <Text style={styles.quickStartText}>Start Gym Workout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickStartButton, styles.homeButton]}
                onPress={() => navigation.navigate('SessionStart', { mode: 'home' })}
              >
                <Ionicons name="home" size={24} color="white" />
                <Text style={styles.quickStartText}>Start Home Workout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekly Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {weeklyStats?.sessions_count || 0}
                </Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {weeklyStats?.total_duration 
                    ? Math.round(weeklyStats.total_duration / 60) 
                    : 0}
                </Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {weeklyStats?.total_volume 
                    ? Math.round(weeklyStats.total_volume) 
                    : 0}
                </Text>
                <Text style={styles.statLabel}>Volume (kg)</Text>
              </View>
            </View>
          </View>

          {/* Templates */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Templates</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => navigation.navigate('TemplatesList')}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.templateActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('TemplatesList')}
              >
                <Ionicons name="list" size={20} color="#007AFF" />
                <Text style={styles.actionButtonText}>Browse Templates</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('TemplateCreateEdit')}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.actionButtonText}>Create Template</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  templatesButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  quickStartRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  gymButton: {
    backgroundColor: '#007AFF',
  },
  homeButton: {
    backgroundColor: '#34C759',
  },
  quickStartText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
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
    fontSize: 28,
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
  templateActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});