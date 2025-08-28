import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/auth';
import { useWorkoutStore } from '../../store/workout';
import { useHabitStore } from '../../store/habit';
import { useCoupleStore } from '../../store/couple';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfWeek, addDays } from 'date-fns';

export default function DashboardScreen() {
  const { user, logout, checkAuthStatus } = useAuthStore();
  const { weeklyStats, fetchWeeklyStats, isLoading: workoutLoading } = useWorkoutStore();
  const { habits, logsIndexByDate, fetchHabits, fetchLogs, getLogsForDate, isLoading: habitLoading } = useHabitStore();
  const { couple, members, settings, sharedFeed, fetchCoupleInfo, fetchSharedFeed } = useCoupleStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    loadDashboardData();
  }, [checkAuthStatus]);

  const loadDashboardData = async () => {
    // Load workout stats
    fetchWeeklyStats();
    
    // Load habits and current week logs
    fetchHabits();
    const weekStart = startOfWeek(new Date());
    const weekEnd = addDays(weekStart, 6);
    fetchLogs(
      format(weekStart, 'yyyy-MM-dd'),
      format(weekEnd, 'yyyy-MM-dd')
    );
    
    // Load couple info and shared feed
    fetchCoupleInfo();
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    if (couple) {
      await fetchSharedFeed();
    }
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  // Calculate habit completion for today
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLogs = getLogsForDate(today);
  const completedHabitsToday = todayLogs.filter(log => log.status === 'done').length;
  const activeHabits = habits.filter(h => h.is_active);
  
  // Calculate weekly habit completion rate
  const weekStart = startOfWeek(new Date());
  const weekEnd = addDays(weekStart, 6);
  let weeklyHabitCompletions = 0;
  let weeklyHabitTotal = 0;
  
  for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayLogs = getLogsForDate(dateStr);
    weeklyHabitCompletions += dayLogs.filter(log => log.status === 'done').length;
    weeklyHabitTotal += activeHabits.length;
  }
  
  const weeklyHabitRate = weeklyHabitTotal > 0 ? Math.round((weeklyHabitCompletions / weeklyHabitTotal) * 100) : 0;
  
  // Get partner info
  const partner = members.find(member => member.user_id !== user?.id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome back, {user?.full_name}!</Text>
          <Text style={styles.welcomeSubtitle}>
            {partner 
              ? `Ready to continue your fitness journey with ${partner.user.full_name}?`
              : "Ready to continue your fitness journey?"
            }
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              {workoutLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.statNumber}>{weeklyStats?.sessions_count || 0}</Text>
              )}
              <Text style={styles.statLabel}>Workouts</Text>
              <Text style={styles.statSubLabel}>
                {weeklyStats?.total_duration 
                  ? `${Math.round(weeklyStats.total_duration / 60)}min total`
                  : 'Get started!'
                }
              </Text>
            </View>
            
            <View style={styles.statCard}>
              {habitLoading ? (
                <ActivityIndicator size="small" color="#34C759" />
              ) : (
                <Text style={styles.statNumber}>{weeklyHabitRate}%</Text>
              )}
              <Text style={styles.statLabel}>Habits</Text>
              <Text style={styles.statSubLabel}>
                {completedHabitsToday}/{activeHabits.length} today
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {weeklyStats?.total_volume 
                  ? `${Math.round(weeklyStats.total_volume / 1000)}k`
                  : '0'
                }
              </Text>
              <Text style={styles.statLabel}>Volume</Text>
              <Text style={styles.statSubLabel}>kg lifted</Text>
            </View>
          </View>
        </View>

        {/* Partner Section */}
        {partner && (settings?.share_progress_enabled || settings?.share_habits_enabled) && (
          <View style={styles.partnerSection}>
            <Text style={styles.sectionTitle}>Partner Activity</Text>
            
            <View style={styles.partnerCard}>
              <View style={styles.partnerHeader}>
                <View style={styles.partnerAvatar}>
                  <Text style={styles.partnerInitial}>
                    {partner.user.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{partner.user.full_name}</Text>
                  <Text style={styles.partnerStatus}>
                    {sharedFeed.length > 0 
                      ? `Last active ${format(new Date(sharedFeed[0].created_at), 'MMM d')}`
                      : 'No recent activity'
                    }
                  </Text>
                </View>
                <Ionicons name="heart" size={20} color="#FF3B30" />
              </View>
              
              {sharedFeed.length > 0 ? (
                <View style={styles.recentActivity}>
                  <Text style={styles.activityTitle}>Recent Activity</Text>
                  {sharedFeed.slice(0, 3).map((item) => (
                    <View key={item.id} style={styles.activityItem}>
                      <Ionicons 
                        name={
                          item.type === 'workout' ? 'fitness' :
                          item.type === 'habit' ? 'checkmark-circle' : 'analytics'
                        } 
                        size={14} 
                        color="#007AFF" 
                      />
                      <Text style={styles.activityText}>{item.content}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noActivity}>
                  <Text style={styles.noActivityText}>
                    No shared activities yet. Encourage each other to get started!
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="add" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Start Workout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.actionButtonText}>Log Habits</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Motivational Section */}
        <View style={styles.motivationSection}>
          {weeklyStats && weeklyStats.sessions_count > 0 ? (
            <>
              <Text style={styles.motivationTitle}>🔥 You're on fire!</Text>
              <Text style={styles.motivationText}>
                {weeklyStats.sessions_count} workout{weeklyStats.sessions_count !== 1 ? 's' : ''} this week. 
                Keep up the momentum!
              </Text>
            </>
          ) : completedHabitsToday > 0 ? (
            <>
              <Text style={styles.motivationTitle}>✨ Great habits!</Text>
              <Text style={styles.motivationText}>
                {completedHabitsToday} habit{completedHabitsToday !== 1 ? 's' : ''} completed today. 
                Small steps lead to big changes!
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.motivationTitle}>🌟 Ready to start?</Text>
              <Text style={styles.motivationText}>
                Every journey begins with a single step. Start with a quick workout or mark off a habit!
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
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
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6E6E73',
    lineHeight: 22,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#1D1D1F',
    fontWeight: '600',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 12,
    color: '#6E6E73',
    textAlign: 'center',
  },
  partnerSection: {
    marginBottom: 24,
  },
  partnerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  partnerInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  partnerStatus: {
    fontSize: 14,
    color: '#6E6E73',
  },
  recentActivity: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  activityText: {
    fontSize: 14,
    color: '#6E6E73',
    flex: 1,
  },
  noActivity: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    alignItems: 'center',
  },
  noActivityText: {
    fontSize: 14,
    color: '#6E6E73',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quickActions: {
    marginBottom: 24,
  },
  actionsGrid: {
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
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  motivationSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: '#6E6E73',
    textAlign: 'center',
    lineHeight: 20,
  },
});