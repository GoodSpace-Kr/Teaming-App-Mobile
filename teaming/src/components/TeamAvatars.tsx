import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function TeamAvatars() {
  return (
    <View style={styles.container}>
      <View style={[styles.circle, styles.blue]} />
      <View style={[styles.circle, styles.indigo]} />
      <View style={[styles.circle, styles.purple]} />
      <View style={[styles.circle, styles.teal]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  circle: {
    borderRadius: 50,
  },
  blue: {
    width: 16,
    height: 16,
    backgroundColor: '#3B82F6',
  },
  indigo: {
    width: 20,
    height: 20,
    backgroundColor: '#6366F1',
  },
  purple: {
    width: 14,
    height: 14,
    backgroundColor: '#8B5CF6',
  },
  teal: {
    width: 18,
    height: 18,
    backgroundColor: '#14B8A6',
  },
});
