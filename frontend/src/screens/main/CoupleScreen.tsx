import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function CoupleScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Couple</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>💕 Couple features coming in Phase 2</Text>
          <Text style={styles.placeholderSubtext}>
            • Invite partner with code{'\n'}
            • Share progress permissions{'\n'}
            • Shared activity feed{'\n'}
            • Partner motivation
          </Text>
        </View>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 24,
  },
  placeholder: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6E6E73',
    textAlign: 'center',
    lineHeight: 20,
  },
});