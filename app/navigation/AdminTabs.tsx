//navigation/AdminTabs.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Dashboard from "../../screens/Dashboard";
import { Ionicons } from "@expo/vector-icons";

export type AdminTabParamList = {
  Dashboard: undefined;
  Members: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();
const { TailwindProvider } = require("nativewind");

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF8C42",
        tabBarStyle: { backgroundColor: "#FFF5E6" },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
