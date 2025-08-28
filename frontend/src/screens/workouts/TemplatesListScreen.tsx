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

import { useWorkoutStore } from '../../store/workout';
import { WorkoutTemplate } from '../../types/workout';

type TemplatesListScreenNavigationProp = NativeStackNavigationProp<any>;

export default function TemplatesListScreen() {
  const navigation = useNavigation<TemplatesListScreenNavigationProp>();
  const { 
    templates, 
    myTemplates, 
    systemTemplates, 
    isLoading, 
    error, 
    fetchTemplates, 
    clearError 
  } = useWorkoutStore();

  const [selectedMode, setSelectedMode] = useState<'all' | 'gym' | 'home'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'mine' | 'system'>('all');

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const getFilteredTemplates = (): WorkoutTemplate[] => {
    let filtered = templates;
    
    // Filter by type (mine vs system)
    if (selectedType === 'mine') {
      filtered = myTemplates;
    } else if (selectedType === 'system') {
      filtered = systemTemplates;
    }
    
    // Filter by mode
    if (selectedMode !== 'all') {
      filtered = filtered.filter(template => template.mode === selectedMode);
    }
    
    return filtered;
  };

  const renderTemplate = ({ item }: { item: WorkoutTemplate }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id })}
    >
      <View style={styles.templateHeader}>
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.templateDescription}>{item.description}</Text>
          )}
        </View>
        <View style={styles.templateMeta}>
          <View style={[styles.modeBadge, item.mode === 'gym' ? styles.gymBadge : styles.homeBadge]}>
            <Ionicons 
              name={item.mode === 'gym' ? 'fitness' : 'home'} 
              size={12} 
              color="white" 
            />
            <Text style={styles.modeText}>{item.mode.toUpperCase()}</Text>
          </View>
          {item.is_system && (
            <Text style={styles.systemLabel}>System</Text>
          )}
        </View>
      </View>
      
      <View style={styles.exercisesPreview}>
        <Text style={styles.exercisesText}>
          {item.exercises.length} exercise{item.exercises.length !== 1 ? 's' : ''}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="fitness-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No templates found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedType === 'mine' 
          ? 'Create your first workout template'
          : 'Try adjusting your filters'
        }
      </Text>
      {selectedType === 'mine' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('TemplateCreateEdit')}
        >
          <Text style={styles.createButtonText}>Create Template</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const filteredTemplates = getFilteredTemplates();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Workout Templates</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('TemplateCreateEdit')}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Type Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Type</Text>
          <View style={styles.filterRow}>
            {[
              { key: 'all', label: 'All' },
              { key: 'mine', label: 'Mine' },
              { key: 'system', label: 'System' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  selectedType === filter.key && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedType(filter.key as any)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedType === filter.key && styles.filterChipTextSelected,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mode Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Mode</Text>
          <View style={styles.filterRow}>
            {[
              { key: 'all', label: 'All', icon: 'ellipse' },
              { key: 'gym', label: 'Gym', icon: 'fitness' },
              { key: 'home', label: 'Home', icon: 'home' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  selectedMode === filter.key && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedMode(filter.key as any)}
              >
                <Ionicons 
                  name={filter.icon as any} 
                  size={14} 
                  color={selectedMode === filter.key ? 'white' : '#007AFF'} 
                />
                <Text
                  style={[
                    styles.filterChipText,
                    selectedMode === filter.key && styles.filterChipTextSelected,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Templates List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={filteredTemplates}
          renderItem={renderTemplate}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  addButton: {
    padding: 8,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 4,
  },
  filterChipSelected: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#007AFF',
  },
  filterChipTextSelected: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  templateCard: {
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
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6E6E73',
  },
  templateMeta: {
    alignItems: 'flex-end',
    gap: 4,
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
  systemLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  exercisesPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exercisesText: {
    fontSize: 14,
    color: '#6E6E73',
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