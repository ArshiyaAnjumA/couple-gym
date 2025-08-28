import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HabitsListScreen from '../screens/habits/HabitsListScreen';
import HabitCreateEditScreen from '../screens/habits/HabitCreateEditScreen';

export type HabitStackParamList = {
  HabitsList: undefined;
  HabitCreateEdit: { habitId?: string } | undefined;
  HabitDetail: { habitId: string };
};

const Stack = createNativeStackNavigator<HabitStackParamList>();

export default function HabitNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="HabitsList" component={HabitsListScreen} />
      <Stack.Screen name="HabitCreateEdit" component={HabitCreateEditScreen} />
    </Stack.Navigator>
  );
}