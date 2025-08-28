import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CoupleHomeScreen from '../screens/couple/CoupleHomeScreen';
import InviteAcceptScreen from '../screens/couple/InviteAcceptScreen';
import ShareSettingsScreen from '../screens/couple/ShareSettingsScreen';

export type CoupleStackParamList = {
  CoupleHome: undefined;
  InviteAccept: undefined;
  ShareSettings: undefined;
};

const Stack = createNativeStackNavigator<CoupleStackParamList>();

export default function CoupleNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="CoupleHome" component={CoupleHomeScreen} />
      <Stack.Screen name="InviteAccept" component={InviteAcceptScreen} />
      <Stack.Screen name="ShareSettings" component={ShareSettingsScreen} />
    </Stack.Navigator>
  );
}