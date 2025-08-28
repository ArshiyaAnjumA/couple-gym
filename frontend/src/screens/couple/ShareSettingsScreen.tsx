import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useCoupleStore } from '../../store/couple';

type ShareSettingsScreenNavigationProp = NativeStackNavigationProp<any>;

export default function ShareSettingsScreen() {
  const navigation = useNavigation<ShareSettingsScreenNavigationProp>();
  const {
    couple,
    settings,
    members,
    isLoading,
    error,
    updateSettings,
    leaveCouple,
    clearError,
  } = useCoupleStore();

  const [localSettings, setLocalSettings] = useState({
    share_progress_enabled: settings?.share_progress_enabled || false,
    share_habits_enabled: settings?.share_habits_enabled || false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        share_progress_enabled: settings.share_progress_enabled,
        share_habits_enabled: settings.share_habits_enabled,
      });
    }
  }, [settings]);

  useEffect(() => {
    const changed = 
      localSettings.share_progress_enabled !== settings?.share_progress_enabled ||
      localSettings.share_habits_enabled !== settings?.share_habits_enabled;
    setHasChanges(changed);
  }, [localSettings, settings]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleSaveSettings = async () => {
    try {
      await updateSettings(localSettings);
      Alert.alert('Success', 'Sharing settings updated successfully!');
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleLeaveCouple = () => {
    Alert.alert(
      'Leave Couple',
      'Are you sure you want to leave this couple? This action cannot be undone and you will need a new invite to rejoin.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCouple();
              navigation.reset({
                index: 0,
                routes: [{ name: 'CoupleHome' }],
              });
            } catch (error) {
              // Error is handled by the store
            }
          },
        },
      ]
    );
  };

  if (!couple || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const partner = members.find(member => member.user_id !== couple.id);

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
        <Text style={styles.title}>Sharing Settings</Text>
        {hasChanges && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSettings}
            disabled={isLoading}
          >
            <Text style={styles.saveText}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        )}
        {!hasChanges && <View style={styles.placeholder} />}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Notice */}
        <View style={styles.section}>
          <View style={styles.privacyHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#34C759" />
            <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
          </View>
          <Text style={styles.privacyDescription}>
            You have complete control over what information is shared with your partner. Only the data you explicitly choose to share will be visible to them.
          </Text>
        </View>

        {/* Progress Sharing */}
        <View style={styles.section}>
          <View style={styles.settingHeader}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Progress Sharing</Text>
              <Text style={styles.settingDescription}>
                Share your workout sessions, weekly statistics, and fitness progress with your partner
              </Text>
            </View>
            <Switch
              value={localSettings.share_progress_enabled}
              onValueChange={(value) => 
                setLocalSettings(prev => ({ ...prev, share_progress_enabled: value }))
              }
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="white"
            />
          </View>
          
          {localSettings.share_progress_enabled && (
            <View style={styles.sharingDetails}>
              <Text style={styles.detailsTitle}>What will be shared:</Text>
              <View style={styles.detailsList}>
                <View style={styles.detailItem}>
                  <Ionicons name="checkmark" size={16} color="#34C759" />
                  <Text style={styles.detailText}>Completed workout sessions</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="checkmark" size={16} color="#34C759" />
                  <Text style={styles.detailText}>Weekly workout statistics</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="checkmark" size={16} color="#34C759" />
                  <Text style={styles.detailText}>Exercise names and duration</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="close" size={16} color="#FF3B30" />
                  <Text style={styles.detailText}>Personal notes or detailed metrics</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Habits Sharing */}
        <View style={styles.section}>
          <View style={styles.settingHeader}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Habits Sharing</Text>
              <Text style={styles.settingDescription}>
                Share your habit completion status and streaks to stay accountable together
              </Text>
            </View>
            <Switch
              value={localSettings.share_habits_enabled}
              onValueChange={(value) => 
                setLocalSettings(prev => ({ ...prev, share_habits_enabled: value }))
              }
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="white"
            />
          </View>
          
          {localSettings.share_habits_enabled && (
            <View style={styles.sharingDetails}>
              <Text style={styles.detailsTitle}>What will be shared:</Text>
              <View style={styles.detailsList}>
                <View style={styles.detailItem}>
                  <Ionicons name="checkmark" size={16} color="#34C759" />
                  <Text style={styles.detailText}>Habit names and completion status</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="checkmark" size={16} color="#34C759" />
                  <Text style={styles.detailText}>Daily completion streaks</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="checkmark" size={16} color="#34C759" />
                  <Text style={styles.detailText}>Weekly completion rates</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="close" size={16} color="#FF3B30" />
                  <Text style={styles.detailText}>Personal notes or reminders</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Benefits of Sharing */}
        {(localSettings.share_progress_enabled || localSettings.share_habits_enabled) && (
          <View style={styles.section}>
            <Text style={styles.benefitsTitle}>Benefits of Sharing</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="heart" size={20} color="#FF3B30" />
                <Text style={styles.benefitText}>Stay motivated together</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="trophy" size={20} color="#FF9500" />
                <Text style={styles.benefitText}>Celebrate achievements</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="people" size={20} color="#007AFF" />
                <Text style={styles.benefitText}>Support each other's goals</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="trending-up" size={20} color="#34C759" />
                <Text style={styles.benefitText}>Track progress together</Text>
              </View>
            </View>
          </View>
        )}

        {/* Partner Info */}
        {partner && (
          <View style={styles.section}>
            <Text style={styles.partnerTitle}>Sharing With</Text>
            <View style={styles.partnerCard}>
              <View style={styles.partnerAvatar}>
                <Text style={styles.partnerInitial}>
                  {partner.user.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.partnerInfo}>
                <Text style={styles.partnerName}>{partner.user.full_name}</Text>
                <Text style={styles.partnerEmail}>{partner.user.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleLeaveCouple}
          >
            <Ionicons name="exit" size={20} color="#FF3B30" />
            <Text style={styles.dangerButtonText}>Leave Couple</Text>
          </TouchableOpacity>
          <Text style={styles.dangerDescription}>
            This will remove you from the couple and stop all data sharing. This action cannot be undone.
          </Text>
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
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  privacyDescription: {
    fontSize: 14,
    color: '#6E6E73',
    lineHeight: 20,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6E6E73',
    lineHeight: 18,
  },
  sharingDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  detailsList: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6E6E73',
    flex: 1,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#1D1D1F',
  },
  partnerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  partnerInitial: {
    fontSize: 18,
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
    marginBottom: 2,
  },
  partnerEmail: {
    fontSize: 14,
    color: '#6E6E73',
  },
  dangerSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  dangerDescription: {
    fontSize: 14,
    color: '#6E6E73',
    lineHeight: 18,
  },
});