import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WorkoutsScreen from '../screens/main/WorkoutsScreen';
import TemplatesListScreen from '../screens/workouts/TemplatesListScreen';
import TemplateCreateEditScreen from '../screens/workouts/TemplateCreateEditScreen';
import SessionStartScreen from '../screens/workouts/SessionStartScreen';
import SessionTrackScreen from '../screens/workouts/SessionTrackScreen';

export type WorkoutStackParamList = {
  WorkoutsScreen: undefined;
  TemplatesList: undefined;
  TemplateCreateEdit: { templateId?: string; mode?: 'gym' | 'home' } | undefined;
  TemplateDetail: { templateId: string };
  SessionStart: { templateId?: string; mode?: 'gym' | 'home' } | undefined;
  SessionTrack: undefined;
  SessionSummary: undefined;
};

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export default function WorkoutNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="WorkoutsScreen" component={WorkoutsScreen} />
      <Stack.Screen name="TemplatesList" component={TemplatesListScreen} />
      <Stack.Screen name="TemplateCreateEdit" component={TemplateCreateEditScreen} />
      <Stack.Screen name="SessionStart" component={SessionStartScreen} />
      <Stack.Screen name="SessionTrack" component={SessionTrackScreen} />
    </Stack.Navigator>
  );
}