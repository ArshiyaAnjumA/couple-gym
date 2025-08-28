import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useCoupleStore } from '../../store/couple';
import { useAuthStore } from '../../store/auth';

type CoupleHomeScreenNavigationProp = NativeStackNavigationProp<any>;

export default function CoupleHomeScreen() {
  const navigation = useNavigation<CoupleHomeScreenNavigationProp>();
  const { user } = useAuthStore();
  const {
    couple,
    members,
    settings,
    inviteCode,
    sharedFeed,
    isLoading,
    error,
    fetchCoupleInfo,
    generateInvite,
    fetchSharedFeed,
    clearError,
  } = useCoupleStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCoupleInfo();
  }, [fetchCoupleInfo]);

  useEffect(() => {
    if (couple) {
      fetchSharedFeed();
    }
  }, [couple, fetchSharedFeed]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchCoupleInfo();
    if (couple) {
      await fetchSharedFeed();
    }
    setIsRefreshing(false);
  };

  const handleGenerateInvite = async () => {
    try {
      const code = await generateInvite();
      Alert.alert(
        'Invite Code Generated',
        `Share this code with your partner: ${code}`,
        [
          { text: 'Copy Code', onPress: () => handleShareInvite(code) },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      // Error is handled by store
    }
  };

  const handleShareInvite = async (code: string) => {
    try {
      await Share.share({
        message: `Join me on Couples Workout! Use this invite code: ${code}`,
        title: 'Couples Workout Invite',
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  };

  const handleCreateCouple = () => {
    navigation.navigate('InviteAccept');
  };

  if (isLoading && !couple) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading couple info...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!couple) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Couple</Text>
          
          <View style={styles.noCoupleContainer}>
            <View style={styles.noCoupleIcon}>
              <Ionicons name="people-outline" size={80} color="#C7C7CC" />
            </View>
            <Text style={styles.noCoupleTitle}>No Couple Found</Text>
            <Text style={styles.noCoupleSubtitle}>
              Create a new couple or join an existing one to start sharing your fitness journey
            </Text>
            
            <View style={styles.noCoupleActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCreateCouple}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const partner = members.find(member => member.user_id !== user?.id);
  const isOwner = members.find(member => member.user_id === user?.id)?.role === 'owner';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Couple</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('ShareSettings')}
          >
            <Ionicons name="settings" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members</Text>
          
          <View style={styles.membersContainer}>
            {members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {member.user.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.user.full_name}</Text>
                  <Text style={styles.memberRole}>
                    {member.role === 'owner' ? 'Owner' : 'Member'} • Joined {format(new Date(member.joined_at), 'MMM yyyy')}
                  </Text>
                </View>
                {member.user_id === user?.id && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youText}>You</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {members.length < 2 && (
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={handleGenerateInvite}
              disabled={isLoading}
            >
              <Ionicons name="person-add" size={20} color="#007AFF" />
              <Text style={styles.inviteButtonText}>
                {isLoading ? 'Generating...' : 'Invite Partner'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sharing Settings Preview */}
        {settings && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sharing Settings</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('ShareSettings')}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingsPreview}>
              <View style={styles.settingRow}>
                <Ionicons name="analytics" size={20} color="#007AFF" />
                <Text style={styles.settingLabel}>Progress Sharing</Text>
                <Ionicons 
                  name={settings.share_progress_enabled ? 'checkmark-circle' : 'close-circle'} 
                  size={20} 
                  color={settings.share_progress_enabled ? '#34C759' : '#8E8E93'} 
                />
              </View>
              
              <View style={styles.settingRow}>
                <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                <Text style={styles.settingLabel}>Habits Sharing</Text>
                <Ionicons 
                  name={settings.share_habits_enabled ? 'checkmark-circle' : 'close-circle'} 
                  size={20} 
                  color={settings.share_habits_enabled ? '#34C759' : '#8E8E93'} 
                />
              </View>
            </View>
          </View>
        )}

        {/* Shared Feed */}
        {partner && (settings?.share_progress_enabled || settings?.share_habits_enabled) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shared Activity</Text>
            
            {sharedFeed.length > 0 ? (
              <View style={styles.feedContainer}>
                {sharedFeed.slice(0, 5).map((item) => (
                  <View key={item.id} style={styles.feedItem}>
                    <View style={styles.feedIcon}>
                      <Ionicons 
                        name={
                          item.type === 'workout' ? 'fitness' :
                          item.type === 'habit' ? 'checkmark-circle' : 'analytics'
                        } 
                        size={16} 
                        color="#007AFF" 
                      />
                    </View>
                    <View style={styles.feedContent}>
                      <Text style={styles.feedText}>{item.content}</Text>
                      <Text style={styles.feedTime}>
                        {format(new Date(item.created_at), 'MMM d, h:mm a')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyFeed}>
                <Ionicons name="heart-outline" size={32} color="#C7C7CC" />
                <Text style={styles.emptyFeedText}>
                  No shared activities yet. Start working out and building habits together!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* No Partner State */}
        {!partner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get Started Together</Text>
            <View style={styles.getStartedCard}>
              <Ionicons name="heart" size={32} color="#FF3B30" />
              <Text style={styles.getStartedTitle}>Invite Your Partner</Text>
              <Text style={styles.getStartedDescription}>
                Share your fitness journey together. Invite your partner to track workouts, build habits, and stay motivated as a couple.
              </Text>
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={handleGenerateInvite}
              >
                <Text style={styles.getStartedButtonText}>Generate Invite Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  settingsButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6E6E73',
    marginTop: 12,
  },
  noCoupleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noCoupleIcon: {
    marginBottom: 24,
  },
  noCoupleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  noCoupleSubtitle: {
    fontSize: 16,
    color: '#6E6E73',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  noCoupleActions: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  editButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  membersContainer: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: '#6E6E73',
  },
  youBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  youText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    borderStyle: 'dashed',
    gap: 8,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  settingsPreview: {
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1D1D1F',
  },
  feedContainer: {
    gap: 12,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  feedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedContent: {
    flex: 1,
  },
  feedText: {
    fontSize: 14,
    color: '#1D1D1F',
    marginBottom: 2,
  },
  feedTime: {
    fontSize: 12,
    color: '#6E6E73',
  },
  emptyFeed: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyFeedText: {
    fontSize: 14,
    color: '#6E6E73',
    textAlign: 'center',
    marginTop: 8,
  },
  getStartedCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  getStartedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginTop: 12,
    marginBottom: 8,
  },
  getStartedDescription: {
    fontSize: 14,
    color: '#6E6E73',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  getStartedButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});