import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../../screens/Home";
import UserTabs from "./UserTabs";
import AdminTabs from "./AdminTabs";

export type RootStackParamList = {
  Landing: undefined;
  Home: undefined;
  UserTabs: undefined;
  AdminTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* First screen that loads */}
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="UserTabs" component={UserTabs} />
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
